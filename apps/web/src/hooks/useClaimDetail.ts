import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AddCommentInput, UpdateClaimInput } from '@seguros/schemas';

import { claimsApi } from '@/lib/claims-api';

export function useClaimDetail(id: string) {
  return useQuery({
    queryKey: ['claims', 'detail', id],
    queryFn: () => claimsApi.getById(id),
    enabled: !!id,
  });
}

export function useUpdateClaim(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateClaimInput) => claimsApi.update(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['claims', 'detail', id], updated);
      queryClient.invalidateQueries({ queryKey: ['claims', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['claims', 'kanban'] });
    },
  });
}

export function useAddComment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCommentInput) => claimsApi.addComment(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims', 'detail', id] });
    },
  });
}
