'use client';

import { DOCUMENT_STATUS_LABELS } from '@seguros/schemas';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { FileDropZone } from '@/components/documents/FileDropZone';
import { portalApi } from '@/lib/portal-api';
import { tryGetBrowserGeolocation, uploadFileToPresignedUrl } from '@/lib/upload-helper';

/**
 * Portal público de upload — acessado pelo segurado, sem login, via o link
 * gerado na tela do sinistro (Fase 9). Usa `portalApi` (não `apiFetch`),
 * que nunca anexa um Bearer token nem tenta refresh de sessão.
 */
export default function PortalUploadPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data: info, isLoading, isError, refetch } = useQuery({
    queryKey: ['portal', token],
    queryFn: () => portalApi.getInfo(token),
    enabled: !!token,
    retry: false,
  });

  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [doneItemIds, setDoneItemIds] = useState<Set<string>>(new Set());
  const [geoLocation, setGeoLocation] = useState<string | undefined>();

  useEffect(() => {
    tryGetBrowserGeolocation().then(setGeoLocation);
  }, []);

  const handleUpload = async (files: File[], checklistItemId: string) => {
    setUploadingItemId(checklistItemId);
    setProgress(0);
    try {
      for (const file of files) {
        const { uploadUrl, storageKey } = await portalApi.presign(token, {
          fileName: file.name,
          mimeType: file.type as never,
          sizeBytes: file.size,
          checklistItemId,
        });
        await uploadFileToPresignedUrl(uploadUrl, file, setProgress);
        await portalApi.confirm(token, {
          storageKey,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          checklistItemId,
          geoLocation,
        });
      }
      setDoneItemIds((prev) => new Set(prev).add(checklistItemId));
      await refetch();
    } finally {
      setUploadingItemId(null);
    }
  };

  if (isLoading) {
    return <PortalShell>Carregando…</PortalShell>;
  }

  if (isError || !info) {
    return (
      <PortalShell>
        <p className="text-danger">
          Este link é inválido ou expirou. Entre em contato com o regulador responsável pelo seu sinistro para
          receber um novo link.
        </p>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="space-y-1 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">Envio de documentos</h1>
        <p className="text-sm text-muted">
          Sinistro <span className="font-mono">{info.internalNumber}</span> · {info.clientName}
        </p>
      </div>

      <p className="mt-4 rounded-md bg-primary/10 px-3 py-2 text-center text-xs text-primary">
        <ShieldCheck size={14} className="mr-1 inline" />
        Seus arquivos são enviados de forma segura e ficam vinculados apenas ao seu sinistro.
      </p>

      <div className="mt-6 space-y-4">
        {info.checklist.length === 0 && (
          <p className="text-center text-sm text-muted">
            Nenhum documento pendente de envio no momento.
          </p>
        )}
        {info.checklist.map((item) => {
          const isDone = doneItemIds.has(item.id) || item.documents.length > 0;
          return (
            <div key={item.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {item.name} {item.required && <span className="text-xs text-danger">*</span>}
                  </p>
                  <p className="text-xs text-muted">{DOCUMENT_STATUS_LABELS[item.status]}</p>
                </div>
                {isDone && <CheckCircle2 size={18} className="text-stage-payment" />}
              </div>

              {item.documents.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {item.documents.map((doc) => (
                    <li key={doc.id} className="text-xs text-muted">
                      {doc.fileName}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3">
                {uploadingItemId === item.id ? (
                  <p className="text-center text-xs text-muted">Enviando… {progress}%</p>
                ) : (
                  <FileDropZone onFilesSelected={(files) => handleUpload(files, item.id)} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {info.expiresAt && (
        <p className="mt-6 text-center text-xs text-muted">
          Este link expira em {new Date(info.expiresAt).toLocaleDateString('pt-BR')}.
        </p>
      )}
    </PortalShell>
  );
}

function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
