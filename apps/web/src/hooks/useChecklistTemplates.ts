import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChecklistTemplateItem, CreateChecklistTemplateItemInput } from '@seguros/schemas';

import { documentsApi } from '@/lib/documents-api';

const QUERY_KEY = ['checklist-templates'] as const;

export function useChecklistTemplates() {
  return useQuery<ChecklistTemplateItem[]>({
    queryKey: QUERY_KEY,
    queryFn: () => documentsApi.listChecklistTemplates(),
  });
}

export function useCreateChecklistTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChecklistTemplateItemInput) => documentsApi.createChecklistTemplate(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveChecklistTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.removeChecklistTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
