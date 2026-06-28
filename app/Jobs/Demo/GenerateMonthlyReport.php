<?php

declare(strict_types=1);

namespace App\Jobs\Demo;

use LogicException;

/** Slow but reliable: drives the latency spread (p95) on the dashboard. */
final class GenerateMonthlyReport extends DemoJob
{
    protected function raiseFailure(): never
    {
        throw new LogicException('GenerateMonthlyReport is not expected to fail.');
    }
}
