import { z } from 'zod';

import { ocrExtractedDataSchema } from './ocr-ai.schema';

export const documentStatusEnum = z.enum([
  'PENDING',
  'RECEIVED',
  'APPROVED',
  'REJECTED',
  'RESUBMISSION_REQUESTED',
]);
export type DocumentStatus = z.infer<typeof documentStatusEnum>;

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDING: 'Pendente',
  RECEIVED: 'Recebido',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  RESUBMISSION_REQUESTED: 'Reenvio solicitado',
};

/** Tipos de arquivo aceitos (escopo original: PDF, imagens, DOCX/XLSX, ZIP/RAR, vídeo). */
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-rar-compressed',
  'video/mp4',
  'video/quicktime',
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024; // 200MB (cobre vídeos curtos de vistoria)

export const presignUploadSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.enum(ACCEPTED_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_SIZE_BYTES),
  checklistItemId: z.string().optional(),
});
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

export const presignUploadResponseSchema = z.object({
  uploadUrl: z.string(),
  storageKey: z.string(),
});
export type PresignUploadResponse = z.infer<typeof presignUploadResponseSchema>;

export const confirmUploadSchema = z.object({
  storageKey: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  checklistItemId: z.string().optional(),
  geoLocation: z.string().optional(),
});
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;

export const documentItemSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  status: documentStatusEnum,
  checklistItemId: z.string().nullable(),
  uploadedByClient: z.boolean(),
  uploadedByName: z.string().nullable(),
  versionCount: z.number().int().nonnegative(),
  ocrExtractedData: ocrExtractedDataSchema.nullable(),
  createdAt: z.string(),
});
export type DocumentItem = z.infer<typeof documentItemSchema>;

export const updateDocumentStatusSchema = z.object({
  status: documentStatusEnum,
});
export type UpdateDocumentStatusInput = z.infer<typeof updateDocumentStatusSchema>;

export const checklistItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  required: z.boolean(),
  status: documentStatusEnum,
  documents: z.array(documentItemSchema),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const checklistTemplateItemSchema = z.object({
  id: z.string(),
  productType: z.string(),
  name: z.string(),
  required: z.boolean(),
  order: z.number().int(),
});
export type ChecklistTemplateItem = z.infer<typeof checklistTemplateItemSchema>;

export const createChecklistTemplateItemSchema = z.object({
  productType: z.string(),
  name: z.string().min(2),
  required: z.boolean().default(true),
  order: z.number().int().default(0),
});
export type CreateChecklistTemplateItemInput = z.infer<typeof createChecklistTemplateItemSchema>;

export const uploadLinkSchema = z.object({
  id: z.string(),
  token: z.string(),
  url: z.string(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});
export type UploadLinkItem = z.infer<typeof uploadLinkSchema>;

/** O que o portal público (sem login) recebe ao validar o token. */
export const portalClaimInfoSchema = z.object({
  internalNumber: z.string(),
  clientName: z.string(),
  productType: z.string(),
  checklist: z.array(checklistItemSchema),
  expiresAt: z.string().nullable(),
});
export type PortalClaimInfo = z.infer<typeof portalClaimInfoSchema>;

export const portalConfirmUploadSchema = confirmUploadSchema.extend({
  geoLocation: z.string().optional(),
});
export type PortalConfirmUploadInput = z.infer<typeof portalConfirmUploadSchema>;
