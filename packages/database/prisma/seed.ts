import { PrismaClient } from '@prisma/client';

/**
 * Seed das permissões granulares (tabela Permission).
 *
 * Isto NÃO substitui o papel (UserRole) — é a camada extra de granularidade
 * mencionada na Fase 2 ("um Assistente específico pode ganhar permissão
 * extra sem virar Gestor"). A concessão real para um usuário acontece via
 * UserPermission, feita pelo Administrador do tenant depois (módulo de
 * Configurações, fora do escopo desta fase).
 *
 * Rodar com: npx prisma db seed  (ou npm run db:seed, ver package.json)
 */
const prisma = new PrismaClient();

const PERMISSION_KEYS: Array<{ key: string; description: string }> = [
  { key: 'claims:view', description: 'Visualizar sinistros' },
  { key: 'claims:edit', description: 'Editar dados de sinistros' },
  { key: 'claims:delete', description: 'Excluir/arquivar sinistros' },
  { key: 'claims:change_stage', description: 'Mover sinistro entre etapas do Kanban' },
  { key: 'documents:upload', description: 'Enviar documentos' },
  { key: 'documents:approve', description: 'Aprovar ou rejeitar documentos' },
  { key: 'financial:view', description: 'Visualizar dados financeiros' },
  { key: 'financial:edit', description: 'Lançar/editar entradas financeiras' },
  { key: 'reports:view', description: 'Visualizar relatórios' },
  { key: 'reports:export', description: 'Exportar relatórios (PDF/Excel/CSV)' },
  { key: 'settings:manage_users', description: 'Gerenciar usuários e permissões do tenant' },
  { key: 'settings:manage_company', description: 'Editar configurações da empresa (logo, cores, SMTP...)' },
  { key: 'audit:view', description: 'Visualizar trilha de auditoria' },
];

async function main() {
  for (const permission of PERMISSION_KEYS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
  }
  console.log(`Seed concluído: ${PERMISSION_KEYS.length} permissões garantidas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
