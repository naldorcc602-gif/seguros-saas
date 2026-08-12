// @ts-nocheck
import { z } from 'zod';

import { claimStageEnum } from './dashboard.schema';

export const claimPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type ClaimPriority = z.infer<typeof claimPriorityEnum>;

export const claimProductTypeEnum = z.enum([
  'AUTO',
  'CARGO',
  'LIFE',
  'RESIDENTIAL',
  'BUSINESS',
  'TRANSPORT',
  'RC',
  'RCTRC',
  'RCDC',
  'RCV',
]);
export type ClaimProductType = z.infer<typeof claimProductTypeEnum>;

/** Ordem fixa das colunas do Kanban — a UI sempre renderiza nesta ordem. */
export const KANBAN_STAGE_ORDER = [
  'NEW',
  'INITIAL_CONTACT',
  'DOCS_PENDING',
  'DOCS_RECEIVED',
  'ANALYSIS',
  'INSPECTION',
  'ADJUSTMENT',
  'INSURER',
  'PAYMENT',
  'COMPLETED',
  'DENIED',
] as const;

export const kanbanCardSchema = z.object({
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
export type KanbanCard = z.infer<typeof kanbanCardSchema>;

export const moveClaimStageSchema = z.object({
  stage: claimStageEnum,
});
export type MoveClaimStageInput = z.infer<typeof moveClaimStageSchema>;

export const quickCreateClaimSchema = z.object({
  clientName: z.string().min(2, 'Informe o nome do segurado.'),
  clientDocumentType: z.enum(['CPF', 'CNPJ']),
  clientDocument: z.string().min(5, 'Informe um CPF/CNPJ válido.'),
  productType: claimProductTypeEnum,
  priority: claimPriorityEnum.default('MEDIUM'),
  estimatedValue: z.number().nonnegative().optional(),
});
export type QuickCreateClaimInput = z.infer<typeof quickCreateClaimSchema>;

export const claimThirdPartySchema = z.object({
  id: z.string(),
  name: z.string(),
  document: z.string().nullable(),
  phone: z.string().nullable(),
  vehiclePlate: z.string().nullable(),
  description: z.string().nullable(),
});

export const claimTimelineEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  actorIsClient: z.boolean(),
  createdAt: z.string(),
});

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

  client: z.object({
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
  }),
  insurer: z.object({ id: z.string(), name: z.string() }).nullable(),
  broker: z.object({ id: z.string(), name: z.string() }).nullable(),
  assignedUser: z.object({ id: z.string(), name: z.string(), email: z.string() }).nullable(),
  tags: z.array(z.object({ id: z.string(), name: z.string(), color: z.string().nullable() })),
  thirdParties: z.array(claimThirdPartySchema),
  timelineEvents: z.array(claimTimelineEventSchema),
});
export type ClaimDetail = z.infer<typeof claimDetailSchema>;

export interface ClaimListResponse {
  items: KanbanCard[];
  total: number;
  page: number;
  pageSize: number;
}

/** Eventos emitidos pelo WebSocket do Kanban (sala por tenant). */
export interface KanbanRealtimeEvents {
  'claim.created': { card: KanbanCard };
  'claim.stage_changed': { claimId: string; stage: z.infer<typeof claimStageEnum>; card: KanbanCard };
  'claim.updated': { claimId: string; card: KanbanCard };
  'document.uploaded': { claimId: string; documentId: string; fileName: string; uploadedByClient: boolean };
  'notification.created': { id: string; type: string; title: string; body: string; claimId: string | null };
}

