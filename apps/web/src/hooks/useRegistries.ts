import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RegistryKey } from '@seguros/schemas';

import { registriesApi } from '@/lib/registries-api';

export function useRegistryList<T>(key: RegistryKey) {
  return useQuery({
    queryKey: ['registries', key],
    queryFn: () => registriesApi.list<T>(key),
  });
}

export function useRegistryMutations<T>(key: RegistryKey) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['registries', key] });

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => registriesApi.create<T>(key, data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      registriesApi.update<T>(key, id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => registriesApi.remove(key, id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
