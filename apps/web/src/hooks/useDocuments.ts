import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConfirmUploadInput, PresignUploadInput } from '@seguros/schemas';

import { documentsApi } from '@/lib/documents-api';
import { uploadFileToPresignedUrl } from '@/lib/upload-helper';

export function useClaimDocuments(claimId: string) {
  return useQuery({
    queryKey: ['documents', claimId],
    queryFn: () => documentsApi.list(claimId),
    enabled: !!claimId,
  });
}

export function useChecklist(claimId: string) {
  return useQuery({
    queryKey: ['checklist', claimId],
    queryFn: () => documentsApi.listChecklist(claimId),
    enabled: !!claimId,
  });
}

/**
 * Mutation de upload completo: presign -> PUT direto no S3/R2 -> confirm.
 * `onProgress` é opcional, repassado ao XHR do upload.
 */
export function useUploadDocument(claimId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      checklistItemId,
      onProgress,
    }: {
      file: File;
      checklistItemId?: string;
      onProgress?: (percent: number) => void;
    }) => {
      const presignInput: PresignUploadInput = {
        fileName: file.name,
        mimeType: file.type as PresignUploadInput['mimeType'],
        sizeBytes: file.size,
        checklistItemId,
      };
      const { uploadUrl, storageKey } = await documentsApi.presign(claimId, presignInput);
      await uploadFileToPresignedUrl(uploadUrl, file, onProgress);

      const confirmInput: ConfirmUploadInput = {
        storageKey,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        checklistItemId,
      };
      return documentsApi.confirm(claimId, confirmInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', claimId] });
      queryClient.invalidateQueries({ queryKey: ['checklist', claimId] });
    },
  });
}

export function useUpdateDocumentStatus(claimId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, status }: { documentId: string; status: string }) =>
      documentsApi.updateStatus(documentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', claimId] });
    },
  });
}

export function useUpdateChecklistItemStatus(claimId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) =>
      documentsApi.updateChecklistItemStatus(itemId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', claimId] });
    },
  });
}

export function useUploadLinks(claimId: string) {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ['upload-links', claimId],
    queryFn: () => documentsApi.listUploadLinks(claimId),
    enabled: !!claimId,
  });

  const generate = useMutation({
    mutationFn: (expiresInDays?: number) => documentsApi.generateUploadLink(claimId, expiresInDays),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['upload-links', claimId] }),
  });

  return { ...list, generate };
}
