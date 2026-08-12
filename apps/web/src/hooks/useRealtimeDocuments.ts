import { useQueryClient } from '@tanstack/react-query';
import type { KanbanRealtimeEvents } from '@seguros/schemas';
import { useEffect } from 'react';

import { getRealtimeSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

/** Atualiza a lista de documentos/checklist quando alguém (regulador ou o próprio cliente pelo portal) envia um arquivo. */
export function useRealtimeDocuments(claimId: string) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken || !claimId) return;
    const socket = getRealtimeSocket(accessToken);

    const handler = (payload: KanbanRealtimeEvents['document.uploaded']) => {
      if (payload.claimId !== claimId) return;
      queryClient.invalidateQueries({ queryKey: ['documents', claimId] });
      queryClient.invalidateQueries({ queryKey: ['checklist', claimId] });
    };

    socket.on('document.uploaded', handler);
    return () => {
      socket.off('document.uploaded', handler);
    };
  }, [accessToken, claimId, queryClient]);
}
