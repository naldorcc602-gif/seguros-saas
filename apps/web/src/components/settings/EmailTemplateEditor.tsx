'use client';

import { EMAIL_TEMPLATE_VARIABLES, type EmailTemplateItem, type PreviewEmailResponse } from '@seguros/schemas';
import { Eye, Save } from 'lucide-react';
import { useState } from 'react';

import { useUpdateEmailTemplate } from '@/hooks/useEmailTemplates';
import { emailTemplatesApi } from '@/lib/email-templates-api';

export function EmailTemplateEditor({ template }: { template: EmailTemplateItem }) {
  const [subject, setSubject] = useState(template.subject);
  const [bodyHtml, setBodyHtml] = useState(template.bodyHtml);
  const [preview, setPreview] = useState<PreviewEmailResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const update = useUpdateEmailTemplate();

  const isDirty = subject !== template.subject || bodyHtml !== template.bodyHtml;

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      setPreview(await emailTemplatesApi.preview({ subject, bodyHtml }));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = () => {
    update.mutate({ key: template.key, input: { subject, bodyHtml } });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-ink">Assunto</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Corpo (HTML)</label>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={10}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="rounded-md bg-bg p-3">
          <p className="text-xs font-medium text-muted">Variáveis disponíveis (use {'{{variavel}}'}):</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {EMAIL_TEMPLATE_VARIABLES.map((v) => (
              <code key={v} className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-primary">
                {`{{${v}}}`}
              </code>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-surface-hover disabled:opacity-60"
          >
            <Eye size={14} /> {previewLoading ? 'Gerando…' : 'Atualizar preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || update.isPending}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            <Save size={14} /> {update.isPending ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-medium text-muted">Preview (com dados de exemplo)</p>
        {!preview ? (
          <p className="mt-2 text-sm text-muted">Clique em "Atualizar preview" para ver como o e-mail vai ficar.</p>
        ) : (
          <div className="mt-2">
            <p className="border-b border-border pb-2 text-sm font-medium text-ink">{preview.subject}</p>
            <div
              className="mt-2 max-w-none text-sm text-ink [&_a]:text-primary [&_p]:mb-2 [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
