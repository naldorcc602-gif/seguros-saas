'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { PRODUCT_TYPE_LABELS, QuickCreateFormValues, quickCreateFormSchema } from '@/lib/validators/claim';

interface QuickAddClaimModalProps {
  onClose: () => void;
  onSubmit: (values: QuickCreateFormValues) => Promise<void>;
}

/**
 * Formulário mínimo para abrir um sinistro direto do Kanban. O cadastro
 * completo (endereço, apólice, veículo, terceiros, etc. — todos os campos
 * do escopo original) chega na Fase 8; por ora, este modal cobre só o
 * necessário para o cartão existir e poder ser movido entre colunas.
 */
export function QuickAddClaimModal({ onClose, onSubmit }: QuickAddClaimModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuickCreateFormValues>({
    resolver: zodResolver(quickCreateFormSchema),
    defaultValues: { clientDocumentType: 'CPF', productType: 'AUTO', priority: 'MEDIUM' },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Novo sinistro</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-surface-hover hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-ink">Nome do segurado</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              {...register('clientName')}
            />
            {errors.clientName && <p className="mt-1 text-xs text-danger">{errors.clientName.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-sm font-medium text-ink">Tipo</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-primary"
                {...register('clientDocumentType')}
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-ink">Documento</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                {...register('clientDocument')}
              />
              {errors.clientDocument && (
                <p className="mt-1 text-xs text-danger">{errors.clientDocument.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-ink">Produto</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-primary"
                {...register('productType')}
              >
                {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Prioridade</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-primary"
                {...register('priority')}
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink">Valor estimado (opcional)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              {...register('estimatedValue')}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? 'Criando…' : 'Criar sinistro'}
          </button>
        </form>
      </div>
    </div>
  );
}
