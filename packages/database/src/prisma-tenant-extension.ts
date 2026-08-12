// @ts-nocheck
import { Prisma } from '@prisma/client';

import { getCurrentTenantId } from './request-context';

/**
 * Modelos que possuem a coluna `tenantId` e devem ser automaticamente
 * filtrados/preenchidos pelo tenant da requisição atual. Mantenha esta lista
 * sincronizada com o schema.prisma sempre que um novo modelo com tenantId
 * for adicionado.
 */
const TENANT_SCOPED_MODELS = new Set([
  'User',
  'Insurer',
  'Broker',
  'Client',
  'Adjuster',
  'Workshop',
  'Dispatcher',
  'Lawyer',
  'Claim',
  'Tag',
  'EmailTemplate',
  'ChecklistTemplateItem',
  'Notification',
  'AuditLog',
  'Document',
  'TimelineEvent',
  'Communication',
  'Comment',
  'Task',
  'CalendarEvent',
  'FinancialEntry',
]);

const MANY_ROW_OPS = new Set(['findMany', 'findFirst', 'count', 'aggregate', 'groupBy']);
const BULK_WRITE_OPS = new Set(['updateMany', 'deleteMany']);

/**
 * Extensão do Prisma Client que:
 *  1. Em leituras de múltiplos registros (findMany/findFirst/count/...) e em
 *     updateMany/deleteMany, injeta `where.tenantId` automaticamente a partir
 *     do contexto da requisição (ver request-context.ts), a menos que o
 *     chamador já tenha especificado um tenantId explícito.
 *  2. Em `create`, preenche `data.tenantId` automaticamente quando ausente.
 *
 * IMPORTANTE — limitação conhecida: `findUnique`, `update`, `delete` e
 * `upsert` (operações de registro único por chave) NÃO são interceptados,
 * porque o Prisma exige que o `where` desses métodos contenha exatamente os
 * campos da chave única/primária, sem filtros extras. Para essas operações,
 * o repositório é responsável por (a) buscar por `id` e depois validar que
 * `record.tenantId === getCurrentTenantId()` antes de retornar/permitir a
 * escrita, ou (b) usar `findFirst`/`updateMany` no lugar quando fizer sentido.
 * Essa responsabilidade fica documentada em cada repositório que fizer uso
 * direto dessas operações (ver UsersRepository como exemplo).
 */
export function tenantScopedExtension() {
  return Prisma.defineExtension((client) =>
    client.$extends({
      name: 'tenant-scope',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!model || !TENANT_SCOPED_MODELS.has(model)) {
              return query(args);
            }

            const tenantId = getCurrentTenantId();
            // Sem contexto de tenant (ex: script de seed, job de sistema) —
            // não força filtro, mas fica registrado para quem ler o código
            // que esse é o "modo administrativo" e deve ser usado com cuidado.
            if (!tenantId) {
              return query(args);
            }

            if (MANY_ROW_OPS.has(operation)) {
              const typedArgs = args as { where?: Record<string, unknown> };
              typedArgs.where = { ...(typedArgs.where ?? {}), tenantId: typedArgs.where?.tenantId ?? tenantId };
              return query(typedArgs);
            }

            if (BULK_WRITE_OPS.has(operation)) {
              const typedArgs = args as { where?: Record<string, unknown> };
              typedArgs.where = { ...(typedArgs.where ?? {}), tenantId: typedArgs.where?.tenantId ?? tenantId };
              return query(typedArgs);
            }

            if (operation === 'create') {
              const typedArgs = args as { data?: Record<string, unknown> };
              if (typedArgs.data && typedArgs.data.tenantId === undefined) {
                typedArgs.data.tenantId = tenantId;
              }
              return query(typedArgs);
            }

            return query(args);
          },
        },
      },
    }),
  );
}

