import { describe, it, expect } from 'vitest';
import { formatDateTime, formatDuration, shortFingerprint } from './format';

describe('formatDuration', () => {
  it('formats ms, seconds, and null', () => {
    expect(formatDuration(350)).toBe('350ms');
    expect(formatDuration(1840)).toBe('1.8s');
    expect(formatDuration(null)).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('returns an em-dash for null and invalid', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime('not-a-date')).toBe('—');
  });
  it('formats an ISO string to something non-empty', () => {
    expect(formatDateTime('2026-05-31T10:00:00+00:00')).not.toBe('—');
  });
});

describe('shortFingerprint', () => {
  it('truncates long values and dashes null', () => {
    expect(shortFingerprint(null)).toBe('—');
    expect(shortFingerprint('abcdefghijklmnop')).toMatch(/…$/);
    expect(shortFingerprint('short')).toBe('short');
  });
});
