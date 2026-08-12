import type { ResolutionTimeReport } from '@seguros/schemas';

function fmtDays(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}d`;
}

export function ResolutionTimeView({ data }: { data: ResolutionTimeReport }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Tempo médio geral</p>
        <p className="mt-1 font-mono text-2xl font-semibold text-ink">{fmtDays(data.overallAvgDays)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReportTable title="Por regulador" rows={data.byRegulator} />
        <ReportTable title="Por seguradora" rows={data.byInsurer} />
      </div>
    </div>
  );
}

function ReportTable({ title, rows }: { title: string; rows: ResolutionTimeReport['byRegulator'] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Sem dados suficientes ainda.</p>
      ) : (
        <table className="mt-2 w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="py-1.5 text-ink">{r.name}</td>
                <td className="py-1.5 text-right font-mono text-muted">{fmtDays(r.avgDays)}</td>
                <td className="py-1.5 text-right text-xs text-muted">{r.claimCount} sinistro(s)</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
