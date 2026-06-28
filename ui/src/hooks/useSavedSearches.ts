import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SavedSearchInput } from '../api/types';
import { useApiClient } from './useApiClient';

export function useSavedSearches() {
  const c = useApiClient();
  return useQuery({ queryKey: ['saved-searches'], queryFn: () => c.listSavedSearches() });
}

export function useSavedSearch(id: string) {
  const c = useApiClient();
  return useQuery({ queryKey: ['saved-search', id], queryFn: () => c.getSavedSearch(id), enabled: !!id });
}

export function useSavedSearchResults(id: string) {
  const c = useApiClient();
  return useQuery({
    queryKey: ['saved-search-results', id],
    queryFn: () => c.getSavedSearchResults(id),
    enabled: !!id,
  });
}

export function useCreateSavedSearch() {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SavedSearchInput) => c.createSavedSearch(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-searches'] }),
  });
}

export function useUpdateSavedSearch() {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SavedSearchInput }) => c.updateSavedSearch(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['saved-searches'] });
      qc.invalidateQueries({ queryKey: ['saved-search', id] });
    },
  });
}

export function useDeleteSavedSearch() {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => c.deleteSavedSearch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-searches'] }),
  });
}
