import type { TransitionRecord } from '../api/types';
import { formatDateTime, formatDuration } from '../lib/format';
import { StatusBadge } from './StatusBadge';

/** Ordered vertical lifecycle of a job's transitions, ending with a terminal or in-flight marker. */
export function Timeline({ records }: { records: TransitionRecord[] }) {
  if (records.length === 0) {
    return <p className="text-sm text-blue-40">No transitions recorded.</p>;
  }

  const terminal = records.some((r) => r.transition === 'processed' || r.transition === 'failed');

  return (
    <ol className="space-y-3">
      {records.map((r) => (
        <li key={r.sequence} className="flex flex-col gap-1 border-l-2 border-blue-20 pl-3">
          <div className="flex items-center gap-2 text-sm">
            <StatusBadge status={r.transition} />
            <span className="text-white-whisper">attempt {r.attempt}</span>
            <span className="text-blue-40">{formatDateTime(r.occurredAt)}</span>
            {r.durationMs !== null ? <span className="text-blue-40">{formatDuration(r.durationMs)}</span> : null}
          </div>
          {r.exceptionMessage ? <p className="font-mono text-xs text-red-300">{r.exceptionMessage}</p> : null}
        </li>
      ))}
      <li className="pl-3">
        {terminal ? (
          <span className="text-xs font-medium text-blue-40">completed</span>
        ) : (
          <span
            className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-300 ring-1 ring-sky-400/30"
            data-inflight="true"
          >
            in flight
          </span>
        )}
      </li>
    </ol>
  );
}
