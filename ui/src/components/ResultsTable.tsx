import { Link } from 'react-router-dom';
import type { JobSummary } from '../api/types';
import { formatDateTime, formatDuration, shortFingerprint } from '../lib/format';
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
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
          {HEADERS.map((h) => (
            <th key={h} className="px-2 py-1.5 font-medium">
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
              className={`border-b border-slate-100 ${highlighted ? 'bg-amber-50' : ''}`}
            >
              <td className="px-2 py-1.5">
                <Link
                  to={`/jobs/${encodeURIComponent(job.jobUuid)}`}
                  className="font-mono text-blue-700 hover:underline"
                >
                  {job.jobUuid}
                </Link>
              </td>
              <td className="px-2 py-1.5 font-mono text-xs text-slate-700">{job.jobClass}</td>
              <td className="px-2 py-1.5">{job.queue}</td>
              <td className="px-2 py-1.5">{job.tenantId ?? '—'}</td>
              <td className="px-2 py-1.5">
                <StatusBadge status={job.status} inFlight={job.inFlight} />
              </td>
              <td className="px-2 py-1.5 tabular-nums">{job.attempts}</td>
              <td className="px-2 py-1.5 whitespace-nowrap text-slate-600">
                {formatDateTime(job.dispatchedAt)}
              </td>
              <td className="px-2 py-1.5 tabular-nums text-slate-600">
                {formatDuration(job.durationMs)}
              </td>
              <td className="px-2 py-1.5 font-mono text-xs text-slate-600">
                {shortFingerprint(job.exceptionFingerprint)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
