<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function getConnection(): ?string
    {
        return config('argus.stores.postgres.connection');
    }

    public function up(): void
    {
        $db = DB::connection($this->getConnection());

        // The common search is tenant + status within a time window, ordered by
        // recency. A composite index over (tenant_id, status, dispatched_at) serves
        // the equality prefix and the range/ordering tail in one scan.
        $db->statement(
            'CREATE INDEX IF NOT EXISTS job_state_tenant_status_dispatched_idx
             ON job_state (tenant_id, status, dispatched_at DESC)'
        );

        // Time-window searches without a tenant still need to prune by dispatched_at.
        $db->statement(
            'CREATE INDEX IF NOT EXISTS job_state_dispatched_idx
             ON job_state (dispatched_at DESC)'
        );

        // Failure grouping scans only failed transitions in a window. A partial index
        // on the partitioned parent keeps the working set tiny and propagates to every
        // partition (existing and future) automatically.
        $db->statement(
            "CREATE INDEX IF NOT EXISTS job_transitions_failed_idx
             ON job_transitions (occurred_at, exception_fp)
             WHERE transition = 'failed'"
        );
    }

    public function down(): void
    {
        $db = DB::connection($this->getConnection());

        $db->statement('DROP INDEX IF EXISTS job_state_tenant_status_dispatched_idx');
        $db->statement('DROP INDEX IF EXISTS job_state_dispatched_idx');
        $db->statement('DROP INDEX IF EXISTS job_transitions_failed_idx');
    }
};
