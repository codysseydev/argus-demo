<?php

declare(strict_types=1);

namespace App\Jobs\Demo;

use App\Exceptions\Demo\CrmUnavailableException;

/** Integration job whose failures group under the CrmUnavailable fingerprint. */
final class SyncContactToCrm extends DemoJob
{
    protected function raiseFailure(): never
    {
        throw new CrmUnavailableException('CRM API timed out after 30s (demo).');
    }
}
