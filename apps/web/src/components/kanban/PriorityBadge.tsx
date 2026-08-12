import type { ClaimPriority } from '@seguros/schemas';

const PRIORITY_STYLES: Record<ClaimPriority, string> = {
  LOW: 'bg-muted/10 text-muted',
  MEDIUM: 'bg-primary/10 text-primary',
  HIGH: 'bg-amber/10 text-amber',
  CRITICAL: 'bg-danger/10 text-danger',
};

const PRIORITY_LABELS: Record<ClaimPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export function PriorityBadge({ priority }: { priority: ClaimPriority }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLES[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
