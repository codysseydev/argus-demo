<?php

declare(strict_types=1);
use Argus\Alerting\DeliverAlertJob;
use Argus\Alerting\EvaluateAlertsCommand;
use Argus\Ingestion\ShipTransitionsCommand;
use Argus\Storage\Mysql\ManageMysqlPartitionsCommand;
use Argus\Storage\Postgres\ManagePartitionsCommand;

return [
    // Active storage backend. Swapping this resolves a different TransitionStore
    // with zero changes to ingestion code.
    'store' => env('ARGUS_STORE', 'postgres'),

    'stores' => [
        'postgres' => [
            'connection' => env('ARGUS_PG_CONNECTION', 'pgsql'),
            'precreate_partitions_ahead' => 2,
        ],
        'mysql' => [
            'connection' => env('ARGUS_MYSQL_CONNECTION', 'mysql'),
            'precreate_partitions_ahead' => 2,
        ],
    ],

    // Days of history kept. Retention drops whole daily partitions older than this.
    // Changing this value changes what argus:partitions drops, with no code change.
    'retention_days' => (int) env('ARGUS_RETENTION_DAYS', 30),

    // Partition maintenance scheduling. When enabled, the package registers
    // argus:partitions on Laravel's scheduler so the host app does not have to.
    'schedule' => [
        'enabled' => filter_var(env('ARGUS_SCHEDULE', true), FILTER_VALIDATE_BOOL),
        'partitions_at' => env('ARGUS_PARTITIONS_AT', '00:10'),
    ],

    // Threshold alerting on saved searches. The evaluator re-runs each enabled
    // alert rule's saved search over a rolling window and fires when the match
    // count exceeds the rule's threshold. Delivery is dispatched to the queue so
    // a down sink never blocks evaluation and a breaching alert is never lost.
    'alerting' => [
        // When enabled, the package registers argus:evaluate-alerts on Laravel's
        // scheduler at the cron cadence below. Set false to wire it yourself.
        'enabled' => filter_var(env('ARGUS_ALERTING', true), FILTER_VALIDATE_BOOL),

        // Cron expression for how often alerts are evaluated. Default: every 5 minutes.
        'cadence' => env('ARGUS_ALERT_CADENCE', '*/5 * * * *'),

        // Sinks the evaluator can route to. A rule references a sink by its key
        // here (e.g. ['slack']). Adding PagerDuty/email is implementing AlertSink
        // and registering it on the AlertSinkRegistry; nothing is hardcoded.
        'sinks' => [
            'slack' => [
                'webhook_url' => env('ARGUS_SLACK_WEBHOOK_URL'),
            ],
            'webhook' => [
                'url' => env('ARGUS_ALERT_WEBHOOK_URL'),
                'headers' => [],
            ],
        ],
    ],

    'buffer' => [
        'driver' => env('ARGUS_BUFFER', 'redis'),
        'redis' => [
            'connection' => env('ARGUS_REDIS_CONNECTION', 'default'),
            'key' => 'argus:transitions',
            'batch_size' => (int) env('ARGUS_SHIP_BATCH', 500),
        ],
    ],

    // Whitelist of correlation identifiers to capture off jobs. ONLY these keys
    // are ever stored. Anything not listed here is never captured.
    'correlation' => [
        'fields' => [
            'request_id', 'trace_id', 'tenant_id',
        ],
    ],

    'tenant' => [
        // class-string<Argus\Support\Contracts\TenantResolver>|null
        'resolver' => \App\Argus\DemoTenantResolver::class,
    ],

    'fingerprint' => [
        'frames' => (int) env('ARGUS_FINGERPRINT_FRAMES', 5),
    ],

    'exception_message' => [
        'max_length' => (int) env('ARGUS_EXCEPTION_MESSAGE_MAX', 1000),
    ],

    // Job/command classes never captured (so the observer never observes itself).
    'capture' => [
        'except' => [
            ShipTransitionsCommand::class,
            ManagePartitionsCommand::class,
            ManageMysqlPartitionsCommand::class,
            EvaluateAlertsCommand::class,
            DeliverAlertJob::class,
        ],
    ],
];
