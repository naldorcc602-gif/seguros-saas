import type { SlaComplianceReport, SlaGroup } from '@seguros/schemas';

function fmtPct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(0)}%`;
}

function SlaBar({ group }: { group: SlaGroup }) {
  const pct = group.compliancePct ?? 0;
  const tone = pct >= 90 ? 'bg-stage-payment' : pct >= 70 ? 'bg-amber' : 'bg-danger';
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink">{group.name}</span>
        <span className="font-mono text-muted">
          {fmtPct(group.compliancePct)} ({group.withinSla}/{group.total})
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-bg">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SlaComplianceView({ data }: { data: SlaComplianceReport }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <SlaBar group={data.overall} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <h3 className="font-display text-sm font-semibold text-ink">Por seguradora</h3>
          {data.byInsurer.length === 0 ? (
            <p className="text-sm text-muted">Sem dados ainda.</p>
          ) : (
            data.byInsurer.map((g) => <SlaBar key={g.id ?? g.name} group={g} />)
          )}
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <h3 className="font-display text-sm font-semibold text-ink">Por regulador</h3>
          {data.byRegulator.length === 0 ? (
            <p className="text-sm text-muted">Sem dados ainda.</p>
          ) : (
            data.byRegulator.map((g) => <SlaBar key={g.id ?? g.name} group={g} />)
          )}
        </div>
      </div>
    </div>
  );
}
