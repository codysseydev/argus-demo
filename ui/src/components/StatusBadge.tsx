const STATUS_STYLES: Record<string, string> = {
  queued: 'bg-slate-500/15 text-slate-300',
  processing: 'bg-sky-500/15 text-sky-300',
  processed: 'bg-emerald-500/15 text-emerald-300',
  failed: 'bg-red-500/15 text-red-300',
  released: 'bg-amber-500/15 text-amber-300',
  // Alert-rule states reuse the same pill vocabulary.
  ok: 'bg-emerald-500/15 text-emerald-300',
  breaching: 'bg-red-500/15 text-red-300',
};

/** A job/transition/alert status pill, with an optional "in flight" marker. */
export function StatusBadge({ status, inFlight }: { status: string; inFlight?: boolean }) {
  const cls = STATUS_STYLES[status] ?? 'bg-slate-500/15 text-slate-300';
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>
      {inFlight ? (
        <span
          className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-300 ring-1 ring-sky-400/30"
          data-inflight="true"
        >
          in flight
        </span>
      ) : null}
    </span>
  );
}
