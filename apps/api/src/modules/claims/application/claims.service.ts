import { Injectable } from '@nestjs/common';
import { getCurrentTenantId, getCurrentUserId } from '@seguros/database';
import { CLAIM_STAGE_LABELS, type ClaimDetail, type ClaimListResponse, type ClaimStage, type CommentItem, type KanbanCard } from '@seguros/schemas';

import { RealtimeGateway } from '../../../shared/realtime/realtime.gateway';
import type { ClaimNotificationContext } from '../../notifications/domain/notification-context';
import { NotificationsService } from '../../notifications/application/notifications.service';
import { ClaimNotFoundError } from '../domain/claims.errors';
import { ClaimsRepository } from '../infrastructure/claims.repository';
import { toClaimDetail, toClaimListItem, toKanbanCard } from './claim.mapper';
import { AddCommentDto, CreateClaimDto, ListClaimsQueryDto, MoveStageDto, QuickCreateClaimDto, UpdateClaimDto } from './dto';

/** Formato mínimo comum entre o retorno do Kanban e o do detalhe completo — usado só para montar o contexto de notificação. */
interface ClaimForNotification {
  id: string;
  tenantId: string;
  internalNumber: string;
  stage: string;
  assignedUserId: string | null;
  estimatedValue: unknown;
  client: { name: string; email: string | null };
  insurer: { name: string } | null;
  broker: { name: string } | null;
}

@Injectable()
export class ClaimsService {
  constructor(
    private readonly claimsRepository: ClaimsRepository,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listKanban(): Promise<KanbanCard[]> {
    const claims = await this.claimsRepository.findAllForKanban();
    return claims.map(toKanbanCard);
  }

  async quickCreate(dto: QuickCreateClaimDto): Promise<KanbanCard> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new Error('ClaimsService.quickCreate chamado fora de um contexto de requisição autenticado.');
    }

    const claim = await this.claimsRepository.quickCreate(
      {
        clientName: dto.clientName,
        clientDocumentType: dto.clientDocumentType,
        clientDocument: dto.clientDocument,
        productType: dto.productType as never,
        priority: (dto.priority ?? 'MEDIUM') as never,
        estimatedValue: dto.estimatedValue,
      },
      tenantId,
    );

    const card = toKanbanCard(claim);
    this.realtimeGateway.broadcastToTenant(tenantId, 'claim.created', { card });
    await this.notificationsService.notifyNewClaim(this.buildContext(claim as never));
    return card;
  }

  async moveStage(claimId: string, dto: MoveStageDto): Promise<KanbanCard> {
    const tenantId = getCurrentTenantId();
    const updated = await this.claimsRepository.updateStage(claimId, dto.stage);

    if (!updated) {
      throw new ClaimNotFoundError();
    }

    const card = toKanbanCard(updated);
    if (tenantId) {
      this.realtimeGateway.broadcastToTenant(tenantId, 'claim.stage_changed', {
        claimId,
        stage: dto.stage,
        card,
      });
    }
    await this.notificationsService.notifyStageChanged(this.buildContext(updated as never), dto.stage);
    return card;
  }

  /** Criação completa (Fase 8) — todos os campos do escopo original + terceiros. */
  async create(dto: CreateClaimDto): Promise<ClaimDetail> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new Error('ClaimsService.create chamado fora de um contexto de requisição autenticado.');
    }

    const claim = await this.claimsRepository.create(dto as never, tenantId);
    const detail = toClaimDetail(claim);

    this.realtimeGateway.broadcastToTenant(tenantId, 'claim.created', { card: toKanbanCard(claim as never) });
    await this.notificationsService.notifyNewClaim(this.buildContext(claim as never));
    return detail;
  }

  async list(query: ListClaimsQueryDto): Promise<ClaimListResponse> {
    const result = await this.claimsRepository.findAllPaginated({
      stage: query.stage,
      priority: query.priority,
      insurerId: query.insurerId,
      brokerId: query.brokerId,
      search: query.search,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    });

    return {
      items: result.items.map(toClaimListItem),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async findById(id: string): Promise<ClaimDetail> {
    const claim = await this.claimsRepository.findByIdDetailed(id);
    if (!claim) {
      throw new ClaimNotFoundError();
    }
    return toClaimDetail(claim);
  }

  async update(id: string, dto: UpdateClaimDto): Promise<ClaimDetail> {
    const updated = await this.claimsRepository.update(id, dto as Record<string, unknown>);
    if (!updated) {
      throw new ClaimNotFoundError();
    }

    const detail = toClaimDetail(updated);
    const tenantId = getCurrentTenantId();
    if (tenantId) {
      this.realtimeGateway.broadcastToTenant(tenantId, 'claim.updated', {
        claimId: id,
        card: toKanbanCard(updated as never),
      });
    }
    return detail;
  }

  async addComment(claimId: string, dto: AddCommentDto): Promise<CommentItem> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new Error('ClaimsService.addComment chamado fora de um contexto de requisição autenticado.');
    }
    const userId = getCurrentUserId();

    const comment = await this.claimsRepository.addComment(claimId, dto.content, userId, tenantId);
    return {
      id: comment.id,
      content: comment.content,
      authorName: comment.author?.name ?? null,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  /** Monta o contexto de notificação (Fase 10) a partir de um Claim já carregado com suas relações. */
  private buildContext(claim: ClaimForNotification): ClaimNotificationContext {
    return {
      tenantId: claim.tenantId,
      claimId: claim.id,
      claimNumber: claim.internalNumber,
      clientName: claim.client.name,
      clientEmail: claim.client.email,
      assignedUserId: claim.assignedUserId,
      stageLabel: CLAIM_STAGE_LABELS[claim.stage as ClaimStage],
      insurerName: claim.insurer?.name,
      brokerName: claim.broker?.name,
      estimatedValue: claim.estimatedValue !== null && claim.estimatedValue !== undefined ? Number(claim.estimatedValue) : null,
    };
  }
}
