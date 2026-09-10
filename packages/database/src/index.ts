import { PrismaClient } from '@prisma/client';

import { tenantScopedExtension } from './prisma-tenant-extension';

/**
 * Instância única do Prisma Client, compartilhada entre apps/api e apps/workers.
 * Evita esgotamento do pool de conexões do Postgres por múltiplas instâncias
 * em ambiente serverless/hot-reload.
 *
 * O client já vem com a extensão de multi-tenancy aplicada (ver
 * prisma-tenant-extension.ts): toda query em um modelo com `tenantId` é
 * automaticamente filtrada/preenchida pelo tenant da requisição atual,
 * desde que o TenantContextInterceptor da API tenha populado o contexto.
 */
declare global {
  var __prisma: PrismaClient | undefined;
}

const basePrismaClient = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = basePrismaClient;
}

export const prisma = basePrismaClient.$extends(tenantScopedExtension());

export * from '@prisma/client';
export * from './request-context';
