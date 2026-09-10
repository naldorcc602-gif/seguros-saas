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

/** Eventos emitidos pelo WebSocket do Kanban (sala por tenant). */
export interface KanbanRealtimeEvents {
  'claim.created': { card: KanbanCard };
  'claim.stage_changed': { claimId: string; stage: z.infer<typeof claimStageEnum>; card: KanbanCard };
  'claim.updated': { claimId: string; card: KanbanCard };
  'document.uploaded': { claimId: string; documentId: string; fileName: string; uploadedByClient: boolean };
  'notification.created': { id: string; type: string; title: string; body: string; claimId: string | null };
}
