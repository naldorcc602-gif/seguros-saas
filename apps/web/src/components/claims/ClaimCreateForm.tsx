'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createClaimSchema, type CreateClaimInput } from '@seguros/schemas';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';

import { PRODUCT_TYPE_LABELS } from '@/lib/validators/claim';
import { useBrokerOptions, useInsurerOptions } from '@/hooks/useClaimFormOptions';
import { claimsApi } from '@/lib/claims-api';
import { ApiError } from '@/lib/api-client';
import { useState } from 'react';

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary';
const labelClass = 'text-sm font-medium text-ink';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-border bg-surface p-4">
      <legend className="px-1 font-display text-sm font-semibold text-ink">{title}</legend>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  );
}

export function ClaimCreateForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const { data: insurers } = useInsurerOptions();
  const { data: brokers } = useBrokerOptions();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateClaimInput>({
    resolver: zodResolver(createClaimSchema),
    defaultValues: { clientDocumentType: 'CPF', productType: 'AUTO', priority: 'MEDIUM', thirdParties: [] },
  });

  const thirdParties = useFieldArray({ control, name: 'thirdParties' });

  const onSubmit = async (values: CreateClaimInput) => {
    setApiError(null);
    try {
      const created = await claimsApi.create(values);
      router.push(`/sinistros/${created.id}`);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Não foi possível abrir o sinistro.');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {apiError && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{apiError}</p>}

      <Section title="Segurado">
        <Field label="Nome *">
          <input className={inputClass} {...register('clientName')} />
          {errors.clientName && <p className="mt-1 text-xs text-danger">{errors.clientName.message}</p>}
        </Field>
        <Field label="Tipo de documento">
          <select className={inputClass} {...register('clientDocumentType')}>
            <option value="CPF">CPF</option>
            <option value="CNPJ">CNPJ</option>
          </select>
        </Field>
        <Field label="CPF/CNPJ *">
          <input className={inputClass} {...register('clientDocument')} />
          {errors.clientDocument && <p className="mt-1 text-xs text-danger">{errors.clientDocument.message}</p>}
        </Field>
        <Field label="Telefone">
          <input className={inputClass} {...register('clientPhone')} />
        </Field>
        <Field label="WhatsApp">
          <input className={inputClass} {...register('clientWhatsapp')} />
        </Field>
        <Field label="E-mail">
          <input type="email" className={inputClass} {...register('clientEmail')} />
        </Field>
        <Field label="Endereço">
          <input className={inputClass} {...register('clientAddress')} />
        </Field>
        <Field label="Cidade">
          <input className={inputClass} {...register('clientCity')} />
        </Field>
        <Field label="Estado">
          <input className={inputClass} {...register('clientState')} />
        </Field>
        <Field label="CEP">
          <input className={inputClass} {...register('clientZipCode')} />
        </Field>
      </Section>

      <Section title="Vínculos e apólice">
        <Field label="Seguradora">
          <select className={inputClass} {...register('insurerId')}>
            <option value="">—</option>
            {insurers?.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Corretor">
          <select className={inputClass} {...register('brokerId')}>
            <option value="">—</option>
            {brokers?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nº na seguradora">
          <input className={inputClass} {...register('insurerNumber')} />
        </Field>
        <Field label="Nº da apólice">
          <input className={inputClass} {...register('policyNumber')} />
        </Field>
        <Field label="Produto *">
          <select className={inputClass} {...register('productType')}>
            {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cobertura">
          <input className={inputClass} {...register('coverage')} />
        </Field>
        <Field label="Franquia (R$)">
          <input type="number" step="0.01" min={0} className={inputClass} {...register('deductible', { valueAsNumber: true })} />
        </Field>
        <Field label="Item segurado">
          <input className={inputClass} {...register('insuredItem')} />
        </Field>
        <Field label="Prioridade">
          <select className={inputClass} {...register('priority')}>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>
        </Field>
      </Section>

      <Section title="Veículo (quando aplicável)">
        <Field label="Placa">
          <input className={inputClass} {...register('vehiclePlate')} />
        </Field>
        <Field label="RENAVAM">
          <input className={inputClass} {...register('renavam')} />
        </Field>
        <Field label="Chassi">
          <input className={inputClass} {...register('chassis')} />
        </Field>
        <Field label="Modelo">
          <input className={inputClass} {...register('vehicleModel')} />
        </Field>
        <Field label="Ano">
          <input type="number" className={inputClass} {...register('vehicleYear', { valueAsNumber: true })} />
        </Field>
      </Section>

      <Section title="Ocorrência">
        <Field label="Data e hora">
          <input type="datetime-local" className={inputClass} {...register('occurredAt')} />
        </Field>
        <Field label="Local">
          <input className={inputClass} {...register('occurredLocation')} />
        </Field>
        <Field label="Tipo">
          <input className={inputClass} {...register('claimType')} />
        </Field>
        <Field label="Causa">
          <input className={inputClass} {...register('cause')} />
        </Field>
        <Field label="Valor estimado (R$)">
          <input type="number" step="0.01" min={0} className={inputClass} {...register('estimatedValue', { valueAsNumber: true })} />
        </Field>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Descrição">
            <textarea rows={3} className={inputClass} {...register('description')} />
          </Field>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Observações">
            <textarea rows={2} className={inputClass} {...register('notes')} />
          </Field>
        </div>
      </Section>

      <Section title="Terceiros envolvidos">
        <div className="col-span-full space-y-3">
          {thirdParties.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-5">
              <input
                placeholder="Nome"
                className={inputClass}
                {...register(`thirdParties.${index}.name` as const)}
              />
              <input
                placeholder="Documento"
                className={inputClass}
                {...register(`thirdParties.${index}.document` as const)}
              />
              <input
                placeholder="Telefone"
                className={inputClass}
                {...register(`thirdParties.${index}.phone` as const)}
              />
              <input
                placeholder="Placa do veículo"
                className={inputClass}
                {...register(`thirdParties.${index}.vehiclePlate` as const)}
              />
              <button
                type="button"
                onClick={() => thirdParties.remove(index)}
                className="flex items-center justify-center rounded-md text-danger hover:bg-danger/10"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => thirdParties.append({ name: '' })}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus size={14} /> Adicionar terceiro
          </button>
        </div>
      </Section>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface-hover"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando…' : 'Abrir sinistro'}
        </button>
      </div>
    </form>
  );
}
