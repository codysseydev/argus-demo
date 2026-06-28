import type { TransitionRecord } from '../api/types';
import { formatDateTime, formatDuration } from '../lib/format';
import { StatusBadge } from './StatusBadge';

/** Ordered vertical lifecycle of a job's transitions, ending with a terminal or in-flight marker. */
export function Timeline({ records }: { records: TransitionRecord[] }) {
  if (records.length === 0) {
    return <p className="text-sm text-slate-400">No transitions recorded.</p>;
  }

  const terminal = records.some((r) => r.transition === 'processed' || r.transition === 'failed');

  return (
    <ol className="space-y-3">
      {records.map((r) => (
        <li key={r.sequence} className="flex flex-col gap-1 border-l-2 border-slate-200 pl-3">
          <div className="flex items-center gap-2 text-sm">
            <StatusBadge status={r.transition} />
            <span className="text-slate-600">attempt {r.attempt}</span>
            <span className="text-slate-500">{formatDateTime(r.occurredAt)}</span>
            {r.durationMs !== null ? (
              <span className="text-slate-500">{formatDuration(r.durationMs)}</span>
            ) : null}
          </div>
          {r.exceptionMessage ? (
            <p className="font-mono text-xs text-slate-400">{r.exceptionMessage}</p>
          ) : null}
        </li>
      ))}
      <li className="pl-3">
        {terminal ? (
          <span className="text-xs font-medium text-slate-500">completed</span>
        ) : (
          <span
            className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200"
            data-inflight="true"
          >
            in flight
          </span>
        )}
      </li>
    </ol>
  );
}
