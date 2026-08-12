// @ts-nocheck
import { z } from 'zod';

import { claimPriorityEnum, claimProductTypeEnum } from './claim.schema';
import { claimStageEnum } from './dashboard.schema';

export const thirdPartySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Informe o nome do terceiro.'),
  document: z.string().optional(),
  phone: z.string().optional(),
  vehiclePlate: z.string().optional(),
  description: z.string().optional(),
});
export type ThirdPartyInput = z.infer<typeof thirdPartySchema>;

/** Formulário completo de abertura de sinistro (Fase 8). */
export const createClaimSchema = z.object({
  // Segurado (cria ou reaproveita um Client existente pelo documento)
  clientName: z.string().min(2, 'Informe o nome do segurado.'),
  clientDocumentType: z.enum(['CPF', 'CNPJ']),
  clientDocument: z.string().min(5, 'Informe um documento válido.'),
  clientPhone: z.string().optional(),
  clientWhatsapp: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientAddress: z.string().optional(),
  clientCity: z.string().optional(),
  clientState: z.string().optional(),
  clientZipCode: z.string().optional(),

  // Vínculos
  insurerId: z.string().optional(),
  brokerId: z.string().optional(),
  assignedUserId: z.string().optional(),

  // Apólice e produto
  insurerNumber: z.string().optional(),
  policyNumber: z.string().optional(),
  productType: claimProductTypeEnum,
  coverage: z.string().optional(),
  deductible: z.number().nonnegative().optional(),
  insuredItem: z.string().optional(),

  // Veículo (Auto/Carga/Transportes)
  vehiclePlate: z.string().optional(),
  renavam: z.string().optional(),
  chassis: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.number().int().optional(),

  // Ocorrência
  occurredAt: z.string().optional(),
  occurredLocation: z.string().optional(),
  description: z.string().optional(),
  claimType: z.string().optional(),
  cause: z.string().optional(),
  estimatedValue: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  priority: claimPriorityEnum.default('MEDIUM'),

  thirdParties: z.array(thirdPartySchema).default([]),
});
export type CreateClaimInput = z.infer<typeof createClaimSchema>;

/** Edição — só os campos do próprio sinistro; dados do segurado se editam via Cadastros > Clientes. */
export const updateClaimSchema = createClaimSchema
  .omit({
    clientName: true,
    clientDocumentType: true,
    clientDocument: true,
    clientPhone: true,
    clientWhatsapp: true,
    clientEmail: true,
    clientAddress: true,
    clientCity: true,
    clientState: true,
    clientZipCode: true,
    thirdParties: true,
  })
  .partial();
export type UpdateClaimInput = z.infer<typeof updateClaimSchema>;

/** Linha da listagem paginada (tabela de Sinistros) — formato achatado, leve. */
export const claimListItemSchema = z.object({
  id: z.string(),
  internalNumber: z.string(),
  stage: claimStageEnum,
  priority: claimPriorityEnum,
  productType: claimProductTypeEnum,
  clientName: z.string(),
  insurerName: z.string().nullable(),
  brokerName: z.string().nullable(),
  assignedUserName: z.string().nullable(),
  daysOpen: z.number().int().nonnegative(),
  estimatedValue: z.number().nullable(),
  tags: z.array(z.object({ id: z.string(), name: z.string(), color: z.string().nullable() })),
  updatedAt: z.string(),
});
export type ClaimListItem = z.infer<typeof claimListItemSchema>;

export const claimListResponseSchema = z.object({
  items: z.array(claimListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});
export type ClaimListResponse = z.infer<typeof claimListResponseSchema>;

export const commentSchema = z.object({
  id: z.string(),
  content: z.string(),
  authorName: z.string().nullable(),
  createdAt: z.string(),
});
export type CommentItem = z.infer<typeof commentSchema>;

export const timelineEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  actorIsClient: z.boolean(),
  createdAt: z.string(),
});
export type TimelineEventItem = z.infer<typeof timelineEventSchema>;

const clientDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  documentType: z.string(),
  document: z.string(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zipCode: z.string().nullable(),
});

/** Detalhe completo do sinistro (tela da Fase 8) — estrutura aninhada por relação. */
export const claimDetailSchema = z.object({
  id: z.string(),
  internalNumber: z.string(),
  insurerNumber: z.string().nullable(),
  stage: claimStageEnum,
  priority: claimPriorityEnum,
  productType: claimProductTypeEnum,
  policyNumber: z.string().nullable(),
  coverage: z.string().nullable(),
  deductible: z.number().nullable(),
  insuredItem: z.string().nullable(),

  vehiclePlate: z.string().nullable(),
  renavam: z.string().nullable(),
  chassis: z.string().nullable(),
  vehicleModel: z.string().nullable(),
  vehicleYear: z.number().nullable(),

  occurredAt: z.string().nullable(),
  occurredLocation: z.string().nullable(),
  description: z.string().nullable(),
  claimType: z.string().nullable(),
  cause: z.string().nullable(),
  hasThirdParties: z.boolean(),
  estimatedValue: z.number().nullable(),
  notes: z.string().nullable(),
  slaDueAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  deniedReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),

  client: clientDetailSchema,
  insurer: z.object({ id: z.string(), name: z.string() }).nullable(),
  broker: z.object({ id: z.string(), name: z.string() }).nullable(),
  assignedUser: z.object({ id: z.string(), name: z.string(), email: z.string() }).nullable(),
  tags: z.array(z.object({ id: z.string(), name: z.string(), color: z.string().nullable() })),
  thirdParties: z.array(thirdPartySchema.extend({ id: z.string() })),
  timelineEvents: z.array(timelineEventSchema),
  comments: z.array(commentSchema),
});
export type ClaimDetail = z.infer<typeof claimDetailSchema>;

export const claimListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  stage: claimStageEnum.optional(),
  priority: claimPriorityEnum.optional(),
  insurerId: z.string().optional(),
  brokerId: z.string().optional(),
  search: z.string().optional(),
});
export type ClaimListQuery = z.infer<typeof claimListQuerySchema>;

export const addCommentSchema = z.object({
  content: z.string().min(1, 'O comentário não pode ficar vazio.'),
});
export type AddCommentInput = z.infer<typeof addCommentSchema>;

