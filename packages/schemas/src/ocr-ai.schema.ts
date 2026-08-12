// @ts-nocheck
import { z } from 'zod';

/** Campos que o OCR tenta extrair — nomes fixos, usados tanto no worker quanto na tela de revisão. */
export const OCR_FIELD_KEYS = [
  'cpf',
  'cnpj',
  'name',
  'cnhNumber',
  'renavam',
  'chassis',
  'plate',
  'dates',
] as const;
export type OcrFieldKey = (typeof OCR_FIELD_KEYS)[number];

export const OCR_FIELD_LABELS: Record<OcrFieldKey, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  name: 'Nome',
  cnhNumber: 'Nº CNH',
  renavam: 'RENAVAM',
  chassis: 'Chassi',
  plate: 'Placa',
  dates: 'Datas encontradas',
};

/** Estrutura salva em Document.ocrExtractedData (JSON). */
export const ocrExtractedDataSchema = z.object({
  processedAt: z.string(),
  rawTextPreview: z.string(), // primeiros ~500 caracteres do texto reconhecido, para debug/conferência
  fields: z.record(z.enum(OCR_FIELD_KEYS), z.array(z.string())),
});
export type OcrExtractedData = z.infer<typeof ocrExtractedDataSchema>;

export const OCR_QUEUE_NAME = 'ocr-queue';

export interface OcrJobPayload {
  tenantId: string;
  documentId: string;
  storageKey: string;
  mimeType: string;
}

// ── IA ────────────────────────────────────────────────────────────────

export const aiActionEnum = z.enum([
  'summary',
  'missing_documents',
  'inconsistencies',
  'next_steps',
  'email_draft',
  'technical_opinion',
  'ask',
  'history_summary',
]);
export type AiAction = z.infer<typeof aiActionEnum>;

export const AI_ACTION_LABELS: Record<AiAction, string> = {
  summary: 'Resumo do sinistro',
  missing_documents: 'Documentos faltantes',
  inconsistencies: 'Alertar inconsistências',
  next_steps: 'Sugerir próximos passos',
  email_draft: 'Gerar e-mail',
  technical_opinion: 'Gerar parecer técnico',
  ask: 'Responder pergunta',
  history_summary: 'Histórico resumido',
};

export const aiRequestSchema = z.object({
  action: aiActionEnum,
  question: z.string().optional(), // usado só quando action === 'ask'
  emailPurpose: z.string().optional(), // usado só quando action === 'email_draft'
});
export type AiRequestInput = z.infer<typeof aiRequestSchema>;

export const aiResponseSchema = z.object({
  action: aiActionEnum,
  content: z.string(),
  generatedAt: z.string(),
});
export type AiResponse = z.infer<typeof aiResponseSchema>;

