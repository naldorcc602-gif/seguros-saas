import { useQuery } from '@tanstack/react-query';
import type { KanbanCard } from '@seguros/schemas';

import { claimsApi } from '@/lib/claims-api';

export const KANBAN_QUERY_KEY = ['claims', 'kanban'] as const;

export function useKanbanClaims() {
  return useQuery<KanbanCard[]>({
    queryKey: KANBAN_QUERY_KEY,
    queryFn: claimsApi.listKanban,
  });
}
