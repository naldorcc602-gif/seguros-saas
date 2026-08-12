// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma, ClaimStage } from '@seguros/database';

import { NotificationsService } from '../application/notifications.service';

const TERMINAL_STAGES: ClaimStage[] = ['COMPLETED' as ClaimStage, 'DENIED' as ClaimStage];

/**
 * Roda 1x por dia (00:30) verificando sinistros com SLA vencido. Consulta o
 * Prisma diretamente em vez de passar por ClaimsRepository/ClaimsModule —
 * de propósito, para o NotificationsModule não precisar importar
 * ClaimsModule (o que criaria um ciclo, já que ClaimsModule importa
 * NotificationsModule para disparar notificações de sinistro/etapa).
 *
 * Simplificação assumida: notifica TODO dia enquanto o sinistro seguir com
 * SLA vencido e em aberto (não guarda um "já notificado" para não repetir).
 * Isso é intencional — um alerta que some sozinho depois de um dia é fácil
 * de esquecer; a evolução para "notificar só uma vez" é adicionar uma coluna
 * `slaAlertSentAt` no Claim quando isso incomodar na prática.
 */
@Injectable()
export class SlaCheckScheduler {
  private readonly logger = new Logger(SlaCheckScheduler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkOverdueSla(): Promise<void> {
    const overdueClaims = await prisma.claim.findMany({
      where: {
        slaDueAt: { lt: new Date() },
        stage: { notIn: TERMINAL_STAGES },
      },
      include: { client: { select: { name: true, email: true } } },
    });

    this.logger.log(`Verificação diária de SLA: ${overdueClaims.length} sinistro(s) vencido(s).`);

    for (const claim of overdueClaims) {
      await this.notificationsService.notifySlaOrDeadline(
        {
          tenantId: claim.tenantId,
          claimId: claim.id,
          claimNumber: claim.internalNumber,
          clientName: claim.client?.name || 'Cliente',
          clientEmail: claim.client?.email || '',
          assignedUserId: claim.assignedUserId,
        },
        'sla',
      );
    }
  }
}

