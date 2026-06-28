<?php

declare(strict_types=1);

namespace App\Jobs\Demo;

use Argus\Support\Contracts\ProvidesCorrelationIds;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Base for every demo job. It does no real work; it sleeps for a chosen number of
 * milliseconds (so the dashboard shows a realistic latency spread) and optionally
 * throws a subclass-specific exception (so failures group by fingerprint).
 *
 * It implements {@see ProvidesCorrelationIds} so Argus records the request/trace
 * ids and tenant, and exposes a public $tenant that DemoTenantResolver reads.
 */
abstract class DemoJob implements ProvidesCorrelationIds, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /** Retry failing jobs so the timeline shows released-then-failed transitions. */
    public int $tries = 3;

    /** Retry immediately; this is a demo, not a backoff showcase. */
    public int $backoff = 0;

    public function __construct(
        public string $tenant,
        public string $requestId,
        public string $traceId,
        public int $workMs = 0,
        public bool $shouldFail = false,
    ) {}

    /** @return array<string, scalar> */
    public function correlationIds(): array
    {
        return [
            'request_id' => $this->requestId,
            'trace_id' => $this->traceId,
            'tenant_id' => $this->tenant,
        ];
    }

    public function handle(): void
    {
        if ($this->workMs > 0) {
            usleep($this->workMs * 1000);
        }

        if ($this->shouldFail) {
            $this->raiseFailure();
        }
    }

    /** Throw the exception that characterises this job's failure mode. */
    abstract protected function raiseFailure(): never;
}
