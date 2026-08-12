import type { NotificationListResponse } from '@seguros/schemas';

import { apiFetch } from './api-client';

export const notificationsApi = {
  list: () => apiFetch<NotificationListResponse>('/notifications'),
  markAsRead: (id: string) => apiFetch<void>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => apiFetch<void>('/notifications/read-all', { method: 'PATCH' }),
};
