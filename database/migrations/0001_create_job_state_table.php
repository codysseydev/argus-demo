<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function getConnection(): ?string
    {
        return config('argus.stores.postgres.connection');
    }

    public function up(): void
    {
        Schema::connection($this->getConnection())->create('job_state', function (Blueprint $table) {
            $table->uuid('job_uuid')->primary();
            $table->string('job_class');
            $table->string('queue');
            $table->string('tenant_id')->nullable();
            $table->string('status');
            $table->unsignedInteger('attempts')->default(0);
            $table->timestampTz('dispatched_at')->nullable();
            $table->timestampTz('finished_at')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->string('exception_fp', 32)->nullable();
            $table->bigInteger('last_sequence')->default(-1);

            $table->index('status');
            $table->index('queue');
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::connection($this->getConnection())->dropIfExists('job_state');
    }
};
