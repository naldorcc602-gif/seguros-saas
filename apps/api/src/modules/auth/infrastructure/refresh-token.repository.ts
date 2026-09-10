import { Injectable } from '@nestjs/common';
import { prisma } from '@seguros/database';

@Injectable()
export class RefreshTokenRepository {
  create(userId: string, tokenHash: string, expiresAt: Date, ipAddress?: string, userAgent?: string) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt, ipAddress, userAgent },
    });
  }

  findValidByHash(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
  }

  revoke(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { revoked: true } });
  }

  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
  }
}
