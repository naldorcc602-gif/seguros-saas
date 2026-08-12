// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { CLAIM_STAGE_LABELS, ClaimStage, DashboardSummary } from '@seguros/schemas';

import { DashboardRepository } from '../infrastructure/dashboard.repository';

const ALL_STAGES: ClaimStage[] = Object.keys(CLAIM_STAGE_LABELS) as ClaimStage[];

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async getSummary(): Promise<DashboardSummary> {
    const [
      total,
      byStageRaw,
      valorTotalEstimado,
      tempoMedioResolucaoDias,
      slaMedioDias,
      monthly,
      byInsurer,
      byBroker,
      byRegulator,
      byState,
      criticalClaims,
      recentActivity,
    ] = await Promise.all([
      this.repository.countTotal(),
      this.repository.countByStage(),
      this.repository.sumEstimatedValue(),
      this.repository.averageResolutionDays(),
      this.repository.averageSlaDays(),
      this.repository.monthlyVolume(),
      this.repository.countByInsurer(),
      this.repository.countByBroker(),
      this.repository.countByRegulator(),
      this.repository.countByClientState(),
      this.repository.criticalClaims(),
      this.repository.recentActivity(),
    ]);

    // Garante que toda etapa apareça na fita de pipeline, mesmo com contagem zero
    // (senão a UI não sabe distinguir "zero sinistros" de "etapa nunca configurada").
    const countByStageMap = new Map(byStageRaw.map((r) => [r.stage as ClaimStage, r._count._all]));
    const byStage = ALL_STAGES.map((stage) => ({ stage, count: countByStageMap.get(stage) ?? 0 }));

    const encerrados = countByStageMap.get('COMPLETED') ?? 0;
    const negados = countByStageMap.get('DENIED') ?? 0;
    const emAndamento = total - encerrados - negados;

    return {
      totals: {
        total,
        emAndamento,
        encerrados,
        negados,
        valorTotalEstimado,
        tempoMedioResolucaoDias,
        slaMedioDias,
      },
      byStage,
      monthly,
      byInsurer,
      byBroker,
      byRegulator,
      byState,
      criticalClaims,
      recentActivity,
    };
  }
}

