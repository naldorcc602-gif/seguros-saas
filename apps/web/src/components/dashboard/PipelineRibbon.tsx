'use client';

import { CLAIM_STAGE_LABELS, type ClaimStage } from '@seguros/schemas';
import { useState } from 'react';

import { STAGE_BG_CLASS, STAGE_TEXT_CLASS } from './stage-styles';

interface PipelineRibbonProps {
  byStage: Array<{ stage: ClaimStage; count: number }>;
}

/**
 * Fita horizontal proporcional mostrando a distribuição de sinistros por
 * etapa — o elemento-assinatura do dashboard (ver decisão de design da
 * Fase 6). Funciona como visualização e, ao passar o mouse, como legenda;
 * a navegação por clique (filtrar o Kanban pela etapa) fica para a Fase 7,
 * quando a tela de Kanban existir de fato.
 */
export function PipelineRibbon({ byStage }: PipelineRibbonProps) {
  const [hovered, setHovered] = useState<ClaimStage | null>(null);
  const total = byStage.reduce((sum, s) => sum + s.count, 0);
  const nonZero = byStage.filter((s) => s.count > 0);

  if (total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
        Nenhum sinistro cadastrado ainda — a fita de pipeline aparece aqui assim que o primeiro sinistro for aberto.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {nonZero.map(({ stage, count }) => (
          <div
            key={stage}
            className={`h-full transition-opacity ${STAGE_BG_CLASS[stage]} ${
              hovered && hovered !== stage ? 'opacity-40' : 'opacity-100'
            }`}
            style={{ width: `${(count / total) * 100}%` }}
            onMouseEnter={() => setHovered(stage)}
            onMouseLeave={() => setHovered(null)}
            title={`${CLAIM_STAGE_LABELS[stage]}: ${count}`}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {nonZero.map(({ stage, count }) => (
          <div
            key={stage}
            className="flex items-center gap-1.5 text-xs"
            onMouseEnter={() => setHovered(stage)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className={`h-2 w-2 rounded-full ${STAGE_BG_CLASS[stage]}`} />
            <span className="text-muted">{CLAIM_STAGE_LABELS[stage]}</span>
            <span className={`font-mono font-medium ${STAGE_TEXT_CLASS[stage]}`}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
