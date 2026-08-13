'use client';

import { CLAIM_STAGE_LABELS, KANBAN_STAGE_ORDER } from '@seguros/schemas';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { PriorityBadge } from '@/components/kanban/PriorityBadge';
import { useClaimsList } from '@/hooks/useClaimsList';

function formatCurrencyBRL(value: number | null): string {
  if (value === null) return 'â€”';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
    value,
  );
}

export default function SinistrosPage() {
  const [page, setPage] = useState(1);
  const [stage, setStage] = useState('');
  const [search, setSearch] = useState('');
  const pageSize = 20;

  const { data, isLoading, isFetching } = useClaimsList({
    page,
    pageSize,
    stage: stage ? (stage as never) : undefined,
    search: search || undefined,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Sinistros</h1>
          <p className="text-sm text-muted">{data ? `${data.total} sinistro(s) encontrado(s).` : 'Carregandoâ€¦'}</p>
        </div>
        <Link
          href="/sinistros/novo"
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={16} /> Novo sinistro
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nÂº, apÃ³lice, placa, seguradoâ€¦"
          className="max-w-sm flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <select
          value={stage}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setStage(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        >
          <option value="">Todas as etapas</option>
          {KANBAN_STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {CLAIM_STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2 font-medium">NÂº</th>
              <th className="px-4 py-2 font-medium">Segurado</th>
              <th className="px-4 py-2 font-medium">Etapa</th>
              <th className="px-4 py-2 font-medium">Prioridade</th>
              <th className="px-4 py-2 font-medium">Seguradora</th>
              <th className="px-4 py-2 text-right font-medium">Valor estimado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Carregandoâ€¦
                </td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Nenhum sinistro encontrado.
                </td>
              </tr>
            )}
            {data?.items.map((claim) => (
              <tr key={claim.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                <td className="px-4 py-2">
                  <Link href={`/sinistros/${claim.id}`} className="font-mono text-primary hover:underline">
                    {claim.internalNumber}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink">{claim.clientName}</td>
                <td className="px-4 py-2 text-ink">{CLAIM_STAGE_LABELS[claim.stage]}</td>
                <td className="px-4 py-2">
                  <PriorityBadge priority={claim.priority} />
                </td>
                <td className="px-4 py-2 text-ink">{claim.insurerName ?? 'â€”'}</td>
                <td className="px-4 py-2 text-right font-mono text-ink">
                  {formatCurrencyBRL(claim.estimatedValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            PÃ¡gina {page} de {totalPages} {isFetching && 'Â· atualizandoâ€¦'}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
            >
              PrÃ³xima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


