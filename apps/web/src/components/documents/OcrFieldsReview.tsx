'use client';

import { OCR_FIELD_LABELS, type OcrExtractedData, type OcrFieldKey } from '@seguros/schemas';
import { ScanLine } from 'lucide-react';

import { useApplyOcrField } from '@/hooks/useOcrAi';

/** Para onde cada campo extraído pode ser aplicado — não é toda combinação que faz sentido (ex: "Datas" não vira um campo único do cadastro). */
const APPLICABLE_TARGETS: Partial<Record<OcrFieldKey, { field: string; label: string }>> = {
  plate: { field: 'vehiclePlate', label: 'Placa do sinistro' },
  renavam: { field: 'renavam', label: 'RENAVAM do sinistro' },
  chassis: { field: 'chassis', label: 'Chassi do sinistro' },
  cpf: { field: 'clientDocument', label: 'Documento do segurado' },
  name: { field: 'clientName', label: 'Nome do segurado' },
};

export function OcrFieldsReview({ claimId, data }: { claimId: string; data: OcrExtractedData }) {
  const applyField = useApplyOcrField(claimId);
  const fieldEntries = Object.entries(data.fields) as Array<[OcrFieldKey, string[]]>;

  if (fieldEntries.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 rounded-md bg-bg p-2.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <ScanLine size={12} /> Dados extraídos automaticamente (revise antes de aplicar):
      </p>
      <div className="mt-1.5 space-y-1.5">
        {fieldEntries.map(([key, values]) => {
          const target = APPLICABLE_TARGETS[key];
          return (
            <div key={key} className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted">{OCR_FIELD_LABELS[key]}:</span>
              {values.map((value) => (
                <span key={value} className="flex items-center gap-1 rounded bg-surface px-1.5 py-0.5">
                  <code className="text-ink">{value}</code>
                  {target && (
                    <button
                      onClick={() => applyField.mutate({ targetField: target.field, value })}
                      disabled={applyField.isPending}
                      className="text-primary hover:underline disabled:opacity-60"
                      title={`Aplicar a "${target.label}"`}
                    >
                      aplicar
                    </button>
                  )}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
