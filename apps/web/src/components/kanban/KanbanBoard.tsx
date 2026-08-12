'use client';

import { useQueryClient } from '@tanstack/react-query';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KANBAN_STAGE_ORDER, type ClaimStage, type KanbanCard as KanbanCardType } from '@seguros/schemas';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useKanbanClaims, KANBAN_QUERY_KEY } from '@/hooks/useKanbanClaims';
import { useMoveClaimStage } from '@/hooks/useMoveClaimStage';
import { useRealtimeKanban } from '@/hooks/useRealtimeKanban';
import { claimsApi } from '@/lib/claims-api';
import type { QuickCreateFormValues } from '@/lib/validators/claim';

import { KanbanColumn } from './KanbanColumn';
import { QuickAddClaimModal } from './QuickAddClaimModal';

function matchesSearch(card: KanbanCardType, query: string): boolean {
  if (!query) return true;
  const haystack = `${card.internalNumber} ${card.clientName} ${card.insurerName ?? ''} ${card.brokerName ?? ''}`;
  return haystack.toLowerCase().includes(query.toLowerCase());
}

export function KanbanBoard() {
  const { data: cards, isLoading, isError } = useKanbanClaims();
  const moveStage = useMoveClaimStage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useRealtimeKanban();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filteredCards = useMemo(() => (cards ?? []).filter((c) => matchesSearch(c, search)), [cards, search]);

  const cardsByStage = useMemo(() => {
    const map = new Map<ClaimStage, KanbanCardType[]>();
    for (const stage of KANBAN_STAGE_ORDER) map.set(stage, []);
    for (const card of filteredCards) {
      map.get(card.stage)?.push(card);
    }
    return map;
  }, [filteredCards]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const targetStage = over.id as ClaimStage;
    const card = active.data.current?.card as KanbanCardType | undefined;
    if (!card || card.stage === targetStage) return;

    moveStage.mutate({ claimId: card.id, stage: targetStage });
  };

  const handleQuickCreate = async (values: QuickCreateFormValues) => {
    const created = await claimsApi.quickCreate(values);
    queryClient.setQueryData<KanbanCardType[]>(KANBAN_QUERY_KEY, (old) => {
      if (!old) return old;
      if (old.some((c) => c.id === created.id)) return old;
      return [created, ...old];
    });
    setShowQuickAdd(false);
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-surface" />;
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
        Não foi possível carregar o quadro de sinistros.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nº, segurado, seguradora, corretor…"
          className="max-w-sm flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={() => setShowQuickAdd(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={16} /> Novo sinistro
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
          {KANBAN_STAGE_ORDER.map((stage) => (
            <KanbanColumn key={stage} stage={stage} cards={cardsByStage.get(stage) ?? []} />
          ))}
        </div>
      </DndContext>

      {showQuickAdd && (
        <QuickAddClaimModal onClose={() => setShowQuickAdd(false)} onSubmit={handleQuickCreate} />
      )}
    </div>
  );
}
