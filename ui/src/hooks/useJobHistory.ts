import { useQuery } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';

/** A single job's ordered transition history, keyed by its uuid. */
export function useJobHistory(jobUuid: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['history', jobUuid],
    queryFn: () => client.getJobHistory(jobUuid),
  });
}
