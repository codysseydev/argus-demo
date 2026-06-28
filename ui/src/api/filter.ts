import type { Filter, TransitionType } from './types';

/** The filter form's state: every field is a string so it binds directly to inputs. */
export interface FilterFormState {
  jobClass: string;
  queue: string;
  tenantId: string;
  status: string;
  attemptMin: string;
  attemptMax: string;
  since: string;
  until: string;
  correlationKey: string;
  correlationValue: string;
}

export const EMPTY_FORM: FilterFormState = {
  jobClass: '',
  queue: '',
  tenantId: '',
  status: '',
  attemptMin: '',
  attemptMax: '',
  since: '',
  until: '',
  correlationKey: '',
  correlationValue: '',
};

const FIELD_KEYS = Object.keys(EMPTY_FORM) as (keyof FilterFormState)[];

/** A datetime-local input value (no zone) -> absolute ISO-8601. */
function toIso(local: string): string {
  return local ? new Date(local).toISOString() : '';
}

/** An ISO-8601 string -> a datetime-local input value in the viewer's zone. */
export function toLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Build a clean API `Filter` from form state. Blank fields are omitted (so a
 * saved filter round-trips minimally), attempt bounds become numbers, datetimes
 * become absolute ISO-8601, and correlation is included only when BOTH key and
 * value are present (the API requires them together). Pagination is appended.
 * This never invents fields the API does not define.
 */
export function buildFilter(formState: FilterFormState, page = 0, limit = 100): Filter {
  const f: Filter = {};
  if (formState.jobClass.trim()) f.jobClass = formState.jobClass.trim();
  if (formState.queue.trim()) f.queue = formState.queue.trim();
  if (formState.tenantId.trim()) f.tenantId = formState.tenantId.trim();
  if (formState.status) f.status = formState.status as TransitionType;
  if (formState.attemptMin !== '') f.attemptMin = Number(formState.attemptMin);
  if (formState.attemptMax !== '') f.attemptMax = Number(formState.attemptMax);
  if (formState.since) f.since = toIso(formState.since);
  if (formState.until) f.until = toIso(formState.until);
  if (formState.correlationKey.trim() && formState.correlationValue.trim()) {
    f.correlationKey = formState.correlationKey.trim();
    f.correlationValue = formState.correlationValue.trim();
  }
  f.limit = limit;
  f.offset = page * limit;
  return f;
}

/**
 * Client-side guards that mirror the server's intent and fail fast. The API
 * validates each field in isolation but the codec path bypasses the core
 * FilterBuilder's ordering checks, so a bad range would otherwise silently
 * return no rows.
 */
export function validateForm(formState: FilterFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const min = formState.attemptMin === '' ? null : Number(formState.attemptMin);
  const max = formState.attemptMax === '' ? null : Number(formState.attemptMax);
  if (min !== null && max !== null && min > max) errors.attemptMax = 'Max attempts must be ≥ min.';
  if (formState.since && formState.until && new Date(formState.since) > new Date(formState.until)) {
    errors.until = 'End of window must be after the start.';
  }
  const hasKey = formState.correlationKey.trim() !== '';
  const hasVal = formState.correlationValue.trim() !== '';
  if (hasKey && !hasVal) errors.correlationValue = 'Correlation value is required with a key.';
  if (hasVal && !hasKey) errors.correlationKey = 'Correlation key is required with a value.';
  return errors;
}

/** Serialise the set (non-empty) form fields to URL params. */
export function formToParams(formState: FilterFormState): URLSearchParams {
  const p = new URLSearchParams();
  for (const k of FIELD_KEYS) {
    const v = formState[k];
    if (v) p.set(k, v);
  }
  return p;
}

/** Rebuild form state from URL params (unknown/missing fields stay blank). */
export function paramsToForm(params: URLSearchParams): FilterFormState {
  const out = { ...EMPTY_FORM };
  for (const k of FIELD_KEYS) {
    const v = params.get(k);
    if (v !== null) out[k] = v;
  }
  return out;
}

/**
 * A form pre-set for the failures drill-down window (datetime-local values).
 * `toLocalInput` truncates to whole minutes, so `until` is ceil'd to the next
 * minute: otherwise a failure in the final partial minute (e.g. lastSeen
 * 12:05:47) would fall outside an `until` of 12:05 and be excluded.
 */
export function failuresDrilldownForm(firstSeen: string, lastSeen: string): FilterFormState {
  const end = new Date(lastSeen);
  let untilIso = lastSeen;
  if (!Number.isNaN(end.getTime())) {
    if (end.getSeconds() !== 0 || end.getMilliseconds() !== 0) {
      end.setSeconds(0, 0);
      end.setMinutes(end.getMinutes() + 1);
    }
    untilIso = end.toISOString();
  }
  return { ...EMPTY_FORM, status: 'failed', since: toLocalInput(firstSeen), until: toLocalInput(untilIso) };
}

/** Inverse of buildFilter: hydrate the form from an existing API Filter (for editing). */
export function filterToForm(filter: Filter): FilterFormState {
  return {
    ...EMPTY_FORM,
    jobClass: filter.jobClass ?? '',
    queue: filter.queue ?? '',
    tenantId: filter.tenantId ?? '',
    status: filter.status ?? '',
    attemptMin: filter.attemptMin != null ? String(filter.attemptMin) : '',
    attemptMax: filter.attemptMax != null ? String(filter.attemptMax) : '',
    since: filter.since ? toLocalInput(filter.since) : '',
    until: filter.until ? toLocalInput(filter.until) : '',
    correlationKey: filter.correlationKey ?? '',
    correlationValue: filter.correlationValue ?? '',
  };
}
