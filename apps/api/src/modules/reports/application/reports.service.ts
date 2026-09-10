import { Injectable } from '@nestjs/common';
import type {
  FinancialReport,
  PendingDocumentsReport,
  ProductivityReport,
  ResolutionTimeReport,
  SlaComplianceReport,
} from '@seguros/schemas';

import { ReportsRepository } from '../infrastructure/reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly repository: ReportsRepository) {}

  async resolutionTime(): Promise<ResolutionTimeReport> {
    const [overallAvgDays, byRegulator, byInsurer] = await Promise.all([
      this.repository.overallAvgResolutionDays(),
      this.repository.avgResolutionByRegulator(),
      this.repository.avgResolutionByInsurer(),
    ]);
    return { overallAvgDays, byRegulator, byInsurer };
  }

  async slaCompliance(): Promise<SlaComplianceReport> {
    const [overall, byInsurer, byRegulator] = await Promise.all([
      this.repository.slaOverall(),
      this.repository.slaByInsurer(),
      this.repository.slaByRegulator(),
    ]);
    const withPct = (g: { total: number; withinSla: number }) => (g.total > 0 ? (g.withinSla / g.total) * 100 : null);
    return {
      overall: { ...overall, compliancePct: withPct(overall) },
      byInsurer: byInsurer.map((g) => ({ ...g, compliancePct: withPct(g) })),
      byRegulator: byRegulator.map((g) => ({ ...g, compliancePct: withPct(g) })),
    };
  }

  async financial(): Promise<FinancialReport> {
    const [totalAmount, byType, monthly, byInsurer] = await Promise.all([
      this.repository.financialTotal(),
      this.repository.financialByType(),
      this.repository.financialMonthly(),
      this.repository.financialByInsurer(),
    ]);
    return { totalAmount, byType, monthly, byInsurer };
  }

  async productivity(): Promise<ProductivityReport> {
    const rows = await this.repository.productivityByRegulator();
    return { rows };
  }

  async pendingDocuments(): Promise<PendingDocumentsReport> {
    const rows = await this.repository.pendingDocuments();
    return { rows };
  }

  /** Usado pelo ExportService — busca o relatório certo pelo mesmo `key` usado na URL. */
  async getByKey(key: string) {
    switch (key) {
      case 'resolution-time':
        return this.resolutionTime();
      case 'sla-compliance':
        return this.slaCompliance();
      case 'financial':
        return this.financial();
      case 'productivity':
        return this.productivity();
      case 'pending-documents':
        return this.pendingDocuments();
      default:
        throw new Error(`Relatório desconhecido: ${key}`);
    }
  }
}
