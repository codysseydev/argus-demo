import { useQuery } from '@tanstack/react-query';
import type { Filter } from '../api/types';
import { useApiClient } from './useApiClient';

/** Failure groups for the current filter window, keyed by filter so it refetches on change. */
export function useFailureGroups(filter: Filter) {
  const c = useApiClient();
  return useQuery({ queryKey: ['failures', filter], queryFn: () => c.getFailureGroups(filter) });
}
