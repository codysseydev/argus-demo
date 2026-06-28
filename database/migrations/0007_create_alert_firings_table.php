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
        Schema::connection($this->getConnection())->create('alert_firings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('alert_rule_id')->index();
            $table->decimal('observed_value', 12, 4);
            $table->unsignedInteger('threshold');
            $table->unsignedInteger('window_seconds');
            $table->timestamp('fired_at')->index();
        });
    }

    public function down(): void
    {
        Schema::connection($this->getConnection())->dropIfExists('alert_firings');
    }
};
