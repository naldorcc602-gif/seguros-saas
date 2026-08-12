import { DOCUMENT_STATUS_LABELS, type PendingDocumentsReport } from '@seguros/schemas';
import Link from 'next/link';

export function PendingDocumentsView({ data }: { data: PendingDocumentsReport }) {
  if (data.rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
        Nenhum documento obrigatório pendente no momento. 🎉
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="pb-2 font-medium">Sinistro</th>
            <th className="pb-2 font-medium">Segurado</th>
            <th className="pb-2 font-medium">Documento</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 text-right font-medium">Dias em aberto</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={`${r.claimId}-${i}`} className="border-b border-border last:border-0">
              <td className="py-2">
                <Link href={`/sinistros/${r.claimId}`} className="font-mono text-primary hover:underline">
                  {r.claimNumber}
                </Link>
              </td>
              <td className="py-2 text-ink">{r.clientName}</td>
              <td className="py-2 text-ink">{r.itemName}</td>
              <td className="py-2 text-xs text-muted">{DOCUMENT_STATUS_LABELS[r.status as keyof typeof DOCUMENT_STATUS_LABELS] ?? r.status}</td>
              <td className="py-2 text-right font-mono text-muted">{r.daysOpen}d</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
