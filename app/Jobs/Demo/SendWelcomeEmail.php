<?php

declare(strict_types=1);

namespace App\Jobs\Demo;

use LogicException;

/** Fast, reliable job: the bulk of healthy throughput in the dashboard. */
final class SendWelcomeEmail extends DemoJob
{
    protected function raiseFailure(): never
    {
        throw new LogicException('SendWelcomeEmail is not expected to fail.');
    }
}
