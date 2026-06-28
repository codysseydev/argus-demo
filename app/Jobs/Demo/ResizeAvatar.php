<?php

declare(strict_types=1);

namespace App\Jobs\Demo;

use App\Exceptions\Demo\AvatarProcessingException;

/** Media job; a third failure fingerprint for the failures grouping view. */
final class ResizeAvatar extends DemoJob
{
    protected function raiseFailure(): never
    {
        throw new AvatarProcessingException('Unsupported image format (demo).');
    }
}
