'use client';

import { EMAIL_TEMPLATE_LABELS, type EmailTemplateKey } from '@seguros/schemas';
import { useState } from 'react';

import { ChecklistTemplateManager } from '@/components/settings/ChecklistTemplateManager';
import { EmailTemplateEditor } from '@/components/settings/EmailTemplateEditor';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';

type Section = 'email' | 'checklist';

export default function ConfiguracoesPage() {
  const [section, setSection] = useState<Section>('email');
  const { data: templates, isLoading } = useEmailTemplates();
  const [activeKey, setActiveKey] = useState<EmailTemplateKey | null>(null);

  const selected = templates?.find((t) => t.key === (activeKey ?? templates[0]?.key));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Configurações</h1>
      </div>

      <div className="flex gap-1.5 border-b border-border">
        <button
          onClick={() => setSection('email')}
          className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
            section === 'email' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-ink'
          }`}
        >
          Modelos de e-mail
        </button>
        <button
          onClick={() => setSection('checklist')}
          className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
            section === 'checklist' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-ink'
          }`}
        >
          Modelos de checklist
        </button>
      </div>

      {section === 'email' ? (
        isLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-surface" />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
            <nav className="space-y-1">
              {templates?.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveKey(t.key)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                    (activeKey ?? templates[0]?.key) === t.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:bg-surface-hover hover:text-ink'
                  }`}
                >
                  {EMAIL_TEMPLATE_LABELS[t.key]}
                </button>
              ))}
            </nav>
            <div className="rounded-lg border border-border bg-surface p-4">
              {selected ? (
                <EmailTemplateEditor key={selected.key} template={selected} />
              ) : (
                <p className="text-sm text-muted">Nenhum modelo encontrado.</p>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="rounded-lg border border-border bg-surface p-4">
          <ChecklistTemplateManager />
        </div>
      )}
    </div>
  );
}
