import { describe, it, expect } from 'vitest';
import {
  buildFilter,
  validateForm,
  formToParams,
  paramsToForm,
  failuresDrilldownForm,
  filterToForm,
  EMPTY_FORM,
  type FilterFormState,
} from './filter';

const form = (o: Partial<FilterFormState>): FilterFormState => ({ ...EMPTY_FORM, ...o });

describe('buildFilter', () => {
  it('omits blank fields and sets limit/offset', () => {
    expect(buildFilter(form({ status: 'failed', queue: '  ' }), 0, 100)).toEqual({
      status: 'failed',
      limit: 100,
      offset: 0,
    });
  });
  it('computes offset from page and limit', () => {
    expect(buildFilter(form({}), 2, 50).offset).toBe(100);
  });
  it('includes correlation only when both key and value present', () => {
    expect(buildFilter(form({ correlationKey: 'request_id' }))).not.toHaveProperty('correlationKey');
    const f = buildFilter(form({ correlationKey: 'request_id', correlationValue: 'r-1' }));
    expect(f.correlationKey).toBe('request_id');
    expect(f.correlationValue).toBe('r-1');
  });
  it('parses attempt bounds as numbers', () => {
    const f = buildFilter(form({ attemptMin: '2', attemptMax: '5' }));
    expect(f.attemptMin).toBe(2);
    expect(f.attemptMax).toBe(5);
  });
});

describe('validateForm', () => {
  it('rejects attemptMin > attemptMax', () => {
    expect(validateForm(form({ attemptMin: '5', attemptMax: '2' }))).toHaveProperty('attemptMax');
  });
  it('rejects since > until', () => {
    expect(validateForm(form({ since: '2026-05-31T10:00', until: '2026-05-31T09:00' }))).toHaveProperty('until');
  });
  it('rejects a correlation key with no value (and vice versa)', () => {
    expect(validateForm(form({ correlationKey: 'k' }))).toHaveProperty('correlationValue');
    expect(validateForm(form({ correlationValue: 'v' }))).toHaveProperty('correlationKey');
  });
  it('accepts a clean form', () => {
    expect(validateForm(form({ status: 'failed' }))).toEqual({});
  });
});

describe('URL round-trip', () => {
  it('paramsToForm(formToParams(x)) preserves set fields', () => {
    const f = form({ status: 'failed', queue: 'emails', correlationKey: 'k', correlationValue: 'v' });
    expect(paramsToForm(formToParams(f))).toEqual(f);
  });
});

describe('failuresDrilldownForm', () => {
  it('sets status=failed and fills the window', () => {
    const f = failuresDrilldownForm('2026-05-31T09:00:00+00:00', '2026-05-31T10:00:00+00:00');
    expect(f.status).toBe('failed');
    expect(f.since).not.toBe('');
    expect(f.until).not.toBe('');
  });
  it('ceils until past a sub-minute lastSeen so the boundary failure is included', () => {
    const lastSeen = '2026-05-31T10:05:47+00:00';
    const built = buildFilter(failuresDrilldownForm('2026-05-31T09:00:00+00:00', lastSeen));
    expect(new Date(built.until as string).getTime()).toBeGreaterThanOrEqual(new Date(lastSeen).getTime());
  });
});

describe('filterToForm', () => {
  it('hydrates form fields from a Filter and blanks the rest', () => {
    const f = filterToForm({ queue: 'emails', status: 'failed', attemptMin: 2, correlationKey: 'k', correlationValue: 'v' });
    expect(f.queue).toBe('emails');
    expect(f.status).toBe('failed');
    expect(f.attemptMin).toBe('2');
    expect(f.correlationKey).toBe('k');
    expect(f.jobClass).toBe('');
  });
  it('round-trips through buildFilter for the set fields', () => {
    const form = filterToForm({ queue: 'emails', status: 'failed' });
    const back = buildFilter(form);
    expect(back.queue).toBe('emails');
    expect(back.status).toBe('failed');
  });
});
