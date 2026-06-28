import { Link } from 'react-router-dom';
import type { JobSummary } from '../api/types';
import { formatDateTime, formatDuration, shortFingerprint } from '../lib/format';
import { tableCls, tbodyRowCls, tdCls, theadRowCls, thCls } from '../lib/ui';
import { StatusBadge } from './StatusBadge';

interface Props {
  jobs: JobSummary[];
  highlightFingerprint?: string | null;
}

const HEADERS = [
  'Job',
  'Class',
  'Queue',
  'Tenant',
  'Status',
  'Attempts',
  'Dispatched',
  'Duration',
  'Fingerprint',
];

/** Dense, unsorted table of job summaries; rows link to the job detail screen. */
export function ResultsTable({ jobs, highlightFingerprint }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className={tableCls}>
        <thead>
          <tr className={theadRowCls}>
            {HEADERS.map((h) => (
              <th key={h} className={thCls}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const highlighted =
              highlightFingerprint != null && job.exceptionFingerprint === highlightFingerprint;
            return (
              <tr
                key={job.jobUuid}
                data-inflight={job.inFlight ? 'true' : undefined}
                data-highlight={highlighted ? 'true' : undefined}
                className={`${tbodyRowCls} ${highlighted ? 'bg-amber-500/10' : ''}`}
              >
                <td className={tdCls}>
                  <Link
                    to={`/jobs/${encodeURIComponent(job.jobUuid)}`}
                    className="font-mono text-blue-periwinkle hover:underline"
                  >
                    {job.jobUuid}
                  </Link>
                </td>
                <td className={`${tdCls} font-mono text-xs text-blue-40`}>{job.jobClass}</td>
                <td className={tdCls}>{job.queue}</td>
                <td className={tdCls}>{job.tenantId ?? '—'}</td>
                <td className={tdCls}>
                  <StatusBadge status={job.status} inFlight={job.inFlight} />
                </td>
                <td className={`${tdCls} tabular-nums`}>{job.attempts}</td>
                <td className={`${tdCls} whitespace-nowrap text-blue-40`}>{formatDateTime(job.dispatchedAt)}</td>
                <td className={`${tdCls} tabular-nums text-blue-40`}>{formatDuration(job.durationMs)}</td>
                <td className={`${tdCls} font-mono text-xs text-blue-40`}>
                  {shortFingerprint(job.exceptionFingerprint)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
