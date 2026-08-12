// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { prisma } from '@seguros/database';

/**
 * Consulta direta ao Prisma, sem passar por ClaimsRepository — mesmo padrão
 * já usado em Documents/Notifications: OcrAiModule não importa ClaimsModule,
 * então monta seu próprio contexto de leitura.
 */
@Injectable()
export class AiContextRepository {
  async getClaimContext(claimId: string) {
    return prisma.claim.findFirst({
      where: { id: claimId },
      include: {
        client: true,
        insurer: { select: { name: true } },
        broker: { select: { name: true } },
        assignedUser: { select: { name: true } },
        thirdParties: true,
        checklistItems: { include: { documents: { select: { fileName: true, status: true } } } },
        comments: { include: { author: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
        timelineEvents: { orderBy: { createdAt: 'asc' } },
      },
    });
  }
}

