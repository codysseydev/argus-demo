import { Link } from 'react-router-dom';
import { pageHeading } from '../lib/ui';

/** Catch-all for unknown routes. */
export function NotFoundScreen() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className={pageHeading}>Page not found</h1>
      <Link to="/search" className="text-sm font-medium text-blue-periwinkle hover:underline">
        Back to search
      </Link>
    </div>
  );
}
