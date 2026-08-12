import { useQuery } from '@tanstack/react-query';
import type { DashboardSummary } from '@seguros/schemas';

import { apiFetch } from '@/lib/api-client';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiFetch<DashboardSummary>('/dashboard/summary'),
    // Indicadores em tempo real (Fase 1) — por ora, poll a cada 30s;
    // migrar para WebSocket/SSE fica para quando o Kanban (Fase 7) precisar
    // do mesmo canal de atualização ao vivo.
    refetchInterval: 30_000,
  });
}
