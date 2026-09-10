import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  tenantId: string;
  userId: string;
  role: string;
}

/**
 * Contexto por requisição, populado pelo TenantContextInterceptor logo após
 * o JwtAuthGuard validar o token. Permite que o Prisma Client Extension
 * (ver prisma-tenant-extension.ts em packages/database) injete `tenantId`
 * automaticamente em toda query, sem que cada repositório precise lembrar
 * de passar o filtro manualmente.
 */
export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getCurrentTenantId(): string | undefined {
  return requestContextStorage.getStore()?.tenantId;
}

export function getCurrentUserId(): string | undefined {
  return requestContextStorage.getStore()?.userId;
}
