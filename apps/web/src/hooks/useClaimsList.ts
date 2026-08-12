import { useQuery } from '@tanstack/react-query';
import type { ClaimListQuery } from '@seguros/schemas';

import { claimsApi } from '@/lib/claims-api';

export function useClaimsList(query: Partial<ClaimListQuery>) {
  return useQuery({
    queryKey: ['claims', 'list', query],
    queryFn: () => claimsApi.list(query),
    placeholderData: (previous) => previous,
  });
}
