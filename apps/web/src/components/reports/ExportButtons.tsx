'use client';

import type { ExportFormat, ReportKey } from '@seguros/schemas';
import { Download } from 'lucide-react';
import { useState } from 'react';

import { reportsApi } from '@/lib/reports-api';

const FORMAT_LABELS: Record<ExportFormat, string> = { pdf: 'PDF', xlsx: 'Excel', csv: 'CSV' };

export function ExportButtons({ reportKey }: { reportKey: ReportKey }) {
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setLoadingFormat(format);
    try {
      await reportsApi.download(reportKey, format);
    } finally {
      setLoadingFormat(null);
    }
  };

  return (
    <div className="flex gap-1.5">
      {(['pdf', 'xlsx', 'csv'] as ExportFormat[]).map((format) => (
        <button
          key={format}
          onClick={() => handleExport(format)}
          disabled={loadingFormat !== null}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:border-primary hover:text-primary disabled:opacity-60"
        >
          <Download size={12} /> {loadingFormat === format ? '...' : FORMAT_LABELS[format]}
        </button>
      ))}
    </div>
  );
}
