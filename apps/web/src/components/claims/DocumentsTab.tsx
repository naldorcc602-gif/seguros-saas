'use client';

import type { ClaimDetail } from '@seguros/schemas';
import { Copy, Link as LinkIcon, Upload } from 'lucide-react';
import { useState } from 'react';

import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { FileDropZone } from '@/components/documents/FileDropZone';
import { OcrFieldsReview } from '@/components/documents/OcrFieldsReview';
import {
  useAttachLink,
  useChecklist,
  useClaimDocuments,
  useUpdateChecklistItemStatus,
  useUploadDocument,
  useUploadLinks,
} from '@/hooks/useDocuments';
import { useRealtimeDocuments } from '@/hooks/useRealtimeDocuments';
import { documentsApi } from '@/lib/documents-api';

function formatSize(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachLinkForm({
  onAttach,
  isPending,
}: {
  onAttach: (fileName: string, url: string) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [url, setUrl] = useState('');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        <LinkIcon size={12} /> Colar link em vez de anexar arquivo
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!fileName.trim() || !url.trim()) return;
        onAttach(fileName.trim(), url.trim());
        setFileName('');
        setUrl('');
        setOpen(false);
      }}
      className="flex flex-col gap-2 rounded-md border border-border bg-bg p-2"
    >
      <input
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
        placeholder="Nome do documento"
        className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-primary"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://…"
        type="url"
        className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-primary"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          Anexar link
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-hover"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function DocumentsTab({ claim }: { claim: ClaimDetail }) {
  useRealtimeDocuments(claim.id);

  const { data: checklist } = useChecklist(claim.id);
  const { data: documents } = useClaimDocuments(claim.id);
  const upload = useUploadDocument(claim.id);
  const attachLink = useAttachLink(claim.id);
  const updateChecklistStatus = useUpdateChecklistItemStatus(claim.id);
  const uploadLinks = useUploadLinks(claim.id);

  const [uploadingProgress, setUploadingProgress] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState<string | null>(null);

  const handleFiles = async (files: File[], checklistItemId?: string) => {
    for (const file of files) {
      setUploadingProgress(0);
      try {
        await upload.mutateAsync({ file, checklistItemId, onProgress: setUploadingProgress });
      } finally {
        setUploadingProgress(null);
      }
    }
  };

  const handleAttachLink = (fileName: string, url: string, checklistItemId?: string) => {
    attachLink.mutate({ fileName, url, checklistItemId });
  };

  const handleDownload = async (documentId: string) => {
    const { url } = await documentsApi.getDownloadUrl(documentId);
    window.open(url, '_blank');
  };

  const handleGenerateLink = async () => {
    const link = await uploadLinks.generate.mutateAsync(30);
    await navigator.clipboard.writeText(link.url).catch(() => undefined);
    setLinkCopied(link.id);
    setTimeout(() => setLinkCopied(null), 2000);
  };

  const documentsWithoutChecklist = (documents ?? []).filter((d) => !d.checklistItemId);

  return (
    <div className="space-y-4">
      {/* Link seguro para o cliente */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-ink">Link para o segurado</h3>
          <button
            onClick={handleGenerateLink}
            disabled={uploadLinks.generate.isPending}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            <LinkIcon size={14} /> Gerar novo link
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">
          Envie este link ao segurado para que ele suba documentos sem precisar de login. Válido por 30 dias.
        </p>
        {uploadLinks.data && uploadLinks.data.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {uploadLinks.data.map((link) => (
              <li key={link.id} className="flex items-center justify-between gap-2 rounded-md bg-bg px-3 py-2 text-xs">
                <span className="truncate font-mono text-muted">{link.url}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(link.url).catch(() => undefined);
                    setLinkCopied(link.id);
                    setTimeout(() => setLinkCopied(null), 2000);
                  }}
                  className="flex shrink-0 items-center gap-1 text-primary hover:underline"
                >
                  <Copy size={12} /> {linkCopied === link.id ? 'Copiado!' : 'Copiar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Checklist inteligente */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="font-display text-sm font-semibold text-ink">Checklist de documentos</h3>
        {!checklist || checklist.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Nenhum checklist configurado para este tipo de produto ainda.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {checklist.map((item) => (
              <div key={item.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{item.name}</span>
                    {item.required && <span className="text-xs text-danger">obrigatório</span>}
                  </div>
                  <select
                    value={item.status}
                    onChange={(e) =>
                      updateChecklistStatus.mutate({ itemId: item.id, status: e.target.value })
                    }
                    className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-primary"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="RECEIVED">Recebido</option>
                    <option value="APPROVED">Aprovado</option>
                    <option value="REJECTED">Rejeitado</option>
                    <option value="RESUBMISSION_REQUESTED">Reenvio solicitado</option>
                  </select>
                </div>

                {item.documents.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {item.documents.map((doc) => (
                      <li key={doc.id}>
                        <div className="flex items-center justify-between text-xs">
                          <button onClick={() => handleDownload(doc.id)} className="truncate text-primary hover:underline">
                            {doc.fileName} {doc.externalUrl && '(link)'}
                          </button>
                          <span className="flex shrink-0 items-center gap-2 text-muted">
                            {formatSize(doc.sizeBytes)}
                            <DocumentStatusBadge status={doc.status} />
                          </span>
                        </div>
                        {doc.ocrExtractedData && <OcrFieldsReview claimId={claim.id} data={doc.ocrExtractedData} />}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-2 space-y-2">
                  <FileDropZone onFilesSelected={(files) => handleFiles(files, item.id)} disabled={upload.isPending} />
                  <AttachLinkForm
                    isPending={attachLink.isPending}
                    onAttach={(fileName, url) => handleAttachLink(fileName, url, item.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentos avulsos (sem item de checklist) */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <Upload size={14} className="text-primary" />
          <h3 className="font-display text-sm font-semibold text-ink">Outros documentos</h3>
        </div>
        {uploadingProgress !== null && (
          <p className="mt-2 text-xs text-muted">Enviando… {uploadingProgress}%</p>
        )}
        <div className="mt-2 space-y-2">
          <FileDropZone onFilesSelected={(files) => handleFiles(files)} disabled={upload.isPending} />
          <AttachLinkForm
            isPending={attachLink.isPending}
            onAttach={(fileName, url) => handleAttachLink(fileName, url)}
          />
        </div>
        {documentsWithoutChecklist.length > 0 && (
          <ul className="mt-3 space-y-1">
            {documentsWithoutChecklist.map((doc) => (
              <li key={doc.id}>
                <div className="flex items-center justify-between text-xs">
                  <button onClick={() => handleDownload(doc.id)} className="truncate text-primary hover:underline">
                    {doc.fileName} {doc.externalUrl && '(link)'}
                  </button>
                  <span className="flex shrink-0 items-center gap-2 text-muted">
                    {formatSize(doc.sizeBytes)}
                    <DocumentStatusBadge status={doc.status} />
                    {doc.uploadedByName && <span>· {doc.uploadedByName}</span>}
                  </span>
                </div>
                {doc.ocrExtractedData && <OcrFieldsReview claimId={claim.id} data={doc.ocrExtractedData} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
