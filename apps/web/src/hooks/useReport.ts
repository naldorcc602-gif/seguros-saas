import { useQuery } from '@tanstack/react-query';
import type { ReportKey } from '@seguros/schemas';

import { reportsApi } from '@/lib/reports-api';

export function useReport<T>(key: ReportKey) {
  return useQuery<T>({ queryKey: ['reports', key], queryFn: () => reportsApi.get<T>(key) });
}
