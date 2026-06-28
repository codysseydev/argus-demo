import { ApiError } from '../../api/errors';
import { btnDanger } from '../../lib/ui';

/** Presentational state panels shared by every screen via QueryState. */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 p-6 text-sm text-blue-40">
      <span className="h-3 w-3 animate-pulse rounded-full bg-blue-30" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div data-state="empty" className="rounded-2xl border border-dashed border-blue-20 p-6 text-sm text-blue-40">
      {message}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="p-6 text-sm text-red-300">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={`mt-2 ${btnDanger}`}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function ForbiddenState() {
  return (
    <div role="alert" className="p-6 text-sm text-amber-300">
      You are not authorized to view this. (403)
    </div>
  );
}

export function UnauthenticatedState() {
  return (
    <div role="alert" className="p-6 text-sm text-amber-300">
      You are not signed in, or your session expired. (401)
    </div>
  );
}

export function NotFoundState({ message = 'Not found.' }: { message?: string }) {
  return (
    <div role="alert" className="p-6 text-sm text-blue-40">
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
    <div role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {message}
    </div>
  );
}
