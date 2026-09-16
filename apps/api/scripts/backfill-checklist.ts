/**
 * Backfill nao-destrutivo e idempotente: semeia o checklist de documentos em
 * sinistros criados SEM ele (a feature de templates nao existia no overlay na
 * epoca). Nunca faz update/delete, nao toca em Document/S3, e so cria itens
 * quando o sinistro nao tem nenhum. Idempotente: sinistros ja semeados sao
 * pulados, entao pode rodar quantas vezes quiser.
 *
 * Cada sinistro fornece o SEU tenantId + productType -> nao existe variavel de
 * ambiente externa. Basta rodar com o banco certo (Render Shell, onde o
 * DATABASE_URL de producao ja esta no ambiente).
 *
 * Regras:
 *   - Sinistro ja com >=1 claimChecklistItem -> pulado (idempotente).
 *   - Sem template para tenantId+productType -> pulado e listado no final (o
 *     checklist so aparece se houver template cadastrado para aquele tipo em
 *     /configuracoes -> "Documentos para analise").
 *   - Com template -> createMany dos itens (PENDING, mesma ordem do template).
 */
import { prisma } from '@seguros/database';

async function main() {
  console.log('=> Backfill de checklist (nao-destrutivo, idempotente)');

  const claims = await prisma.claim.findMany({
    select: { id: true, tenantId: true, productType: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`=> ${claims.length} sinistros encontrados`);

  let seeded = 0;
  let skippedAlreadyHad = 0;
  let skippedNoTemplate = 0;
  let totalItems = 0;
  const noTemplateClaims: string[] = [];

  for (const claim of claims) {
    const existing = await prisma.claimChecklistItem.count({ where: { claimId: claim.id } });
    if (existing > 0) {
      skippedAlreadyHad++;
      continue;
    }

    const templates = await prisma.checklistTemplateItem.findMany({
      where: {
        tenantId: claim.tenantId,
        productType: claim.productType as never,
      },
      orderBy: { order: 'asc' },
    });

    if (templates.length === 0) {
      skippedNoTemplate++;
      noTemplateClaims.push(claim.id);
      continue;
    }

    const created = await prisma.claimChecklistItem.createMany({
      data: templates.map((t) => ({
        claimId: claim.id,
        name: t.name,
        required: t.required,
        status: 'PENDING' as const,
      })),
    });
    seeded++;
    totalItems += created.count;
    console.log(`  ok ${claim.id} (${claim.productType}) -> +${created.count} itens`);
  }

  console.log('\n=== resumo ===');
  console.log(`  -> checklists criados:        ${seeded} (${totalItems} itens)`);
  console.log(`  -> ja tinham checklist:       ${skippedAlreadyHad}`);
  console.log(`  -> sem template (pulados):    ${skippedNoTemplate}`);
  if (noTemplateClaims.length > 0) {
    console.log(`     ids: ${noTemplateClaims.join(', ')}`);
    console.log('     -> configure templates em /configuracoes -> "Documentos para analise" e rode de novo se algum destes precisar.');
  }
}

main()
  .catch((e) => {
    console.error('Falha no backfill:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
