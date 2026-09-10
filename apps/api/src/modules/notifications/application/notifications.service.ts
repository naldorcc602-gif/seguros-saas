import { Injectable } from '@nestjs/common';
import type { EmailTemplateKey, NotificationItem, NotificationListResponse, NotificationType } from '@seguros/schemas';

import { RealtimeGateway } from '../../../shared/realtime/realtime.gateway';
import type { ClaimNotificationContext } from '../domain/notification-context';
import { EmailQueueService } from '../infrastructure/email-queue.service';
import { NotificationsRepository } from '../infrastructure/notifications.repository';

function formatCurrencyBRL(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly emailQueue: EmailQueueService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // ── Consulta (sino de notificações) ──────────────────────────────────

  async listForUser(userId: string): Promise<NotificationListResponse> {
    const [items, unreadCount] = await Promise.all([
      this.repository.listForUser(userId),
      this.repository.countUnread(userId),
    ]);
    return {
      items: items.map((n): NotificationItem => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        body: n.body,
        claimId: n.claimId,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  }

  async markAsRead(id: string): Promise<void> {
    await this.repository.markAsRead(id);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repository.markAllAsRead(userId);
  }

  // ── Disparo interno (chamado por ClaimsService/DocumentsService) ─────

  async notifyNewClaim(ctx: ClaimNotificationContext): Promise<void> {
    await this.notifyInternal(ctx, 'NEW_CLAIM', 'Novo sinistro aberto', `${ctx.claimNumber} — ${ctx.clientName}`);
    await this.sendClientEmail(ctx, 'confirmation');
  }

  async notifyStageChanged(ctx: ClaimNotificationContext, newStage: string): Promise<void> {
    const type: NotificationType = newStage === 'PAYMENT' ? 'PAYMENT' : newStage === 'DENIED' ? 'DENIAL' : newStage === 'COMPLETED' ? 'CLOSURE' : 'STAGE_CHANGED';
    const title =
      type === 'PAYMENT'
        ? 'Pagamento liberado'
        : type === 'DENIAL'
          ? 'Sinistro negado'
          : type === 'CLOSURE'
            ? 'Sinistro encerrado'
            : 'Sinistro mudou de etapa';

    await this.notifyInternal(ctx, type, title, `${ctx.claimNumber} — ${ctx.stageLabel ?? newStage}`);

    const emailKey: EmailTemplateKey =
      type === 'PAYMENT' ? 'payment' : type === 'DENIAL' ? 'denial' : type === 'CLOSURE' ? 'closure' : 'update';
    await this.sendClientEmail(ctx, emailKey);

    // Ao encerrar, também dispara a pesquisa de satisfação (evento separado do escopo original).
    if (type === 'CLOSURE') {
      await this.sendClientEmail(ctx, 'satisfaction_survey');
    }
  }

  async notifyDocumentEvent(
    ctx: ClaimNotificationContext,
    kind: 'uploaded' | 'approved' | 'rejected' | 'pending',
    fileName: string,
  ): Promise<void> {
    const type: NotificationType =
      kind === 'uploaded'
        ? 'DOCUMENT_UPLOADED'
        : kind === 'approved'
          ? 'DOCUMENT_APPROVED'
          : kind === 'rejected'
            ? 'DOCUMENT_REJECTED'
            : 'DOCUMENT_PENDING';

    const title =
      kind === 'uploaded'
        ? 'Novo documento recebido'
        : kind === 'approved'
          ? 'Documento aprovado'
          : kind === 'rejected'
            ? 'Documento recusado'
            : 'Documento pendente';

    await this.notifyInternal(ctx, type, title, `${ctx.claimNumber} — ${fileName}`);

    // Só o cliente precisa ser avisado por e-mail quando um documento dele é
    // recusado (precisa reenviar); os demais eventos de documento ficam
    // internos (sino), evitando spam de e-mail ao segurado a cada arquivo.
    if (kind === 'rejected') {
      await this.sendClientEmail(ctx, 'pending');
    }
  }

  async notifySlaOrDeadline(ctx: ClaimNotificationContext, kind: 'sla' | 'deadline'): Promise<void> {
    const type: NotificationType = kind === 'sla' ? 'SLA_DUE' : 'DEADLINE_DUE';
    const title = kind === 'sla' ? 'SLA vencido' : 'Prazo vencido';
    // Alerta puramente interno — não faz sentido e-mail para o segurado avisando que o SLA interno estourou.
    await this.notifyInternal(ctx, type, title, `${ctx.claimNumber} — ${ctx.clientName}`);
  }

  // ── Internos ──────────────────────────────────────────────────────────

  private async notifyInternal(
    ctx: ClaimNotificationContext,
    type: NotificationType,
    title: string,
    body: string,
  ): Promise<void> {
    const recipientIds = await this.repository.findRecipientUserIds(ctx.tenantId, ctx.assignedUserId);
    for (const userId of recipientIds) {
      const notification = await this.repository.create({ userId, type, title, body, claimId: ctx.claimId });
      this.realtimeGateway.emitToUser(userId, 'notification.created', {
        id: notification.id,
        type,
        title,
        body,
        claimId: ctx.claimId,
      });
    }
  }

  private async sendClientEmail(ctx: ClaimNotificationContext, templateKey: EmailTemplateKey): Promise<void> {
    if (!ctx.clientEmail) return; // sem e-mail cadastrado — não é erro, só não há para quem mandar
    await this.emailQueue.enqueue({
      tenantId: ctx.tenantId,
      claimId: ctx.claimId,
      templateKey,
      toEmail: ctx.clientEmail,
      variables: {
        claimNumber: ctx.claimNumber,
        clientName: ctx.clientName,
        stageLabel: ctx.stageLabel ?? '',
        insurerName: ctx.insurerName ?? '',
        brokerName: ctx.brokerName ?? '',
        productLabel: ctx.productLabel ?? '',
        estimatedValue: formatCurrencyBRL(ctx.estimatedValue),
        tenantName: ctx.tenantName ?? '',
      },
    });
  }
}
