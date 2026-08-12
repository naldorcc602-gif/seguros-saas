// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { getCurrentTenantId, prisma, UserRole } from '@seguros/database';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  body: string;
  claimId?: string;
}

@Injectable()
export class NotificationsRepository {
  listForUser(userId: string, limit = 30) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, read: false } });
  }

  create(data: CreateNotificationData) {
    return prisma.notification.create({ data: data as never });
  }

  async markAsRead(id: string) {
    const result = await prisma.notification.updateMany({ where: { id }, data: { read: true } });
    return result.count > 0;
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  }

  /**
   * Quem deve ser notificado sobre um sinistro: o responsável designado, se
   * houver; senão, todos os Administradores e Gestores do tenant (ninguém
   * fica sem saber que um sinistro novo chegou só porque ainda não foi
   * atribuído a um regulador específico).
   */
  async findRecipientUserIds(tenantId: string, assignedUserId?: string | null): Promise<string[]> {
    if (assignedUserId) return [assignedUserId];
    const users = await prisma.user.findMany({
      where: { tenantId, role: { in: [UserRole.ADMIN, UserRole.MANAGER] }, active: true },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
}

@Injectable()
export class EmailTemplatesRepository {
  list() {
    return prisma.emailTemplate.findMany({ orderBy: { key: 'asc' } });
  }

  findByKey(key: string) {
    const tenantId = getCurrentTenantId();
    return prisma.emailTemplate.findFirst({ where: { key, tenantId } });
  }

  async update(key: string, data: { subject: string; bodyHtml: string }) {
    const result = await prisma.emailTemplate.updateMany({ where: { key }, data });
    if (result.count === 0) return null;
    return this.findByKey(key);
  }
}

