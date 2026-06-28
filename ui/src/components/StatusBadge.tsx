const STATUS_STYLES: Record<string, string> = {
  queued: 'bg-slate-100 text-slate-700',
  processing: 'bg-blue-100 text-blue-700',
  processed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  released: 'bg-amber-100 text-amber-700',
};

/** A job/transition status pill, with an optional "in flight" marker. */
export function StatusBadge({ status, inFlight }: { status: string; inFlight?: boolean }) {
  const cls = STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>{status}</span>
      {inFlight ? (
        <span
          className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200"
          data-inflight="true"
        >
          in flight
        </span>
      ) : null}
    </span>
  );
}
