'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

import type { RegistryFieldConfig } from '@/lib/registry-field-config';

interface RegistryFormModalProps {
  title: string;
  fields: RegistryFieldConfig[];
  initialValues?: Record<string, unknown>;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

export function RegistryFormModal({ title, fields, initialValues, onClose, onSubmit }: RegistryFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      initial[field.key] = (initialValues?.[field.key] as string) ?? '';
    }
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      // Campos vazios viram `undefined` (não string vazia) para não sobrescrever
      // valores opcionais com "" no banco.
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(values)) {
        payload[key] = value === '' ? undefined : value;
      }
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-surface-hover hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {error && <p className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.key}>
              <label className="text-sm font-medium text-ink">
                {field.label}
                {field.required && <span className="text-danger"> *</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  required={field.required}
                  value={values[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-primary"
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  required={field.required}
                  value={values[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
}
