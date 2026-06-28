import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AlertRuleInput } from '../api/types';
import { useApiClient } from './useApiClient';

export function useSavedSearchAlertRules(ssid: string) {
  const c = useApiClient();
  return useQuery({
    queryKey: ['alert-rules', ssid],
    queryFn: () => c.listSavedSearchAlertRules(ssid),
    enabled: !!ssid,
  });
}

export function useCreateAlertRule(ssid: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AlertRuleInput) => c.createAlertRule(ssid, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert-rules', ssid] }),
  });
}

export function useUpdateAlertRule(ssid: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AlertRuleInput }) => c.updateAlertRule(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert-rules', ssid] }),
  });
}

export function useDeleteAlertRule(ssid: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => c.deleteAlertRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert-rules', ssid] }),
  });
}
