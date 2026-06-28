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
        // Laravel's schema builder cannot declare PARTITION BY, so this is raw SQL.
        // The PRIMARY KEY must include the partition key (occurred_at) per Postgres.
        DB::connection($this->getConnection())->statement(<<<'SQL'
            CREATE TABLE job_transitions (
                job_uuid uuid NOT NULL,
                sequence bigint NOT NULL,
                transition varchar(20) NOT NULL,
                attempt integer NOT NULL,
                occurred_at timestamptz NOT NULL,
                duration_ms integer NULL,
                exception_fp varchar(32) NULL,
                exception_msg text NULL,
                PRIMARY KEY (job_uuid, sequence, occurred_at)
            ) PARTITION BY RANGE (occurred_at)
        SQL);
    }

    public function down(): void
    {
        DB::connection($this->getConnection())->statement('DROP TABLE IF EXISTS job_transitions CASCADE');
    }
};
