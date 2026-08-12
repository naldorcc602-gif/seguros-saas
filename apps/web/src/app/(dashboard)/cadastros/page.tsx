'use client';

import { REGISTRY_KEYS, REGISTRY_LABELS, type RegistryKey } from '@seguros/schemas';
import { useState } from 'react';

import { RegistryTable } from '@/components/registries/RegistryTable';

export default function CadastrosPage() {
  const [activeTab, setActiveTab] = useState<RegistryKey>('insurers');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Cadastros</h1>
        <p className="text-sm text-muted">Seguradoras, corretores, clientes, peritos, oficinas, despachantes e advogados.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {REGISTRY_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-ink'
            }`}
          >
            {REGISTRY_LABELS[key]}
          </button>
        ))}
      </div>

      <RegistryTable registryKey={activeTab} entityLabel={REGISTRY_LABELS[activeTab]} />
    </div>
  );
}
