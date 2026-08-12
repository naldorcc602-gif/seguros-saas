import type { RegistryKey } from '@seguros/schemas';

import { apiFetch } from './api-client';

/**
 * Um único wrapper genérico para os 7 cadastros — todos compartilham o
 * mesmo padrão REST (list/create/update/delete) sob /registries/:key,
 * espelhando o RegistryCrudRepository genérico do backend (Fase 8).
 */
export const registriesApi = {
  list: <T>(key: RegistryKey) => apiFetch<T[]>(`/registries/${key}`),

  create: <T>(key: RegistryKey, data: Record<string, unknown>) =>
    apiFetch<T>(`/registries/${key}`, { method: 'POST', body: JSON.stringify(data) }),

  update: <T>(key: RegistryKey, id: string, data: Record<string, unknown>) =>
    apiFetch<T>(`/registries/${key}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  remove: (key: RegistryKey, id: string) =>
    apiFetch<void>(`/registries/${key}/${id}`, { method: 'DELETE' }),
};
