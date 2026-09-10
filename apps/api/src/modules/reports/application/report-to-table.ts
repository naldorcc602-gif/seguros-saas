import { REPORT_LABELS, type ReportKey } from '@seguros/schemas';

export interface ReportTable {
  title: string;
  headers: string[];
  rows: string[][];
}

function fmtDays(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}d`;
}

function fmtPct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

type ResTimeGroup = { name: string; avgDays: number | null; claimCount: number };
type SlaGroup = { name: string; total: number; withinSla: number; overdue: number; compliancePct: number | null };
type FinByType = { type: string; total: number; count: number };
type FinByInsurer = { name: string; total: number };
type ProductivityRow = { userName: string; assignedClaims: number; closedLast30Days: number; commentsLast30Days: number };
type PendingDocRow = { claimNumber: string; clientName: string; itemName: string; status: string; daysOpen: number };

function fmtMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reportToTable(key: ReportKey, data: any): ReportTable {
  const title = REPORT_LABELS[key];

  switch (key) {
    case 'resolution-time': {
      const rows = [
        ...data.byRegulator.map((r: ResTimeGroup) => ['Regulador', r.name, fmtDays(r.avgDays), String(r.claimCount)]),
        ...data.byInsurer.map((r: ResTimeGroup) => ['Seguradora', r.name, fmtDays(r.avgDays), String(r.claimCount)]),
      ];
      return { title, headers: ['Agrupamento', 'Nome', 'Tempo médio', 'Sinistros'], rows };
    }

    case 'sla-compliance': {
      const toRow = (label: string, g: SlaGroup) => [label, g.name, String(g.total), String(g.withinSla), String(g.overdue), fmtPct(g.compliancePct)];
      const rows = [
        toRow('Geral', data.overall),
        ...data.byInsurer.map((g: SlaGroup) => toRow('Seguradora', g)),
        ...data.byRegulator.map((g: SlaGroup) => toRow('Regulador', g)),
      ];
      return { title, headers: ['Agrupamento', 'Nome', 'Total', 'Dentro do SLA', 'Vencidos', '% Cumprimento'], rows };
    }

    case 'financial': {
      const rows = [
        ...data.byType.map((t: FinByType) => ['Por tipo', t.type, fmtMoney(t.total), String(t.count)]),
        ...data.byInsurer.map((i: FinByInsurer) => ['Por seguradora', i.name, fmtMoney(i.total), '']),
      ];
      return { title, headers: ['Agrupamento', 'Nome', 'Total', 'Qtd.'], rows };
    }

    case 'productivity': {
      const rows = data.rows.map((r: ProductivityRow) => [r.userName, String(r.assignedClaims), String(r.closedLast30Days), String(r.commentsLast30Days)]);
      return { title, headers: ['Regulador', 'Sinistros atribuídos', 'Encerrados (30d)', 'Comentários (30d)'], rows };
    }

    case 'pending-documents': {
      const rows = data.rows.map((r: PendingDocRow) => [r.claimNumber, r.clientName, r.itemName, r.status, `${r.daysOpen}d`]);
      return { title, headers: ['Sinistro', 'Segurado', 'Documento', 'Status', 'Dias em aberto'], rows };
    }
  }
}
