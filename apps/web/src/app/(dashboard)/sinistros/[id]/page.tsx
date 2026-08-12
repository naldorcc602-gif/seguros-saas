'use client';

import { CLAIM_STAGE_LABELS } from '@seguros/schemas';
import { Pencil } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { PriorityBadge } from '@/components/kanban/PriorityBadge';
import { AiAssistantPanel } from '@/components/claims/AiAssistantPanel';
import { ClaimDetailView } from '@/components/claims/ClaimDetailView';
import { ClaimEditForm } from '@/components/claims/ClaimEditForm';
import { DocumentsTab } from '@/components/claims/DocumentsTab';
import { CommentsTab, ThirdPartiesTab, TimelineTab } from '@/components/claims/ClaimSideTabs';
import { useClaimDetail } from '@/hooks/useClaimDetail';

const TABS = ['Dados', 'Terceiros', 'Comentários', 'Timeline', 'Documentos', 'IA'] as const;
type Tab = (typeof TABS)[number];

export default function SinistroDetalhePage() {
  const params = useParams<{ id: string }>();
  const { data: claim, isLoading, isError } = useClaimDetail(params.id);
  const [tab, setTab] = useState<Tab>('Dados');
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-surface" />;
  }

  if (isError || !claim) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
        Não foi possível carregar este sinistro.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-semibold text-ink">{claim.internalNumber}</h1>
            <PriorityBadge priority={claim.priority} />
          </div>
          <p className="text-sm text-muted">
            {claim.client.name} · {CLAIM_STAGE_LABELS[claim.stage]}
          </p>
        </div>
        {tab === 'Dados' && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-hover"
          >
            <Pencil size={14} /> Editar
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setIsEditing(false);
            }}
            className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Dados' &&
        (isEditing ? (
          <ClaimEditForm claim={claim} onDone={() => setIsEditing(false)} />
        ) : (
          <ClaimDetailView claim={claim} />
        ))}
      {tab === 'Terceiros' && <ThirdPartiesTab claim={claim} />}
      {tab === 'Comentários' && <CommentsTab claim={claim} />}
      {tab === 'Timeline' && <TimelineTab claim={claim} />}
      {tab === 'Documentos' && <DocumentsTab claim={claim} />}
      {tab === 'IA' && <AiAssistantPanel claimId={claim.id} />}
    </div>
  );
}
