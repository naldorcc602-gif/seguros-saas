// @ts-nocheck
import { z } from 'zod';

export const notificationTypeEnum = z.enum([
  'NEW_CLAIM',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_REJECTED',
  'DOCUMENT_APPROVED',
  'DOCUMENT_PENDING',
  'STAGE_CHANGED',
  'PAYMENT',
  'DENIAL',
  'CLOSURE',
  'DEADLINE_DUE',
  'SLA_DUE',
]);
export type NotificationType = z.infer<typeof notificationTypeEnum>;

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  NEW_CLAIM: 'Novo sinistro',
  DOCUMENT_UPLOADED: 'Novo documento',
  DOCUMENT_REJECTED: 'Documento recusado',
  DOCUMENT_APPROVED: 'Documento aprovado',
  DOCUMENT_PENDING: 'Documento pendente',
  STAGE_CHANGED: 'Mudança de etapa',
  PAYMENT: 'Pagamento',
  DENIAL: 'Negativa',
  CLOSURE: 'Encerramento',
  DEADLINE_DUE: 'Prazo vencido',
  SLA_DUE: 'SLA vencido',
};

export const notificationItemSchema = z.object({
  id: z.string(),
  type: notificationTypeEnum,
  title: z.string(),
  body: z.string(),
  claimId: z.string().nullable(),
  read: z.boolean(),
  createdAt: z.string(),
});
export type NotificationItem = z.infer<typeof notificationItemSchema>;

export const notificationListResponseSchema = z.object({
  items: z.array(notificationItemSchema),
  unreadCount: z.number().int().nonnegative(),
});
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;

/** Chaves fixas dos modelos de e-mail do escopo original. */
export const EMAIL_TEMPLATE_KEYS = [
  'document_request',
  'confirmation',
  'pending',
  'update',
  'payment',
  'denial',
  'closure',
  'satisfaction_survey',
] as const;
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateKey, string> = {
  document_request: 'Solicitação de documentos',
  confirmation: 'Confirmação',
  pending: 'Pendência',
  update: 'Atualização',
  payment: 'Pagamento',
  denial: 'Negativa',
  closure: 'Encerramento',
  satisfaction_survey: 'Pesquisa de satisfação',
};

/**
 * Variáveis disponíveis para substituição nos modelos (sintaxe `{{variavel}}`).
 * A lista é fixa e documentada aqui — o "editor visual" do escopo original
 * foi implementado como um editor de texto com preview ao vivo (Fase 10),
 * não um WYSIWYG completo tipo Mailchimp; ver decisão registrada em
 * docs/10-notificacoes-email.md.
 */
export const EMAIL_TEMPLATE_VARIABLES = [
  'claimNumber',
  'clientName',
  'stageLabel',
  'insurerName',
  'brokerName',
  'productLabel',
  'estimatedValue',
  'tenantName',
] as const;
export type EmailTemplateVariable = (typeof EMAIL_TEMPLATE_VARIABLES)[number];

export const EMAIL_QUEUE_NAME = 'email-queue';

/** Payload de um job da fila de e-mail. O worker busca o template pelo par (tenantId, templateKey) e renderiza com `variables`. */
export interface EmailJobPayload {
  tenantId: string;
  claimId: string;
  templateKey: EmailTemplateKey;
  toEmail: string;
  variables: Record<string, string>;
}

export const emailTemplateItemSchema = z.object({
  id: z.string(),
  key: z.enum(EMAIL_TEMPLATE_KEYS),
  subject: z.string(),
  bodyHtml: z.string(),
  updatedAt: z.string(),
});
export type EmailTemplateItem = z.infer<typeof emailTemplateItemSchema>;

export const updateEmailTemplateSchema = z.object({
  subject: z.string().min(1, 'Informe o assunto.'),
  bodyHtml: z.string().min(1, 'O corpo do e-mail não pode ficar vazio.'),
});
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;

export const previewEmailTemplateSchema = z.object({
  subject: z.string(),
  bodyHtml: z.string(),
});
export type PreviewEmailTemplateInput = z.infer<typeof previewEmailTemplateSchema>;

export const previewEmailResponseSchema = z.object({
  subject: z.string(),
  bodyHtml: z.string(),
});
export type PreviewEmailResponse = z.infer<typeof previewEmailResponseSchema>;

