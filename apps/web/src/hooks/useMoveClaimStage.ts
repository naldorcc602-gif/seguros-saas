import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClaimStage, KanbanCard } from '@seguros/schemas';

import { claimsApi } from '@/lib/claims-api';

import { KANBAN_QUERY_KEY } from './useKanbanClaims';

export function useMoveClaimStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ claimId, stage }: { claimId: string; stage: ClaimStage }) =>
      claimsApi.moveStage(claimId, { stage }),

    // Atualização otimista: o cartão salta de coluna imediatamente na UI,
    // sem esperar a resposta da API — essencial para o drag-and-drop parecer
    // instantâneo. Se a chamada falhar, revertemos para o snapshot anterior.
    onMutate: async ({ claimId, stage }) => {
      await queryClient.cancelQueries({ queryKey: KANBAN_QUERY_KEY });
      const previous = queryClient.getQueryData<KanbanCard[]>(KANBAN_QUERY_KEY);

      queryClient.setQueryData<KanbanCard[]>(KANBAN_QUERY_KEY, (old) =>
        old?.map((card) => (card.id === claimId ? { ...card, stage } : card)),
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(KANBAN_QUERY_KEY, context.previous);
      }
    },

    onSuccess: (updatedCard) => {
      queryClient.setQueryData<KanbanCard[]>(KANBAN_QUERY_KEY, (old) =>
        old?.map((card) => (card.id === updatedCard.id ? updatedCard : card)),
      );
    },
  });
}
