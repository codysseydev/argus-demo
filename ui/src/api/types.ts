export type Iso8601 = string;
export type TransitionType = 'queued' | 'processing' | 'processed' | 'failed' | 'released';
export type AlertState = 'ok' | 'breaching';

export const TRANSITION_TYPES: readonly TransitionType[] = [
  'queued',
  'processing',
  'processed',
  'failed',
  'released',
] as const;

export interface Filter {
  jobClass?: string | null;
  queue?: string | null;
  tenantId?: string | null;
  status?: TransitionType | null;
  attemptMin?: number | null;
  attemptMax?: number | null;
  since?: Iso8601 | null;
  until?: Iso8601 | null;
  correlationKey?: string | null;
  correlationValue?: string | null;
  limit?: number;
  offset?: number;
}

export interface JobSummary {
  jobUuid: string;
  jobClass: string;
  queue: string;
  tenantId: string | null;
  status: string;
  attempts: number;
  dispatchedAt: Iso8601 | null;
  finishedAt: Iso8601 | null;
  durationMs: number | null;
  exceptionFingerprint: string | null;
  inFlight: boolean;
}

export interface TransitionRecord {
  jobUuid: string;
  sequence: number;
  transition: TransitionType;
  attempt: number;
  occurredAt: Iso8601;
  durationMs: number | null;
  exceptionFingerprint: string | null;
  exceptionMessage: string | null;
}

export interface FailureGroup {
  fingerprint: string;
  representativeMessage: string | null;
  count: number;
  firstSeen: Iso8601;
  lastSeen: Iso8601;
}

export interface SavedSearch {
  id: string;
  name: string;
  filter: Filter;
  createdAt: Iso8601;
  updatedAt: Iso8601;
}

export interface AlertRule {
  id: string;
  savedSearchId: string;
  name: string;
  threshold: number;
  windowSeconds: number;
  cooldownSeconds: number;
  sinks: string[];
  enabled: boolean;
  state: AlertState;
  lastNotifiedAt: Iso8601 | null;
  lastResultCount: number | null;
  lastEvaluatedAt: Iso8601 | null;
  createdAt: Iso8601;
  updatedAt: Iso8601;
}

export interface AlertRuleInput {
  name: string;
  threshold: number;
  windowSeconds: number;
  cooldownSeconds: number;
  sinks: string[];
  enabled?: boolean;
}

export interface SavedSearchInput {
  name: string;
  filter: Filter;
}

export interface SearchResult {
  jobs: JobSummary[];
  total: number;
  limit: number;
  offset: number;
}
