// @ts-nocheck
import type { ClaimDetail, KanbanCard } from '@seguros/schemas';

type ClaimWithRelations = {
  id: string;
  internalNumber: string;
  stage: string;
  priority: string;
  productType: string;
  estimatedValue: unknown;
  createdAt: Date;
  updatedAt: Date;
  client: { name: string };
  insurer: { name: string } | null;
  broker: { name: string } | null;
  assignedUser: { name: string } | null;
  tags: Array<{ tag: { id: string; name: string; color: string | null } }>;
};

export function toKanbanCard(claim: ClaimWithRelations): KanbanCard {
  const daysOpen = Math.floor((Date.now() - claim.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  return {
    id: claim.id,
    internalNumber: claim.internalNumber,
    stage: claim.stage as KanbanCard['stage'],
    priority: claim.priority as KanbanCard['priority'],
    productType: claim.productType as KanbanCard['productType'],
    clientName: claim.client.name,
    insurerName: claim.insurer?.name ?? null,
    brokerName: claim.broker?.name ?? null,
    assignedUserName: claim.assignedUser?.name ?? null,
    daysOpen,
    estimatedValue: claim.estimatedValue !== null ? Number(claim.estimatedValue) : null,
    tags: claim.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
    updatedAt: claim.updatedAt.toISOString(),
  };
}

/**
 * `ClaimListItem` (tabela de Sinistros) tem exatamente o mesmo formato de
 * `KanbanCard` — mesmo include (`kanbanInclude`), mesmos campos. Em vez de
 * duplicar a função, reexportamos com o nome semântico usado pela tela de
 * listagem paginada.
 */
export const toClaimListItem = toKanbanCard;

/**
 * Mapeia o registro completo do Prisma (com todas as relações do
 * `detailInclude`) para o formato de detalhe consumido pela tela de
 * sinistro. Tipado frouxamente (`any`) de propósito: sem o Prisma Client
 * gerado neste ambiente não há como referenciar o tipo exato do include;
 * o contrato real é garantido pelo `claimDetailSchema` do lado do front-end.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toClaimDetail(claim: any): ClaimDetail {
  return {
    id: claim.id,
    internalNumber: claim.internalNumber,
    insurerNumber: claim.insurerNumber,
    stage: claim.stage,
    priority: claim.priority,
    productType: claim.productType,
    policyNumber: claim.policyNumber,
    coverage: claim.coverage,
    deductible: claim.deductible !== null ? Number(claim.deductible) : null,
    insuredItem: claim.insuredItem,
    vehiclePlate: claim.vehiclePlate,
    renavam: claim.renavam,
    chassis: claim.chassis,
    vehicleModel: claim.vehicleModel,
    vehicleYear: claim.vehicleYear,
    occurredAt: claim.occurredAt ? claim.occurredAt.toISOString() : null,
    occurredLocation: claim.occurredLocation,
    description: claim.description,
    claimType: claim.claimType,
    cause: claim.cause,
    hasThirdParties: claim.hasThirdParties,
    estimatedValue: claim.estimatedValue !== null ? Number(claim.estimatedValue) : null,
    notes: claim.notes,
    slaDueAt: claim.slaDueAt ? claim.slaDueAt.toISOString() : null,
    closedAt: claim.closedAt ? claim.closedAt.toISOString() : null,
    deniedReason: claim.deniedReason,
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
    client: {
      id: claim.client.id,
      name: claim.client.name,
      documentType: claim.client.documentType,
      document: claim.client.document,
      phone: claim.client.phone,
      whatsapp: claim.client.whatsapp,
      email: claim.client.email,
      address: claim.client.address,
      city: claim.client.city,
      state: claim.client.state,
      zipCode: claim.client.zipCode,
    },
    insurer: claim.insurer ? { id: claim.insurer.id, name: claim.insurer.name } : null,
    broker: claim.broker ? { id: claim.broker.id, name: claim.broker.name } : null,
    assignedUser: claim.assignedUser
      ? { id: claim.assignedUser.id, name: claim.assignedUser.name, email: claim.assignedUser.email }
      : null,
    tags: claim.tags.map((t: { tag: { id: string; name: string; color: string | null } }) => ({
      id: t.tag.id,
      name: t.tag.name,
      color: t.tag.color,
    })),
    thirdParties: claim.thirdParties.map((tp: Record<string, unknown>) => ({
      id: tp.id as string,
      name: tp.name as string,
      document: (tp.document as string) ?? null,
      phone: (tp.phone as string) ?? null,
      vehiclePlate: (tp.vehiclePlate as string) ?? null,
      description: (tp.description as string) ?? null,
    })),
    timelineEvents: claim.timelineEvents.map((e: Record<string, unknown>) => ({
      id: e.id as string,
      type: e.type as string,
      description: e.description as string,
      actorIsClient: e.actorIsClient as boolean,
      createdAt: (e.createdAt as Date).toISOString(),
    })),
    comments: claim.comments.map((c: Record<string, unknown>) => ({
      id: c.id as string,
      content: c.content as string,
      authorName: (c.author as { name: string } | null)?.name ?? null,
      createdAt: (c.createdAt as Date).toISOString(),
    })),
  };
}
