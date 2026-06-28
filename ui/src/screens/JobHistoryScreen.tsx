import { Link, useParams } from 'react-router-dom';
import { useJobHistory } from '../hooks/useJobHistory';
import { QueryState } from '../components/query/QueryState';
import { Timeline } from '../components/Timeline';

export function JobHistoryScreen() {
  const { jobUuid } = useParams();
  const query = useJobHistory(jobUuid!);

  return (
    <div className="space-y-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="font-mono text-lg text-slate-800">{jobUuid}</h1>
        <Link to="/search" className="text-sm text-blue-600 hover:underline">
          Back to search
        </Link>
      </header>
      <QueryState
        query={query}
        notFoundMessage="Job not found."
        isEmpty={(records) => records.length === 0}
        emptyMessage="No transitions recorded."
      >
        {(records) => <Timeline records={records} />}
      </QueryState>
    </div>
  );
}
