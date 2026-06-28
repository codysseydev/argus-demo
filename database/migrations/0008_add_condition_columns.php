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
        Schema::connection($this->getConnection())->table('alert_rules', function (Blueprint $table) {
            $table->string('condition_type', 32)->default('count');
            $table->string('comparison', 8)->default('gt');
            $table->unsignedInteger('stuck_seconds')->nullable();
        });

        Schema::connection($this->getConnection())->table('alert_firings', function (Blueprint $table) {
            $table->string('condition_type', 32)->default('count');
        });
    }

    public function down(): void
    {
        Schema::connection($this->getConnection())->table('alert_rules', function (Blueprint $table) {
            $table->dropColumn(['condition_type', 'comparison', 'stuck_seconds']);
        });

        Schema::connection($this->getConnection())->table('alert_firings', function (Blueprint $table) {
            $table->dropColumn('condition_type');
        });
    }
};
