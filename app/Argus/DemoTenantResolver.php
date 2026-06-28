<?php

declare(strict_types=1);

namespace App\Argus;

use App\Jobs\Demo\DemoJob;
use Argus\Support\Contracts\TenantResolver;

/**
 * Tells Argus which tenant a queued job belongs to. In a real app this might read
 * the authenticated tenant off the job or a context bag; here every demo job
 * carries its tenant explicitly, so we just read it back.
 */
final class DemoTenantResolver implements TenantResolver
{
    public function resolve(object $job): ?string
    {
        return $job instanceof DemoJob ? $job->tenant : null;
    }
}
