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
        Schema::connection($this->getConnection())->create('job_correlation', function (Blueprint $table) {
            $table->uuid('job_uuid');
            $table->string('key');
            $table->string('value');

            $table->primary(['job_uuid', 'key']);
            $table->index(['key', 'value']);
        });
    }

    public function down(): void
    {
        Schema::connection($this->getConnection())->dropIfExists('job_correlation');
    }
};
