import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationListResponse } from '@seguros/schemas';
import { useEffect } from 'react';

import { notificationsApi } from '@/lib/notifications-api';
import { getRealtimeSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

export function useNotifications() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  const query = useQuery<NotificationListResponse>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: notificationsApi.list,
  });

  // Tempo real: quando o backend cria uma notificação para este usuário
  // (ver RealtimeGateway.emitToUser), atualiza o sino sem esperar o próximo poll.
  useEffect(() => {
    if (!accessToken) return;
    const socket = getRealtimeSocket(accessToken);

    const handleNew = (payload: { id: string; type: string; title: string; body: string; claimId: string | null }) => {
      queryClient.setQueryData<NotificationListResponse>(NOTIFICATIONS_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          unreadCount: old.unreadCount + 1,
          items: [
            {
              id: payload.id,
              type: payload.type as NotificationListResponse['items'][number]['type'],
              title: payload.title,
              body: payload.body,
              claimId: payload.claimId,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...old.items,
          ],
        };
      });
    };

    socket.on('notification.created', handleNew);
    return () => {
      socket.off('notification.created', handleNew);
    };
  }, [accessToken, queryClient]);

  const markAsRead = async (id: string) => {
    await notificationsApi.markAsRead(id);
    queryClient.setQueryData<NotificationListResponse>(NOTIFICATIONS_QUERY_KEY, (old) =>
      old
        ? {
            unreadCount: Math.max(0, old.unreadCount - 1),
            items: old.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
          }
        : old,
    );
  };

  const markAllAsRead = async () => {
    await notificationsApi.markAllAsRead();
    queryClient.setQueryData<NotificationListResponse>(NOTIFICATIONS_QUERY_KEY, (old) =>
      old ? { unreadCount: 0, items: old.items.map((n) => ({ ...n, read: true })) } : old,
    );
  };

  return { ...query, markAsRead, markAllAsRead };
}
