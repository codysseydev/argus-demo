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

/** Every alert rule across every saved search (the global Alerts screen). */
export function useAllAlertRules() {
  const c = useApiClient();
  return useQuery({
    queryKey: ['alert-rules', 'all'],
    queryFn: () => c.listAlertRules(),
  });
}

/** Recent firings across every rule, most recent first. */
export function useRecentFirings(limit = 100) {
  const c = useApiClient();
  return useQuery({
    queryKey: ['alert-firings', 'recent', limit],
    queryFn: () => c.getRecentFirings(limit),
  });
}

/** Firing history for one rule, most recent first. */
export function useAlertRuleFirings(ruleId: string, limit = 100) {
  const c = useApiClient();
  return useQuery({
    queryKey: ['alert-firings', ruleId, limit],
    queryFn: () => c.getAlertRuleFirings(ruleId, limit),
    enabled: !!ruleId,
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
