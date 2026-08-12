'use client';

import type { RegistryKey } from '@seguros/schemas';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { RegistryFormModal } from './RegistryFormModal';
import { REGISTRY_FIELD_CONFIG } from '@/lib/registry-field-config';
import { useRegistryList, useRegistryMutations } from '@/hooks/useRegistries';

interface RegistryTableProps {
  registryKey: RegistryKey;
  entityLabel: string;
}

type RegistryRecord = Record<string, unknown> & { id: string };

export function RegistryTable({ registryKey, entityLabel }: RegistryTableProps) {
  const fields = REGISTRY_FIELD_CONFIG[registryKey];
  const columns = fields.filter((f) => f.column);
  const { data, isLoading, isError } = useRegistryList<RegistryRecord>(registryKey);
  const { create, update, remove } = useRegistryMutations<RegistryRecord>(registryKey);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingRecord, setEditingRecord] = useState<RegistryRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingRecord(null);
    setModalMode('create');
  };
  const openEdit = (record: RegistryRecord) => {
    setEditingRecord(record);
    setModalMode('edit');
  };
  const closeModal = () => setModalMode(null);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (modalMode === 'edit' && editingRecord) {
      await update.mutateAsync({ id: editingRecord.id, data: values });
    } else {
      await create.mutateAsync(values);
    }
    closeModal();
  };

  const handleDelete = async (record: RegistryRecord) => {
    setDeleteError(null);
    if (!confirm(`Remover "${record.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await remove.mutateAsync(record.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Não foi possível remover este registro.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">{entityLabel}</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={16} /> Novo
        </button>
      </div>

      {deleteError && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{deleteError}</p>}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2 font-medium">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-danger">
                  Não foi possível carregar os dados.
                </td>
              </tr>
            )}
            {!isLoading && data?.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-muted">
                  Nenhum registro ainda.
                </td>
              </tr>
            )}
            {data?.map((record) => (
              <tr key={record.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2 text-ink">
                    {(record[col.key] as string) || <span className="text-muted">—</span>}
                  </td>
                ))}
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => openEdit(record)}
                      className="rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-ink"
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(record)}
                      className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <RegistryFormModal
          title={modalMode === 'edit' ? `Editar ${entityLabel.toLowerCase()}` : `Novo(a) ${entityLabel.toLowerCase()}`}
          fields={fields}
          initialValues={editingRecord ?? undefined}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
