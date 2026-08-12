'use client';

import { REPORT_KEYS, REPORT_LABELS, type ReportKey } from '@seguros/schemas';
import { useState } from 'react';

import { ExportButtons } from '@/components/reports/ExportButtons';
import { FinancialView } from '@/components/reports/FinancialView';
import { PendingDocumentsView } from '@/components/reports/PendingDocumentsView';
import { ProductivityView } from '@/components/reports/ProductivityView';
import { ResolutionTimeView } from '@/components/reports/ResolutionTimeView';
import { SlaComplianceView } from '@/components/reports/SlaComplianceView';
import { useReport } from '@/hooks/useReport';

export default function RelatoriosPage() {
  const [activeKey, setActiveKey] = useState<ReportKey>('resolution-time');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Relatórios</h1>
          <p className="text-sm text-muted">Indicadores operacionais, financeiros e de produtividade do tenant.</p>
        </div>
        <ExportButtons reportKey={activeKey} />
      </div>

      <div className="flex gap-1 border-b border-border">
        {REPORT_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveKey(key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeKey === key ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {REPORT_LABELS[key]}
          </button>
        ))}
      </div>

      <ReportContent reportKey={activeKey} />
    </div>
  );
}

function ReportContent({ reportKey }: { reportKey: ReportKey }) {
  const { data, isLoading, isError } = useReport<unknown>(reportKey);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-surface" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
        Não foi possível carregar este relatório.
      </div>
    );
  }

  switch (reportKey) {
    case 'resolution-time':
      return <ResolutionTimeView data={data as never} />;
    case 'sla-compliance':
      return <SlaComplianceView data={data as never} />;
    case 'financial':
      return <FinancialView data={data as never} />;
    case 'productivity':
      return <ProductivityView data={data as never} />;
    case 'pending-documents':
      return <PendingDocumentsView data={data as never} />;
  }
}
