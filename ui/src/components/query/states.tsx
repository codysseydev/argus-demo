import { ApiError } from '../../api/errors';

/** Presentational state panels shared by every screen via QueryState. */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 p-6 text-sm text-slate-500">
      <span className="h-3 w-3 animate-pulse rounded-full bg-slate-400" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div data-state="empty" className="p-6 text-sm text-slate-500">
      {message}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="p-6 text-sm text-red-700">
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded border border-red-300 px-2 py-1 text-red-700 hover:bg-red-50"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function ForbiddenState() {
  return (
    <div role="alert" className="p-6 text-sm text-amber-800">
      You are not authorized to view this. (403)
    </div>
  );
}

export function UnauthenticatedState() {
  return (
    <div role="alert" className="p-6 text-sm text-amber-800">
      You are not signed in, or your session expired. (401)
    </div>
  );
}

export function NotFoundState({ message = 'Not found.' }: { message?: string }) {
  return (
    <div role="alert" className="p-6 text-sm text-slate-600">
      {message}
    </div>
  );
}

/**
 * Inline banner for a failed write (mutation). QueryState covers reads; this
 * covers create/update/delete. Validation (422) failures render nothing here —
 * those are shown inline on the form fields via the `errors` prop — so this only
 * surfaces forbidden / unauthenticated / not-found / network / server failures
 * that would otherwise be silently swallowed.
 */
export function MutationError({ error }: { error: unknown }) {
  if (!error) return null;
  let message = error instanceof Error ? error.message : 'The action failed.';
  if (error instanceof ApiError) {
    if (error.isValidation) return null;
    if (error.isForbidden) message = 'You are not authorized to perform this action. (403)';
    else if (error.isUnauthenticated) message = 'You are not signed in, or your session expired. (401)';
    else if (error.isNotFound) message = 'That item no longer exists. (404)';
  }
  return (
    <div role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}
