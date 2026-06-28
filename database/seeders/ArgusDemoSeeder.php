<?php

declare(strict_types=1);

namespace Database\Seeders;

use Argus\Alerting\AlertComparison;
use Argus\Alerting\AlertConditionType;
use Argus\Alerting\AlertService;
use Argus\Query\FilterBuilder;
use Argus\SavedSearches\SavedSearch;
use Argus\SavedSearches\SavedSearchService;
use Argus\Support\TransitionType;
use Illuminate\Database\Seeder;

/**
 * Seeds demo saved searches and alert rules so those screens are non-empty on
 * first load and at least one alert fires immediately after running the traffic
 * simulator.
 *
 * Idempotency: SavedSearchService::all() is used to check whether a search with
 * a given name already exists before creating it. Alert rules are checked via
 * AlertService::forSavedSearch() — if a rule with the same name already exists
 * on a search, it is skipped. Re-running the seeder after a `make fresh` is safe
 * because fresh wipes the database, and re-running against an already-seeded
 * database is also safe because of the name checks below.
 */
class ArgusDemoSeeder extends Seeder
{
    public function run(): void
    {
        /** @var SavedSearchService $searches */
        $searches = app(SavedSearchService::class);

        /** @var AlertService $alerts */
        $alerts = app(AlertService::class);

        // Index existing saved searches by name so we can skip duplicates.
        $existing = [];
        foreach ($searches->all() as $saved) {
            $existing[$saved->name] = $saved;
        }

        // ----------------------------------------------------------------
        // Saved searches
        // ----------------------------------------------------------------

        // "Billing failures" — billing queue, FAILED status.
        // The simulator fails ~30 % of billing jobs, so this fills up fast.
        $billing = $this->findOrCreate(
            $searches,
            $existing,
            'Billing failures',
            FilterBuilder::make()->queue('billing')->status(TransitionType::FAILED)->build(),
        );

        // "CRM failures" — crm queue, FAILED status.
        // The simulator fails ~45 % of CRM jobs — the noisiest queue.
        $crm = $this->findOrCreate(
            $searches,
            $existing,
            'CRM failures',
            FilterBuilder::make()->queue('crm')->status(TransitionType::FAILED)->build(),
        );

        // "Slow reports" — reports queue, all statuses.
        // Used for a LATENCY_P95 alert; no status filter so completed jobs are included.
        $reports = $this->findOrCreate(
            $searches,
            $existing,
            'Slow reports',
            FilterBuilder::make()->queue('reports')->build(),
        );

        // "All failures" — every queue, FAILED status.
        // Gives a single view of the full failure surface.
        $allFailures = $this->findOrCreate(
            $searches,
            $existing,
            'All failures',
            FilterBuilder::make()->status(TransitionType::FAILED)->build(),
        );

        // ----------------------------------------------------------------
        // Alert rules
        //
        // windowSeconds=900  (15 min rolling window)
        // cooldownSeconds=600  (10 min between repeated firings)
        // sinks=['webhook']
        // ----------------------------------------------------------------

        // COUNT rule on "Billing failures".
        // threshold=1 means it fires as soon as a single billing job fails.
        // Run `make simulate` then `make alerts` and this will breach immediately.
        $this->attachIfMissing(
            $alerts,
            $billing->id,
            'Billing failure count',
            threshold: 1,
            windowSeconds: 900,
            cooldownSeconds: 600,
            sinks: ['webhook'],
            conditionType: AlertConditionType::COUNT,
            comparison: AlertComparison::GREATER_THAN,
        );

        // FAILURE_RATE rule on "CRM failures" (which filters for FAILED jobs only).
        // threshold=40 means fire when > 40 % of CRM jobs fail — the simulator
        // drives ~45 % failure so this should breach after simulate + evaluate.
        // Note: FAILURE_RATE is computed against the saved search's own result set,
        // so filtering to FAILED jobs beforehand means the rate will typically be
        // 100 %. Adjust the threshold if you want it to reflect the full queue.
        $this->attachIfMissing(
            $alerts,
            $crm->id,
            'CRM high failure rate',
            threshold: 40,
            windowSeconds: 900,
            cooldownSeconds: 600,
            sinks: ['webhook'],
            conditionType: AlertConditionType::FAILURE_RATE,
            comparison: AlertComparison::GREATER_THAN,
        );

        // LATENCY_P95 rule on "Slow reports".
        // threshold=1500 ms — fires if the 95th-percentile processing time for
        // reports jobs exceeds 1.5 s over the rolling window.
        $this->attachIfMissing(
            $alerts,
            $reports->id,
            'Reports p95 latency',
            threshold: 1500,
            windowSeconds: 900,
            cooldownSeconds: 600,
            sinks: ['webhook'],
            conditionType: AlertConditionType::LATENCY_P95,
            comparison: AlertComparison::GREATER_THAN,
        );

        // STUCK_COUNT rule on "All failures".
        // threshold=2 — fires when more than 2 jobs have been STUCK for over 5
        // minutes (stuckSeconds=300). Useful for detecting runaway re-tries.
        $this->attachIfMissing(
            $alerts,
            $allFailures->id,
            'Global stuck jobs',
            threshold: 2,
            windowSeconds: 900,
            cooldownSeconds: 600,
            sinks: ['webhook'],
            conditionType: AlertConditionType::STUCK_COUNT,
            comparison: AlertComparison::GREATER_THAN,
            stuckSeconds: 300,
        );
    }

    /**
     * Return an existing saved search by name, or create and return a new one.
     *
     * @param  array<string, SavedSearch>  $existing  name -> SavedSearch map built at the top of run()
     */
    private function findOrCreate(
        SavedSearchService $service,
        array $existing,
        string $name,
        \Argus\Query\JobFilter $filter,
    ): SavedSearch {
        if (isset($existing[$name])) {
            $this->command?->info("  Skipping saved search \"{$name}\" (already exists).");

            return $existing[$name];
        }

        $saved = $service->create($name, $filter);
        $this->command?->info("  Created saved search \"{$name}\" ({$saved->id}).");

        return $saved;
    }

    /**
     * Attach an alert rule to a saved search only if no rule with the same name
     * already exists on that search.
     *
     * @param  list<string>  $sinks
     */
    private function attachIfMissing(
        AlertService $service,
        string $savedSearchId,
        string $name,
        int $threshold,
        int $windowSeconds,
        int $cooldownSeconds,
        array $sinks,
        AlertConditionType $conditionType = AlertConditionType::COUNT,
        AlertComparison $comparison = AlertComparison::GREATER_THAN,
        ?int $stuckSeconds = null,
    ): void {
        $rules = $service->forSavedSearch($savedSearchId);

        foreach ($rules as $rule) {
            if ($rule->name === $name) {
                $this->command?->info("  Skipping alert rule \"{$name}\" (already exists).");

                return;
            }
        }

        $rule = $service->attach(
            $savedSearchId,
            $name,
            $threshold,
            $windowSeconds,
            $cooldownSeconds,
            $sinks,
            true,
            $conditionType,
            $comparison,
            $stuckSeconds,
        );

        $this->command?->info("  Created alert rule \"{$name}\" ({$rule->id}).");
    }
}
