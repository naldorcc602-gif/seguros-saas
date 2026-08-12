'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanCard as KanbanCardType } from '@seguros/schemas';
import { Building2, Clock, User } from 'lucide-react';

import { PriorityBadge } from './PriorityBadge';

function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
    value,
  );
}

export function KanbanCard({ card }: { card: KanbanCardType }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab space-y-2 rounded-md border border-border bg-surface p-3 text-sm shadow-sm active:cursor-grabbing ${
        isDragging ? 'opacity-60 shadow-lg' : 'hover:border-primary/40'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted">{card.internalNumber}</span>
        <PriorityBadge priority={card.priority} />
      </div>

      <p className="truncate font-medium text-ink">{card.clientName}</p>

      {card.insurerName && (
        <p className="flex items-center gap-1.5 truncate text-xs text-muted">
          <Building2 size={12} /> {card.insurerName}
        </p>
      )}

      {card.assignedUserName && (
        <p className="flex items-center gap-1.5 truncate text-xs text-muted">
          <User size={12} /> {card.assignedUserName}
        </p>
      )}

      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${tag.color ?? '#8B93A7'}1A`,
                color: tag.color ?? '#8B93A7',
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Clock size={12} /> {card.daysOpen}d em aberto
        </span>
        {card.estimatedValue !== null && (
          <span className="font-mono">{formatCurrencyBRL(card.estimatedValue)}</span>
        )}
      </div>
    </div>
  );
}
