import { Injectable } from '@nestjs/common';
import { getCurrentTenantId, prisma } from '@seguros/database';
import type { ClaimStage } from '@seguros/schemas';

const TERMINAL_STAGES: ClaimStage[] = ['COMPLETED', 'DENIED'];

/**
 * Assim como o DashboardRepository (Fase 6), `$queryRaw` NÃO passa pela
 * extensão de multi-tenancy do Prisma — toda query raw aqui injeta
 * `tenantId` manualmente a partir do contexto da requisição.
 */
function requireTenantId(): string {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    throw new Error('ReportsRepository: nenhum tenant no contexto da requisição.');
  }
  return tenantId;
}

@Injectable()
export class ReportsRepository {
  // ── Tempo médio de resolução ────────────────────────────────────────

  async overallAvgResolutionDays(): Promise<number | null> {
    const tenantId = requireTenantId();
    const result = await prisma.$queryRaw<Array<{ avg_days: number | null }>>`
      SELECT AVG(EXTRACT(EPOCH FROM ("closedAt" - "createdAt")) / 86400.0) AS avg_days
      FROM "Claim" WHERE "closedAt" IS NOT NULL AND "tenantId" = ${tenantId}
    `;
    return result[0]?.avg_days ?? null;
  }

  async avgResolutionByRegulator() {
    const tenantId = requireTenantId();
    const result = await prisma.$queryRaw<Array<{ id: string; name: string; avg_days: number | null; claim_count: bigint }>>`
      SELECT u.id AS id, u.name AS name,
             AVG(EXTRACT(EPOCH FROM (c."closedAt" - c."createdAt")) / 86400.0) AS avg_days,
             COUNT(*) AS claim_count
      FROM "Claim" c
      JOIN "User" u ON u.id = c."assignedUserId"
      WHERE c."closedAt" IS NOT NULL AND c."tenantId" = ${tenantId}
      GROUP BY u.id, u.name
      ORDER BY avg_days ASC
    `;
    return result.map((r) => ({ id: r.id, name: r.name, avgDays: r.avg_days, claimCount: Number(r.claim_count) }));
  }

  async avgResolutionByInsurer() {
    const tenantId = requireTenantId();
    const result = await prisma.$queryRaw<Array<{ id: string; name: string; avg_days: number | null; claim_count: bigint }>>`
      SELECT i.id AS id, i.name AS name,
             AVG(EXTRACT(EPOCH FROM (c."closedAt" - c."createdAt")) / 86400.0) AS avg_days,
             COUNT(*) AS claim_count
      FROM "Claim" c
      JOIN "Insurer" i ON i.id = c."insurerId"
      WHERE c."closedAt" IS NOT NULL AND c."tenantId" = ${tenantId}
      GROUP BY i.id, i.name
      ORDER BY avg_days ASC
    `;
    return result.map((r) => ({ id: r.id, name: r.name, avgDays: r.avg_days, claimCount: Number(r.claim_count) }));
  }

  // ── SLA ──────────────────────────────────────────────────────────────

  private async slaCounts(groupByClause: 'insurer' | 'regulator' | 'none') {
    const tenantId = requireTenantId();

    if (groupByClause === 'none') {
      const result = await prisma.$queryRaw<Array<{ total: bigint; within_sla: bigint }>>`
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (
                 WHERE ("closedAt" IS NOT NULL AND "closedAt" <= "slaDueAt")
                    OR ("closedAt" IS NULL AND NOW() <= "slaDueAt")
               ) AS within_sla
        FROM "Claim"
        WHERE "slaDueAt" IS NOT NULL AND "tenantId" = ${tenantId}
      `;
      const total = Number(result[0]?.total ?? 0);
      const withinSla = Number(result[0]?.within_sla ?? 0);
      return [{ id: null, name: 'Geral', total, withinSla, overdue: total - withinSla }];
    }

    const joinTable = groupByClause === 'insurer' ? 'Insurer' : 'User';
    const joinColumn = groupByClause === 'insurer' ? 'insurerId' : 'assignedUserId';

    const result = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; total: bigint; within_sla: bigint }>>(
      `
      SELECT g.id AS id, g.name AS name,
             COUNT(*) AS total,
             COUNT(*) FILTER (
               WHERE (c."closedAt" IS NOT NULL AND c."closedAt" <= c."slaDueAt")
                  OR (c."closedAt" IS NULL AND NOW() <= c."slaDueAt")
             ) AS within_sla
      FROM "Claim" c
      JOIN "${joinTable}" g ON g.id = c."${joinColumn}"
      WHERE c."slaDueAt" IS NOT NULL AND c."tenantId" = $1
      GROUP BY g.id, g.name
      ORDER BY g.name ASC
      `,
      tenantId,
    );

    return result.map((r) => {
      const total = Number(r.total);
      const withinSla = Number(r.within_sla);
      return { id: r.id, name: r.name, total, withinSla, overdue: total - withinSla };
    });
  }

  async slaOverall() {
    return (await this.slaCounts('none'))[0]!;
  }

  async slaByInsurer() {
    return this.slaCounts('insurer');
  }

  async slaByRegulator() {
    return this.slaCounts('regulator');
  }

  // ── Financeiro ───────────────────────────────────────────────────────

  async financialTotal(): Promise<number> {
    const result = await prisma.financialEntry.aggregate({ _sum: { amount: true } });
    return Number(result._sum.amount ?? 0);
  }

  async financialByType() {
    const result = await prisma.financialEntry.groupBy({ by: ['type'], _sum: { amount: true }, _count: { _all: true } });
    return result.map((r) => ({ type: r.type, total: Number(r._sum.amount ?? 0), count: r._count._all }));
  }

  async financialMonthly() {
    const tenantId = requireTenantId();
    const result = await prisma.$queryRaw<Array<{ month: string; total: number }>>`
      SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month, SUM(amount) AS total
      FROM "FinancialEntry"
      WHERE "createdAt" >= NOW() - INTERVAL '12 months' AND "tenantId" = ${tenantId}
      GROUP BY 1 ORDER BY 1
    `;
    return result.map((r) => ({ month: r.month, total: Number(r.total) }));
  }

  async financialByInsurer() {
    const tenantId = requireTenantId();
    const result = await prisma.$queryRaw<Array<{ id: string | null; name: string; total: number }>>`
      SELECT i.id AS id, COALESCE(i.name, 'Sem seguradora') AS name, SUM(f.amount) AS total
      FROM "FinancialEntry" f
      LEFT JOIN "Claim" c ON c.id = f."claimId"
      LEFT JOIN "Insurer" i ON i.id = c."insurerId"
      WHERE f."tenantId" = ${tenantId}
      GROUP BY i.id, i.name
      ORDER BY total DESC
    `;
    return result.map((r) => ({ id: r.id, name: r.name, total: Number(r.total) }));
  }

  // ── Produtividade ────────────────────────────────────────────────────

  async productivityByRegulator() {
    const tenantId = requireTenantId();
    const result = await prisma.$queryRaw<
      Array<{ user_id: string; user_name: string; assigned_claims: bigint; closed_last_30: bigint; comments_last_30: bigint }>
    >`
      SELECT u.id AS user_id, u.name AS user_name,
        (SELECT COUNT(*) FROM "Claim" c WHERE c."assignedUserId" = u.id AND c."tenantId" = ${tenantId}) AS assigned_claims,
        (SELECT COUNT(*) FROM "Claim" c WHERE c."assignedUserId" = u.id AND c."tenantId" = ${tenantId}
           AND c."closedAt" IS NOT NULL AND c."closedAt" >= NOW() - INTERVAL '30 days') AS closed_last_30,
        (SELECT COUNT(*) FROM "Comment" cm WHERE cm."authorUserId" = u.id AND cm."tenantId" = ${tenantId}
           AND cm."createdAt" >= NOW() - INTERVAL '30 days') AS comments_last_30
      FROM "User" u
      WHERE u."tenantId" = ${tenantId} AND u.role IN ('ADJUSTER', 'ASSISTANT', 'MANAGER', 'SUPERVISOR')
      ORDER BY assigned_claims DESC
    `;
    return result.map((r) => ({
      userId: r.user_id,
      userName: r.user_name,
      assignedClaims: Number(r.assigned_claims),
      closedLast30Days: Number(r.closed_last_30),
      commentsLast30Days: Number(r.comments_last_30),
    }));
  }

  // ── Documentos pendentes ─────────────────────────────────────────────

  async pendingDocuments() {
    const tenantId = requireTenantId();
    const items = await prisma.claimChecklistItem.findMany({
      where: {
        required: true,
        status: { in: ['PENDING', 'REJECTED', 'RESUBMISSION_REQUESTED'] },
        claim: { tenantId, stage: { notIn: TERMINAL_STAGES } },
      },
      include: { claim: { include: { client: { select: { name: true } } } } },
      orderBy: { claim: { createdAt: 'asc' } },
    });

    const now = Date.now();
    return items.map((item) => ({
      claimId: item.claimId,
      claimNumber: item.claim.internalNumber,
      clientName: item.claim.client.name,
      itemName: item.name,
      status: item.status,
      daysOpen: Math.floor((now - item.claim.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }
}
