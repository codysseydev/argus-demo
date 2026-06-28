import type {
  AlertRule,
  FailureGroup,
  JobSummary,
  SavedSearch,
  TransitionRecord,
} from '../api/types';

export function jobSummary(overrides: Partial<JobSummary> = {}): JobSummary {
  return {
    jobUuid: 'job-0001',
    jobClass: 'App\\Jobs\\SendWelcomeEmail',
    queue: 'emails',
    tenantId: 'tenant-1',
    status: 'processed',
    attempts: 1,
    dispatchedAt: '2026-05-31T10:00:00+00:00',
    finishedAt: '2026-05-31T10:00:02+00:00',
    durationMs: 1840,
    exceptionFingerprint: null,
    inFlight: false,
    ...overrides,
  };
}

export function inFlightJob(overrides: Partial<JobSummary> = {}): JobSummary {
  return jobSummary({
    jobUuid: 'job-inflight',
    status: 'processing',
    finishedAt: null,
    durationMs: null,
    inFlight: true,
    ...overrides,
  });
}

export function failedJob(overrides: Partial<JobSummary> = {}): JobSummary {
  return jobSummary({
    jobUuid: 'job-failed',
    status: 'failed',
    attempts: 3,
    exceptionFingerprint: 'fp-abc123',
    finishedAt: '2026-05-31T10:05:00+00:00',
    durationMs: 920,
    ...overrides,
  });
}

export function transition(overrides: Partial<TransitionRecord> = {}): TransitionRecord {
  return {
    jobUuid: 'job-0001',
    sequence: 1,
    transition: 'queued',
    attempt: 1,
    occurredAt: '2026-05-31T10:00:00+00:00',
    durationMs: null,
    exceptionFingerprint: null,
    exceptionMessage: null,
    ...overrides,
  };
}

/** Completed lifecycle: queued -> processing -> processed. */
export function completedHistory(uuid = 'job-0001'): TransitionRecord[] {
  return [
    transition({ jobUuid: uuid, sequence: 1, transition: 'queued', occurredAt: '2026-05-31T10:00:00+00:00' }),
    transition({ jobUuid: uuid, sequence: 2, transition: 'processing', occurredAt: '2026-05-31T10:00:01+00:00' }),
    transition({
      jobUuid: uuid,
      sequence: 3,
      transition: 'processed',
      occurredAt: '2026-05-31T10:00:02+00:00',
      durationMs: 1840,
    }),
  ];
}

/** In-flight lifecycle: queued -> processing (no terminal transition). */
export function inFlightHistory(uuid = 'job-inflight'): TransitionRecord[] {
  return [
    transition({ jobUuid: uuid, sequence: 1, transition: 'queued', occurredAt: '2026-05-31T10:00:00+00:00' }),
    transition({ jobUuid: uuid, sequence: 2, transition: 'processing', occurredAt: '2026-05-31T10:00:01+00:00' }),
  ];
}

/** Failed lifecycle: queued -> processing -> failed (terminal). */
export function failedHistory(uuid = 'job-failed'): TransitionRecord[] {
  return [
    transition({ jobUuid: uuid, sequence: 1, transition: 'queued', occurredAt: '2026-05-31T10:04:00+00:00' }),
    transition({ jobUuid: uuid, sequence: 2, transition: 'processing', occurredAt: '2026-05-31T10:04:01+00:00' }),
    transition({
      jobUuid: uuid,
      sequence: 3,
      transition: 'failed',
      attempt: 1,
      occurredAt: '2026-05-31T10:04:02+00:00',
      durationMs: 920,
      exceptionFingerprint: 'fp-abc123',
      exceptionMessage: 'Connection timed out to [host]',
    }),
  ];
}

export function failureGroup(overrides: Partial<FailureGroup> = {}): FailureGroup {
  return {
    fingerprint: 'fp-abc123',
    representativeMessage: 'Connection timed out to [host]',
    count: 42,
    firstSeen: '2026-05-31T09:00:00+00:00',
    lastSeen: '2026-05-31T10:05:00+00:00',
    ...overrides,
  };
}

export function savedSearch(overrides: Partial<SavedSearch> = {}): SavedSearch {
  return {
    id: 'ss-1',
    name: 'failed-emails',
    filter: { queue: 'emails', status: 'failed', limit: 100, offset: 0 },
    createdAt: '2026-05-30T08:00:00+00:00',
    updatedAt: '2026-05-30T08:00:00+00:00',
    ...overrides,
  };
}

export function alertRule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    id: 'ar-1',
    savedSearchId: 'ss-1',
    name: 'too-many-failed-emails',
    threshold: 50,
    windowSeconds: 900,
    cooldownSeconds: 1800,
    sinks: ['slack'],
    enabled: true,
    state: 'ok',
    lastNotifiedAt: null,
    lastResultCount: 12,
    lastEvaluatedAt: '2026-05-31T10:05:00+00:00',
    createdAt: '2026-05-30T08:00:00+00:00',
    updatedAt: '2026-05-31T10:05:00+00:00',
    ...overrides,
  };
}
