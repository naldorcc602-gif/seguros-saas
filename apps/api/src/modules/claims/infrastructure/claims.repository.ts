import { Injectable } from '@nestjs/common';
import { getCurrentTenantId, prisma } from '@seguros/database';
import type { ClaimPriority, ClaimProductType } from '@seguros/schemas';

export interface QuickCreateClaimData {
  clientName: string;
  clientDocumentType: string;
  clientDocument: string;
  productType: ClaimProductType;
  priority: ClaimPriority;
  estimatedValue?: number;
}

export interface FullCreateClaimData extends Record<string, unknown> {
  clientName: string;
  clientDocumentType: string;
  clientDocument: string;
  clientPhone?: string;
  clientWhatsapp?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientZipCode?: string;
  insurerId?: string;
  brokerId?: string;
  assignedUserId?: string;
  insurerNumber?: string;
  policyNumber?: string;
  productType: string;
  coverage?: string;
  deductible?: number;
  insuredItem?: string;
  vehiclePlate?: string;
  renavam?: string;
  chassis?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  occurredAt?: string;
  occurredLocation?: string;
  description?: string;
  claimType?: string;
  cause?: string;
  estimatedValue?: number;
  notes?: string;
  priority?: string;
  thirdParties?: Array<{ name: string; document?: string; phone?: string; vehiclePlate?: string; description?: string }>;
}

export interface ListClaimsFilters {
  stage?: string;
  priority?: string;
  insurerId?: string;
  brokerId?: string;
  search?: string;
  page: number;
  pageSize: number;
}

const kanbanInclude = {
  client: { select: { name: true } },
  insurer: { select: { name: true } },
  broker: { select: { name: true } },
  assignedUser: { select: { name: true } },
  tags: { include: { tag: true } },
} as const;

const detailInclude = {
  client: true,
  insurer: true,
  broker: true,
  assignedUser: { select: { id: true, name: true, email: true } },
  tags: { include: { tag: true } },
  thirdParties: true,
  adjusters: { include: { adjuster: true } },
  timelineEvents: { orderBy: { createdAt: 'desc' as const } },
  comments: {
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

@Injectable()
export class ClaimsRepository {
  /** Lista todos os sinistros não arquivados, com os dados necessários para o cartão do Kanban. */
  findAllForKanban() {
    return prisma.claim.findMany({
      include: kanbanInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Listagem paginada com filtros, para a tela de Sinistros (Fase 8). */
  async findAllPaginated(filters: ListClaimsFilters) {
    const where: Record<string, unknown> = {};
    if (filters.stage) where.stage = filters.stage;
    if (filters.priority) where.priority = filters.priority;
    if (filters.insurerId) where.insurerId = filters.insurerId;
    if (filters.brokerId) where.brokerId = filters.brokerId;
    if (filters.search) {
      where.OR = [
        { internalNumber: { contains: filters.search, mode: 'insensitive' } },
        { insurerNumber: { contains: filters.search, mode: 'insensitive' } },
        { policyNumber: { contains: filters.search, mode: 'insensitive' } },
        { vehiclePlate: { contains: filters.search, mode: 'insensitive' } },
        { client: { name: { contains: filters.search, mode: 'insensitive' } } },
        { client: { document: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        include: kanbanInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.claim.count({ where }),
    ]);

    return { items, total, page: filters.page, pageSize: filters.pageSize };
  }

  findById(id: string) {
    return prisma.claim.findFirst({ where: { id }, include: kanbanInclude });
  }

  /** Detalhe completo do sinistro, para a tela de Fase 8 (todos os campos + relações). */
  findByIdDetailed(id: string) {
    return prisma.claim.findFirst({ where: { id }, include: detailInclude });
  }

  /**
   * Gera o próximo número interno do sinistro no formato "AAAA-NNNNNN".
   *
   * Limitação conhecida: a contagem é feita dentro da mesma transação da
   * criação (count + create), o que é seguro contra a maioria das corridas
   * graças ao isolamento de transação do Postgres, mas sob altíssima
   * concorrência de criação simultânea pode colidir. A evolução para
   * produção é uma sequence dedicada por tenant (SEQUENCE do Postgres ou
   * uma tabela `ClaimCounter` com UPDATE ... RETURNING atômico) — deixada
   * para o hardening pré-produção (Fase 15/16), já que o volume esperado
   * de criação simultânea de sinistros por um mesmo tenant é baixo.
   */
  private async nextInternalNumber(tx: typeof prisma, tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await tx.claim.count({
      where: { tenantId, internalNumber: { startsWith: `${year}-` } },
    });
    return `${year}-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Busca um Client existente pelo documento ou cria um novo. Evita duplicar
   * o cadastro do segurado quando ele já abriu outro sinistro antes.
   */
  private async findOrCreateClient(
    tx: typeof prisma,
    tenantId: string,
    data: {
      name: string;
      documentType: string;
      document: string;
      phone?: string;
      whatsapp?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    },
  ) {
    const existing = await tx.client.findFirst({ where: { tenantId, document: data.document } });
    if (existing) {
      return tx.client.update({ where: { id: existing.id }, data });
    }
    return tx.client.create({ data: { tenantId, ...data } });
  }

  /**
   * Copia os itens do template de checklist (por tipo de produto) para o
   * sinistro recém-criado — o "checklist inteligente" do escopo original.
   * Copiamos os dados (nome, obrigatoriedade), não uma referência ao
   * template: se o template mudar depois, sinistros já abertos não devem
   * mudar retroativamente (decisão já registrada na Fase 2, seção 2.2).
   */
  private async seedChecklistFromTemplate(
    tx: typeof prisma,
    tenantId: string,
    claimId: string,
    productType: string,
  ): Promise<void> {
    const templates = await tx.checklistTemplateItem.findMany({
      where: { tenantId, productType: productType as never },
      orderBy: { order: 'asc' },
    });

    if (templates.length === 0) return;

    await tx.claimChecklistItem.createMany({
      data: templates.map((t) => ({
        claimId,
        name: t.name,
        required: t.required,
        status: 'PENDING' as const,
      })),
    });
  }

  async quickCreate(data: QuickCreateClaimData, tenantId: string) {
    return prisma.$transaction(async (tx) => {
      const client = await this.findOrCreateClient(tx as unknown as typeof prisma, tenantId, {
        name: data.clientName,
        documentType: data.clientDocumentType,
        document: data.clientDocument,
      });

      const internalNumber = await this.nextInternalNumber(tx as unknown as typeof prisma, tenantId);

      const claim = await tx.claim.create({
        data: {
          tenantId,
          internalNumber,
          clientId: client.id,
          productType: data.productType,
          priority: data.priority,
          estimatedValue: data.estimatedValue,
          stage: 'NEW',
        },
      });

      await tx.timelineEvent.create({
        data: { tenantId, claimId: claim.id, type: 'CLAIM_CREATED', description: 'Sinistro criado.' },
      });

      await this.seedChecklistFromTemplate(tx as unknown as typeof prisma, tenantId, claim.id, data.productType);

      return tx.claim.findFirstOrThrow({ where: { id: claim.id }, include: kanbanInclude });
    });
  }

  /** Criação completa (Fase 8) — todos os campos do escopo original. */
  async create(data: FullCreateClaimData, tenantId: string) {
    return prisma.$transaction(async (tx) => {
      const client = await this.findOrCreateClient(tx as unknown as typeof prisma, tenantId, {
        name: data.clientName,
        documentType: data.clientDocumentType,
        document: data.clientDocument,
        phone: data.clientPhone,
        whatsapp: data.clientWhatsapp,
        email: data.clientEmail,
        address: data.clientAddress,
        city: data.clientCity,
        state: data.clientState,
        zipCode: data.clientZipCode,
      });

      const internalNumber = await this.nextInternalNumber(tx as unknown as typeof prisma, tenantId);

      const claim = await tx.claim.create({
        data: {
          tenantId,
          internalNumber,
          clientId: client.id,
          insurerId: data.insurerId,
          brokerId: data.brokerId,
          assignedUserId: data.assignedUserId,
          insurerNumber: data.insurerNumber,
          policyNumber: data.policyNumber,
          productType: data.productType as never,
          coverage: data.coverage,
          deductible: data.deductible,
          insuredItem: data.insuredItem,
          vehiclePlate: data.vehiclePlate,
          renavam: data.renavam,
          chassis: data.chassis,
          vehicleModel: data.vehicleModel,
          vehicleYear: data.vehicleYear,
          occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined,
          occurredLocation: data.occurredLocation,
          description: data.description,
          claimType: data.claimType,
          cause: data.cause,
          hasThirdParties: (data.thirdParties?.length ?? 0) > 0,
          estimatedValue: data.estimatedValue,
          notes: data.notes,
          priority: (data.priority ?? 'MEDIUM') as never,
          stage: 'NEW',
        },
      });

      await tx.timelineEvent.create({
        data: { tenantId, claimId: claim.id, type: 'CLAIM_CREATED', description: 'Sinistro criado.' },
      });

      if (data.thirdParties && data.thirdParties.length > 0) {
        await tx.thirdParty.createMany({
          data: data.thirdParties.map((tp) => ({
            claimId: claim.id,
            name: tp.name,
            document: tp.document,
            phone: tp.phone,
            vehiclePlate: tp.vehiclePlate,
            description: tp.description,
          })),
        });
      }

      await this.seedChecklistFromTemplate(tx as unknown as typeof prisma, tenantId, claim.id, data.productType);

      return tx.claim.findFirstOrThrow({ where: { id: claim.id }, include: detailInclude });
    });
  }

  /** Adiciona um comentário ao sinistro (visível na aba de comentários da tela de detalhe). */
  async addComment(claimId: string, content: string, authorUserId: string | undefined, tenantId: string) {
    return prisma.comment.create({
      data: { tenantId, claimId, content, authorUserId },
      include: { author: { select: { name: true } } },
    });
  }

  /**
   * Atualização parcial. Assim como updateStage, usa `updateMany` (filtrado
   * por tenant pela extensão do Prisma) em vez de `update` de registro único.
   */
  async update(claimId: string, data: Record<string, unknown>) {
    const cleanData = { ...data };
    if ('occurredAt' in cleanData && cleanData.occurredAt) {
      cleanData.occurredAt = new Date(cleanData.occurredAt as string);
    }

    const result = await prisma.claim.updateMany({ where: { id: claimId }, data: cleanData });
    if (result.count === 0) return null;

    return prisma.claim.findFirst({ where: { id: claimId }, include: detailInclude });
  }

  async updateStage(claimId: string, newStage: string) {
    const tenantId = getCurrentTenantId();

    // updateStage NÃO usa `prisma.claim.update({ where: { id } })` de propósito:
    // update()/findUnique() de registro único não passam pelo filtro automático
    // de tenant da extensão do Prisma (ver prisma-tenant-extension.ts). Por
    // isso usamos updateMany (que É interceptado) — se o claimId pertencer a
    // outro tenant, o `where` abaixo não casa com nenhuma linha e count = 0.
    const result = await prisma.claim.updateMany({
      where: { id: claimId },
      data: {
        stage: newStage as never,
        closedAt: newStage === 'COMPLETED' || newStage === 'DENIED' ? new Date() : null,
      },
    });

    if (result.count === 0) {
      return null;
    }

    await prisma.timelineEvent.create({
      data: {
        tenantId: tenantId!,
        claimId,
        type: 'STAGE_CHANGED',
        description: `Sinistro movido para a etapa "${newStage}".`,
      },
    });

    return prisma.claim.findFirst({ where: { id: claimId }, include: kanbanInclude });
  }
}
