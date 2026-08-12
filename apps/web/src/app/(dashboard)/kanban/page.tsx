import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export default function KanbanPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Pipeline de Sinistros</h1>
        <p className="text-sm text-muted">Arraste os cartões entre as etapas. Atualiza em tempo real para todos.</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  );
}
