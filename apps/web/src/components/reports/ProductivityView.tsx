import type { ProductivityReport } from '@seguros/schemas';

export function ProductivityView({ data }: { data: ProductivityReport }) {
  if (data.rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
        Nenhum regulador com sinistros atribuídos ainda.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="pb-2 font-medium">Regulador</th>
            <th className="pb-2 text-right font-medium">Sinistros atribuídos</th>
            <th className="pb-2 text-right font-medium">Encerrados (30d)</th>
            <th className="pb-2 text-right font-medium">Comentários (30d)</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.userId} className="border-b border-border last:border-0">
              <td className="py-2 text-ink">{r.userName}</td>
              <td className="py-2 text-right font-mono text-muted">{r.assignedClaims}</td>
              <td className="py-2 text-right font-mono text-muted">{r.closedLast30Days}</td>
              <td className="py-2 text-right font-mono text-muted">{r.commentsLast30Days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
