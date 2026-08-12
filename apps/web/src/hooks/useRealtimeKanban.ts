import { useQueryClient } from '@tanstack/react-query';
import type { KanbanCard, KanbanRealtimeEvents } from '@seguros/schemas';
import { useEffect } from 'react';

import { getRealtimeSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

import { KANBAN_QUERY_KEY } from './useKanbanClaims';

/**
 * Mantém o quadro Kanban atualizado em tempo real entre usuários diferentes
 * olhando o mesmo tenant (ex: dois reguladores na mesma tela). Complementa,
 * não substitui, a atualização otimista local do useMoveClaimStage — este
 * hook é o que faz a mudança aparecer na tela de QUEM NÃO fez a ação.
 */
export function useRealtimeKanban() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const socket = getRealtimeSocket(accessToken);

    const handleCreated = ({ card }: KanbanRealtimeEvents['claim.created']) => {
      queryClient.setQueryData<KanbanCard[]>(KANBAN_QUERY_KEY, (old) => {
        if (!old) return old;
        if (old.some((c) => c.id === card.id)) return old;
        return [card, ...old];
      });
    };

    const handleStageChanged = ({ card }: KanbanRealtimeEvents['claim.stage_changed']) => {
      queryClient.setQueryData<KanbanCard[]>(KANBAN_QUERY_KEY, (old) =>
        old?.map((c) => (c.id === card.id ? card : c)),
      );
    };

    socket.on('claim.created', handleCreated);
    socket.on('claim.stage_changed', handleStageChanged);

    return () => {
      socket.off('claim.created', handleCreated);
      socket.off('claim.stage_changed', handleStageChanged);
    };
  }, [accessToken, queryClient]);
}
