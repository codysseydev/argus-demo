import { useQuery } from '@tanstack/react-query';
import type { Filter } from '../api/types';
import { useApiClient } from './useApiClient';

/** Runs a job search; keyed on the filter so changing any field refetches. */
export function useSearch(filter: Filter) {
  const c = useApiClient();
  return useQuery({ queryKey: ['search', filter], queryFn: () => c.search(filter) });
}
