import { type ReactNode } from 'react';
import { ApiError } from '../../api/errors';
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
  UnauthenticatedState,
} from './states';

/** Minimal shape of a TanStack Query result that QueryState consumes. */
export interface QueryLike<T> {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data: T | undefined;
  refetch?: () => void;
}

interface Props<T> {
  query: QueryLike<T>;
  children: (data: T) => ReactNode;
  isEmpty?: (data: T) => boolean;
  emptyMessage?: string;
  notFoundMessage?: string;
}

/**
 * The single place loading / error / forbidden / unauthenticated / not-found /
 * empty / success are decided, so every screen handles them identically. Branch
 * order: loading -> error (typed via ApiError) -> empty -> data.
 */
export function QueryState<T>({
  query,
  children,
  isEmpty,
  emptyMessage = 'Nothing to show.',
  notFoundMessage,
}: Props<T>) {
  if (query.isLoading) return <LoadingState />;

  if (query.isError) {
    const e = query.error;
    if (e instanceof ApiError) {
      if (e.isForbidden) return <ForbiddenState />;
      if (e.isUnauthenticated) return <UnauthenticatedState />;
      if (e.isNotFound) return <NotFoundState message={notFoundMessage} />;
    }
    const message = e instanceof Error ? e.message : 'Something went wrong.';
    return <ErrorState message={message} onRetry={query.refetch} />;
  }

  if (query.data === undefined) return <LoadingState />;
  if (isEmpty && isEmpty(query.data)) return <EmptyState message={emptyMessage} />;
  return <>{children(query.data)}</>;
}
