/** Human datetime, or an em-dash for null/invalid. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Compact duration: `350ms`, `1.8s`, or an em-dash for null. */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Truncate a long fingerprint for dense table display. */
export function shortFingerprint(fp: string | null): string {
  if (!fp) return '—';
  return fp.length > 12 ? `${fp.slice(0, 12)}…` : fp;
}
