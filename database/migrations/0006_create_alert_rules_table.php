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
        Schema::connection($this->getConnection())->create('alert_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('saved_search_id')->index();
            $table->string('name');
            $table->unsignedInteger('threshold');
            $table->unsignedInteger('window_seconds');
            $table->unsignedInteger('cooldown_seconds');
            $table->jsonb('sinks');
            $table->boolean('enabled')->default(true)->index();
            $table->string('state')->default('ok');
            $table->timestampTz('last_notified_at')->nullable();
            $table->unsignedInteger('last_result_count')->nullable();
            $table->timestampTz('last_evaluated_at')->nullable();
            $table->timestampTz('created_at');
            $table->timestampTz('updated_at');
        });
    }

    public function down(): void
    {
        Schema::connection($this->getConnection())->dropIfExists('alert_rules');
    }
};
