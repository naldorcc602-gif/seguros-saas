import { CLAIM_STAGE_LABELS, type DashboardSummary } from '@seguros/schemas';
import { AlertTriangle } from 'lucide-react';

interface CriticalClaimsListProps {
  claims: DashboardSummary['criticalClaims'];
}

export function CriticalClaimsList({ claims }: CriticalClaimsListProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-danger" />
        <h3 className="font-display text-sm font-semibold text-ink">Sinistros críticos</h3>
      </div>
      {claims.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nenhum sinistro crítico em aberto.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {claims.map((claim) => (
            <li key={claim.id} className="flex items-center justify-between py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-mono text-ink">{claim.internalNumber}</p>
                <p className="truncate text-xs text-muted">
                  {claim.clientName} · {CLAIM_STAGE_LABELS[claim.stage]}
                </p>
              </div>
              <span className="ml-2 shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                {claim.daysOpen}d em aberto
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
