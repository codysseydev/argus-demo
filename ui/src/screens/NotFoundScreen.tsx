import { Link } from 'react-router-dom';

/** Catch-all for unknown routes. */
export function NotFoundScreen() {
  return (
    <div className="flex flex-col items-start gap-3 p-4">
      <h1 className="text-lg font-semibold text-slate-900">Page not found</h1>
      <Link to="/search" className="text-sm font-medium text-blue-600 hover:text-blue-700">
        Back to search
      </Link>
    </div>
  );
}
