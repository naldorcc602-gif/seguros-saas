'use client';

import { useDroppable } from '@dnd-kit/core';
import { CLAIM_STAGE_LABELS, type ClaimStage, type KanbanCard as KanbanCardType } from '@seguros/schemas';

import { STAGE_BG_CLASS } from '../dashboard/stage-styles';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  stage: ClaimStage;
  cards: KanbanCardType[];
}

export function KanbanColumn({ stage, cards }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-bg">
      <div className="flex items-center gap-2 px-2 py-2">
        <span className={`h-2 w-2 rounded-full ${STAGE_BG_CLASS[stage]}`} />
        <h3 className="text-sm font-medium text-ink">{CLAIM_STAGE_LABELS[stage]}</h3>
        <span className="ml-auto font-mono text-xs text-muted">{cards.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-1 flex-col gap-2 rounded-lg border-2 border-dashed p-2 transition-colors ${
          isOver ? 'border-primary/50 bg-primary/5' : 'border-transparent'
        }`}
      >
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} />
        ))}
        {cards.length === 0 && (
          <p className="p-2 text-center text-xs text-muted">Nenhum sinistro nesta etapa.</p>
        )}
      </div>
    </div>
  );
}
