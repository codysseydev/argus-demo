import { Link, useParams } from 'react-router-dom';
import { useJobHistory } from '../hooks/useJobHistory';
import { QueryState } from '../components/query/QueryState';
import { Timeline } from '../components/Timeline';
import { card } from '../lib/ui';

export function JobHistoryScreen() {
  const { jobUuid } = useParams();
  const query = useJobHistory(jobUuid!);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="font-mono text-lg text-white">{jobUuid}</h1>
        <Link to="/search" className="text-sm text-blue-periwinkle hover:underline">
          Back to search
        </Link>
      </header>
      <QueryState
        query={query}
        notFoundMessage="Job not found."
        isEmpty={(records) => records.length === 0}
        emptyMessage="No transitions recorded."
      >
        {(records) => (
          <div className={card}>
            <Timeline records={records} />
          </div>
        )}
      </QueryState>
    </div>
  );
}
