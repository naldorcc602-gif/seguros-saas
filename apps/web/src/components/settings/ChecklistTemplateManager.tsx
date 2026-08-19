'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

import {
  useChecklistTemplates,
  useCreateChecklistTemplate,
  useRemoveChecklistTemplate,
} from '@/hooks/useChecklistTemplates';

const PRODUCT_TYPES = [
  'AUTO',
  'CARGO',
  'LIFE',
  'RESIDENTIAL',
  'BUSINESS',
  'TRANSPORT',
  'RC',
  'RCTRC',
  'RCDC',
  'RCV',
] as const;

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  AUTO: 'Automóvel',
  CARGO: 'Carga',
  LIFE: 'Vida',
  RESIDENTIAL: 'Residencial',
  BUSINESS: 'Empresarial',
  TRANSPORT: 'Transporte',
  RC: 'RC',
  RCTRC: 'RC-TRC',
  RCDC: 'RC-DC',
  RCV: 'RCV',
};

export function ChecklistTemplateManager() {
  const [productType, setProductType] = useState<string>('AUTO');
  const [name, setName] = useState('');
  const [required, setRequired] = useState(true);

  const { data: templates, isLoading } = useChecklistTemplates();
  const create = useCreateChecklistTemplate();
  const remove = useRemoveChecklistTemplate();

  const filtered = (templates ?? [])
    .filter((t) => t.productType === productType)
    .sort((a, b) => a.order - b.order);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      { productType, name: name.trim(), required, order: filtered.length },
      { onSuccess: () => setName('') },
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-sm font-semibold text-ink">Modelos de checklist</h2>
        <p className="text-xs text-muted">
          Defina quais documentos são exigidos por tipo de produto ao abrir um sinistro.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRODUCT_TYPES.map((pt) => (
          <button
            key={pt}
            onClick={() => setProductType(pt)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              productType === pt
                ? 'bg-primary text-white'
                : 'bg-surface-hover text-muted hover:text-ink'
            }`}
          >
            {PRODUCT_TYPE_LABELS[pt] ?? pt}
          </button>
        ))}
      </div>

      <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-bg p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do documento (ex: CNH do condutor)"
          className="min-w-[220px] flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
        <label className="flex items-center gap-1.5 text-sm text-ink">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
          Obrigatório
        </label>
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-lg bg-surface" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">Nenhum item de checklist configurado para este produto ainda.</p>
      ) : (
        <ul className="space-y-1.5">
          {filtered.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="text-ink">
                {item.name} {item.required && <span className="text-xs text-danger">obrigatório</span>}
              </span>
              <button
                onClick={() => remove.mutate(item.id)}
                disabled={remove.isPending}
                className="text-muted hover:text-danger"
                aria-label="Remover"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
