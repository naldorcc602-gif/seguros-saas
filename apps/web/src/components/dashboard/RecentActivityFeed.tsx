import type { DashboardSummary } from '@seguros/schemas';
import { Activity } from 'lucide-react';

interface RecentActivityFeedProps {
  events: DashboardSummary['recentActivity'];
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export function RecentActivityFeed({ events }: RecentActivityFeedProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <Activity size={16} className="text-primary" />
        <h3 className="font-display text-sm font-semibold text-ink">Atividade recente</h3>
      </div>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nenhuma atividade registrada ainda.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0">
                <p className="text-ink">
                  <span className="font-mono text-muted">{event.claimInternalNumber}</span> — {event.description}
                </p>
                <p className="text-xs text-muted">{formatRelativeTime(event.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
