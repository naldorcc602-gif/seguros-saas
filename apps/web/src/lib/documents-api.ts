import type {
  ChecklistItem,
  ConfirmUploadInput,
  DocumentItem,
  PresignUploadInput,
  PresignUploadResponse,
  UploadLinkItem,
} from '@seguros/schemas';

import { apiFetch } from './api-client';

export const documentsApi = {
  presign: (claimId: string, input: PresignUploadInput) =>
    apiFetch<PresignUploadResponse>(`/claims/${claimId}/documents/presign`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  confirm: (claimId: string, input: ConfirmUploadInput) =>
    apiFetch<DocumentItem>(`/claims/${claimId}/documents/confirm`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  list: (claimId: string) => apiFetch<DocumentItem[]>(`/claims/${claimId}/documents`),

  getDownloadUrl: (documentId: string) =>
    apiFetch<{ url: string; fileName: string }>(`/documents/${documentId}/download`),

  updateStatus: (documentId: string, status: string) =>
    apiFetch<DocumentItem>(`/documents/${documentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  presignVersion: (documentId: string, input: PresignUploadInput) =>
    apiFetch<PresignUploadResponse>(`/documents/${documentId}/versions/presign`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  confirmVersion: (documentId: string, storageKey: string) =>
    apiFetch<DocumentItem>(`/documents/${documentId}/versions/confirm`, {
      method: 'POST',
      body: JSON.stringify({ storageKey }),
    }),

  listChecklist: (claimId: string) => apiFetch<ChecklistItem[]>(`/claims/${claimId}/checklist`),

  updateChecklistItemStatus: (itemId: string, status: string) =>
    apiFetch<ChecklistItem>(`/checklist-items/${itemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  generateUploadLink: (claimId: string, expiresInDays?: number) =>
    apiFetch<UploadLinkItem>(`/claims/${claimId}/upload-links`, {
      method: 'POST',
      body: JSON.stringify({ expiresInDays }),
    }),

  listUploadLinks: (claimId: string) => apiFetch<UploadLinkItem[]>(`/claims/${claimId}/upload-links`),
};
