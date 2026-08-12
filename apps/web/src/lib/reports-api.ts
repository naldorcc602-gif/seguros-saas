import type { ExportFormat, ReportKey } from '@seguros/schemas';

import { apiFetch } from './api-client';
import { useAuthStore } from '@/stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const EXTENSIONS: Record<ExportFormat, string> = { csv: 'csv', xlsx: 'xlsx', pdf: 'pdf' };

export const reportsApi = {
  get: <T>(key: ReportKey) => apiFetch<T>(`/reports/${key}`),

  /**
   * Baixa o arquivo exportado autenticado via Bearer token (não via query
   * param na URL — evitar token em URL, que pode vazar em logs de proxy e
   * histórico do navegador) e dispara o download nativo via um link
   * temporário apontando para um Blob local.
   */
  async download(key: ReportKey, format: ExportFormat): Promise<void> {
    const { accessToken } = useAuthStore.getState();
    const res = await fetch(`${API_URL}/reports/${key}/export?format=${format}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    if (!res.ok) throw new Error('Não foi possível gerar a exportação.');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${key}-${new Date().toISOString().slice(0, 10)}.${EXTENSIONS[format]}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
