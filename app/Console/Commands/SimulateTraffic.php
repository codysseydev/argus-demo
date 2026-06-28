<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\Demo\ChargeSubscription;
use App\Jobs\Demo\DemoJob;
use App\Jobs\Demo\GenerateMonthlyReport;
use App\Jobs\Demo\ResizeAvatar;
use App\Jobs\Demo\SendWelcomeEmail;
use App\Jobs\Demo\SyncContactToCrm;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Dispatches a realistic mix of demo jobs so every Argus screen has something to
 * show: healthy throughput, a latency spread, retries, and failures that group by
 * fingerprint across several tenants and correlation ids.
 *
 * It only enqueues; Horizon workers process the jobs, Argus captures the queue
 * events, and `argus:ship` drains them into Postgres.
 */
final class SimulateTraffic extends Command
{
    protected $signature = 'argus-demo:simulate
        {--jobs=240 : How many jobs to dispatch}';

    protected $description = 'Dispatch a realistic mix of demo queue jobs for Argus to record';

    /** Tenants the fake traffic is spread across. */
    private const TENANTS = ['acme', 'globex', 'initech', 'umbrella'];

    /**
     * Each scenario: job class, queue, latency range (ms), and failure rate (0-1).
     *
     * @var list<array{class: class-string<DemoJob>, queue: string, min: int, max: int, fail: float, weight: int}>
     */
    private const SCENARIOS = [
        ['class' => SendWelcomeEmail::class, 'queue' => 'emails', 'min' => 20, 'max' => 120, 'fail' => 0.0, 'weight' => 40],
        ['class' => GenerateMonthlyReport::class, 'queue' => 'reports', 'min' => 400, 'max' => 2500, 'fail' => 0.02, 'weight' => 15],
        ['class' => ChargeSubscription::class, 'queue' => 'billing', 'min' => 80, 'max' => 400, 'fail' => 0.30, 'weight' => 20],
        ['class' => SyncContactToCrm::class, 'queue' => 'crm', 'min' => 100, 'max' => 900, 'fail' => 0.45, 'weight' => 15],
        ['class' => ResizeAvatar::class, 'queue' => 'media', 'min' => 50, 'max' => 600, 'fail' => 0.15, 'weight' => 10],
    ];

    public function handle(): int
    {
        $total = max(1, (int) $this->option('jobs'));

        // Expand scenarios by weight into a pick list.
        $picks = [];
        foreach (self::SCENARIOS as $scenario) {
            $picks = array_merge($picks, array_fill(0, $scenario['weight'], $scenario));
        }

        $this->info("Dispatching {$total} demo jobs across ".count(self::TENANTS).' tenants...');
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        // Reuse a request id across a handful of jobs now and then, so the
        // correlation search demonstrates grouping by request_id.
        $sharedRequestId = (string) Str::uuid();

        for ($i = 0; $i < $total; $i++) {
            $scenario = $picks[random_int(0, count($picks) - 1)];
            $tenant = self::TENANTS[random_int(0, count(self::TENANTS) - 1)];

            $requestId = random_int(1, 6) === 1 ? $sharedRequestId : (string) Str::uuid();
            $workMs = random_int($scenario['min'], $scenario['max']);
            $shouldFail = (random_int(1, 1000) / 1000) <= $scenario['fail'];

            /** @var class-string<DemoJob> $class */
            $class = $scenario['class'];

            $class::dispatch($tenant, $requestId, (string) Str::uuid(), $workMs, $shouldFail)
                ->onQueue($scenario['queue']);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info('Done. Horizon will process the queue; argus:ship drains transitions into Postgres.');
        $this->line('Watch progress: <comment>spin exec php php artisan horizon:status</comment>');

        return self::SUCCESS;
    }
}
