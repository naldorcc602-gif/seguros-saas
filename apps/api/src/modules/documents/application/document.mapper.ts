// @ts-nocheck
import type { DocumentItem } from '@seguros/schemas';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDocumentItem(doc: any): DocumentItem {
  return {
    id: doc.id,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    externalUrl: doc.externalUrl ?? null,
    status: doc.status,
    checklistItemId: doc.checklistItemId,
    uploadedByClient: doc.uploadedByClient,
    uploadedByName: doc.uploadedByClient ? 'Cliente (portal)' : (doc.uploadedByUser?.name ?? null),
    versionCount: doc.versions?.length ?? 0,
    ocrExtractedData: doc.ocrExtractedData ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toChecklistItem(item: any) {
  return {
    id: item.id,
    name: item.name,
    required: item.required,
    status: item.status,
    documents: item.documents.map(toDocumentItem),
  };
}


