<?php

declare(strict_types=1);

namespace App\Jobs\Demo;

use App\Exceptions\Demo\PaymentDeclinedException;

/** Billing job whose failures all share the PaymentDeclined fingerprint. */
final class ChargeSubscription extends DemoJob
{
    protected function raiseFailure(): never
    {
        throw new PaymentDeclinedException('Card declined: insufficient funds (demo).');
    }
}
