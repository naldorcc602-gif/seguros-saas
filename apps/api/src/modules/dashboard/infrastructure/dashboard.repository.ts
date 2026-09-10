import { Injectable } from '@nestjs/common';
import { getCurrentTenantId, prisma } from '@seguros/database';

const TERMINAL_STAGES = ['COMPLETED', 'DENIED'] as const;

/**
 * ATENÇÃO: `prisma.$queryRaw` NÃO passa pelo Prisma Client Extension de
 * multi-tenancy (ver packages/database/src/prisma-tenant-extension.ts) —
 * a extensão só intercepta chamadas via API do Query Builder do Prisma.
 * Por isso, todo `$queryRaw` neste repositório injeta `tenantId` manualmente
 * a partir de `getCurrentTenantId()`, senão vazaria dados entre tenants.
 */
function requireTenantId(): string {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    throw new Error(
      'DashboardRepository: nenhum tenant no contexto da requisição. ' +
        'Este repositório só deve ser usado dentro de uma requisição autenticada.',
    );
  }
  return tenantId;
}

@Injectable()
export class DashboardRepository {
  async countTotal() {
    return prisma.claim.count();
  }

  async countByStage() {
    return prisma.claim.groupBy({ by: ['stage'], _count: { _all: true } });
  }

  async sumEstimatedValue() {
    const result = await prisma.claim.aggregate({ _sum: { estimatedValue: true } });
    return Number(result._sum.estimatedValue ?? 0);
  }

  /** Média de dias entre criação e encerramento, apenas para sinistros concluídos. */
  async averageResolutionDays(): Promise<number | null> {
    const tenantId = requireTenantId();
    const result = await prisma.$queryRaw<Array<{ avg_days: number | null }>>`
      SELECT AVG(EXTRACT(EPOCH FROM ("closedAt" - "createdAt")) / 86400.0) AS avg_days
      FROM "Claim"
      WHERE "closedAt" IS NOT NULL AND "tenantId" = ${tenantId}
    `;
    return result[0]?.avg_days ?? null;
  }

  /** Média de dias até o vencimento do SLA (sinistros ainda abertos, com slaDueAt definido). */
  async averageSlaDays(): Promise<number | null> {
    const tenantId = requireTenantId();
    const result = await prisma.$queryRaw<Array<{ avg_days: number | null }>>`
      SELECT AVG(EXTRACT(EPOCH FROM ("slaDueAt" - "createdAt")) / 86400.0) AS avg_days
      FROM "Claim"
      WHERE "slaDueAt" IS NOT NULL AND "stage" NOT IN ('COMPLETED', 'DENIED') AND "tenantId" = ${tenantId}
    `;
    return result[0]?.avg_days ?? null;
  }

  /** Volume de sinistros abertos por mês, últimos 12 meses. */
  async monthlyVolume(): Promise<Array<{ month: string; count: number }>> {
    const tenantId = requireTenantId();
    const result = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month, COUNT(*) AS count
      FROM "Claim"
      WHERE "createdAt" >= NOW() - INTERVAL '12 months' AND "tenantId" = ${tenantId}
      GROUP BY 1
      ORDER BY 1
    `;
    return result.map((r) => ({ month: r.month, count: Number(r.count) }));
  }

  async countByInsurer() {
    const grouped = await prisma.claim.groupBy({
      by: ['insurerId'],
      _count: { _all: true },
      where: { insurerId: { not: null } },
    });
    const insurers = await prisma.insurer.findMany({
      where: { id: { in: grouped.map((g) => g.insurerId!) } },
    });
    const nameById = new Map(insurers.map((i) => [i.id, i.name]));
    return grouped.map((g) => ({
      id: g.insurerId,
      name: nameById.get(g.insurerId!) ?? 'Desconhecida',
      count: g._count._all,
    }));
  }

  async countByBroker() {
    const grouped = await prisma.claim.groupBy({
      by: ['brokerId'],
      _count: { _all: true },
      where: { brokerId: { not: null } },
    });
    const brokers = await prisma.broker.findMany({
      where: { id: { in: grouped.map((g) => g.brokerId!) } },
    });
    const nameById = new Map(brokers.map((b) => [b.id, b.name]));
    return grouped.map((g) => ({
      id: g.brokerId,
      name: nameById.get(g.brokerId!) ?? 'Desconhecida',
      count: g._count._all,
    }));
  }

  async countByRegulator() {
    const grouped = await prisma.claim.groupBy({
      by: ['assignedUserId'],
      _count: { _all: true },
      where: { assignedUserId: { not: null } },
    });
    const users = await prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.assignedUserId!) } },
    });
    const nameById = new Map(users.map((u) => [u.id, u.name]));
    return grouped.map((g) => ({
      id: g.assignedUserId,
      name: nameById.get(g.assignedUserId!) ?? 'Desconhecido',
      count: g._count._all,
    }));
  }

  /** Distribuição por estado do cliente — usada como proxy do "mapa de calor" enquanto não há geocodificação. */
  async countByClientState() {
    const claims = await prisma.claim.findMany({
      select: { client: { select: { state: true } } },
    });
    const counts = new Map<string, number>();
    for (const claim of claims) {
      const state = claim.client?.state ?? 'Não informado';
      counts.set(state, (counts.get(state) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ id: null, name, count }));
  }

  async criticalClaims(limit = 10) {
    const claims = await prisma.claim.findMany({
      where: { priority: 'CRITICAL', stage: { notIn: [...TERMINAL_STAGES] } },
      include: { client: true },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    const now = Date.now();
    return claims.map((c) => ({
      id: c.id,
      internalNumber: c.internalNumber,
      clientName: c.client.name,
      stage: c.stage,
      priority: c.priority,
      daysOpen: Math.floor((now - c.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      slaDueAt: c.slaDueAt?.toISOString() ?? null,
    }));
  }

  async recentActivity(limit = 15) {
    const events = await prisma.timelineEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { claim: { select: { internalNumber: true } } },
    });
    return events.map((e) => ({
      id: e.id,
      claimId: e.claimId,
      claimInternalNumber: e.claim.internalNumber,
      type: e.type,
      description: e.description,
      createdAt: e.createdAt.toISOString(),
    }));
  }
}
