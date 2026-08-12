'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { updateClaimSchema, type ClaimDetail, type UpdateClaimInput } from '@seguros/schemas';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useBrokerOptions, useInsurerOptions } from '@/hooks/useClaimFormOptions';
import { useUpdateClaim } from '@/hooks/useClaimDetail';
import { ApiError } from '@/lib/api-client';
import { PRODUCT_TYPE_LABELS } from '@/lib/validators/claim';

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary';

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

export function ClaimEditForm({ claim, onDone }: { claim: ClaimDetail; onDone: () => void }) {
  const [apiError, setApiError] = useState<string | null>(null);
  const { data: insurers } = useInsurerOptions();
  const { data: brokers } = useBrokerOptions();
  const updateClaim = useUpdateClaim(claim.id);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<UpdateClaimInput>({
    resolver: zodResolver(updateClaimSchema),
    defaultValues: {
      insurerId: claim.insurer?.id,
      brokerId: claim.broker?.id,
      insurerNumber: claim.insurerNumber ?? undefined,
      policyNumber: claim.policyNumber ?? undefined,
      productType: claim.productType,
      coverage: claim.coverage ?? undefined,
      deductible: claim.deductible ?? undefined,
      insuredItem: claim.insuredItem ?? undefined,
      vehiclePlate: claim.vehiclePlate ?? undefined,
      renavam: claim.renavam ?? undefined,
      chassis: claim.chassis ?? undefined,
      vehicleModel: claim.vehicleModel ?? undefined,
      vehicleYear: claim.vehicleYear ?? undefined,
      occurredAt: toDatetimeLocal(claim.occurredAt) || undefined,
      occurredLocation: claim.occurredLocation ?? undefined,
      description: claim.description ?? undefined,
      claimType: claim.claimType ?? undefined,
      cause: claim.cause ?? undefined,
      estimatedValue: claim.estimatedValue ?? undefined,
      notes: claim.notes ?? undefined,
      priority: claim.priority,
    },
  });

  const onSubmit = async (values: UpdateClaimInput) => {
    setApiError(null);
    try {
      await updateClaim.mutateAsync(values);
      onDone();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Não foi possível salvar as alterações.');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {apiError && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{apiError}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-ink">Seguradora</label>
          <select className={inputClass} {...register('insurerId')}>
            <option value="">—</option>
            {insurers?.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Corretor</label>
          <select className={inputClass} {...register('brokerId')}>
            <option value="">—</option>
            {brokers?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Prioridade</label>
          <select className={inputClass} {...register('priority')}>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Nº na seguradora</label>
          <input className={inputClass} {...register('insurerNumber')} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Nº da apólice</label>
          <input className={inputClass} {...register('policyNumber')} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Produto</label>
          <select className={inputClass} {...register('productType')}>
            {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Cobertura</label>
          <input className={inputClass} {...register('coverage')} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Franquia (R$)</label>
          <input type="number" step="0.01" className={inputClass} {...register('deductible', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Item segurado</label>
          <input className={inputClass} {...register('insuredItem')} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Placa</label>
          <input className={inputClass} {...register('vehiclePlate')} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">RENAVAM</label>
          <input className={inputClass} {...register('renavam')} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Chassi</label>
          <input className={inputClass} {...register('chassis')} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Modelo do veículo</label>
          <input className={inputClass} {...register('vehicleModel')} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Ano</label>
          <input type="number" className={inputClass} {...register('vehicleYear', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Data/hora da ocorrência</label>
          <input type="datetime-local" className={inputClass} {...register('occurredAt')} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Local</label>
          <input className={inputClass} {...register('occurredLocation')} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Tipo</label>
          <input className={inputClass} {...register('claimType')} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Causa</label>
          <input className={inputClass} {...register('cause')} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Valor estimado (R$)</label>
          <input type="number" step="0.01" className={inputClass} {...register('estimatedValue', { valueAsNumber: true })} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-sm font-medium text-ink">Descrição</label>
          <textarea rows={3} className={inputClass} {...register('description')} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-sm font-medium text-ink">Observações</label>
          <textarea rows={2} className={inputClass} {...register('notes')} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface-hover"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
