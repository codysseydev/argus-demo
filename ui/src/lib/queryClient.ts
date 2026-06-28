import { QueryClient } from '@tanstack/react-query';

/**
 * Freshness over caching: the API is the source of truth and we must never show
 * stale job state during an incident. `staleTime: 0` means every mount/refocus
 * refetches; `retry: false` surfaces errors immediately instead of masking an
 * outage behind retries.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 0, refetchOnWindowFocus: true, retry: false },
      mutations: { retry: false },
    },
  });
}
