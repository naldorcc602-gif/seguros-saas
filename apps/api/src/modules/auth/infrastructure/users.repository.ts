// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { prisma, UserRole } from '@seguros/database';

import { DEFAULT_CHECKLIST_TEMPLATES } from '../../documents/domain/default-checklist-templates';
import { DEFAULT_EMAIL_TEMPLATES } from '../../notifications/domain/default-email-templates';

export interface CreateTenantAdminInput {
  tenantName: string;
  tenantDocument?: string;
  adminName: string;
  adminEmail: string;
  passwordHash: string;
}

@Injectable()
export class UsersRepository {
  /**
   * Busca por e-mail SEM filtro de tenant (necessário no login, quando ainda
   * não existe contexto de tenant estabelecido). Se dois tenants tiverem
   * usuários com o mesmo e-mail, o primeiro encontrado "vence" — ver nota de
   * decisão no auth.service.ts sobre o modelo de login por e-mail global.
   */
  findByEmailAcrossTenants(email: string) {
    return prisma.user.findFirst({ where: { email, active: true } });
  }

  findById(userId: string) {
    // Roda dentro do contexto autenticado -> a extensão de tenant já
    // restringe automaticamente ao tenant do usuário logado.
    return prisma.user.findFirst({ where: { id: userId, active: true } });
  }

  async getPermissionKeys(userId: string): Promise<string[]> {
    const grants = await prisma.userPermission.findMany({
      where: { userId, granted: true },
      include: { permission: true },
    });
    return grants.map((g) => g.permission.key);
  }

  updateLastLogin(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  /**
   * Incrementa o contador de tentativas falhas e bloqueia a conta
   * temporariamente ao atingir o limite (Fase 16 — hardening de produção,
   * gap documentado desde a Fase 5). O limite e a duração do bloqueio ficam
   * como constantes no AuthService, não aqui — este método só executa a
   * escrita.
   */
  async registerFailedLogin(userId: string, maxAttempts: number, lockoutMinutes: number): Promise<void> {
    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) return;

    const attempts = user.failedLoginAttempts + 1;
    const shouldLock = attempts >= maxAttempts;

    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + lockoutMinutes * 60 * 1000) : user.lockedUntil,
      },
    });
  }

  /** Zera o contador e o bloqueio — chamado em todo login bem-sucedido. */
  resetFailedLogins(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  }

  setTwoFactorSecret(userId: string, secret: string) {
    return prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
  }

  enableTwoFactor(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
  }

  /**
   * Cria o primeiro tenant + o usuário Administrador, em uma transação.
   * Usado apenas no fluxo de "assinar o sistema" (self-service signup de
   * uma nova corretora/seguradora). Usuários adicionais dentro do tenant
   * são criados pelo próprio Administrador via módulo de Configurações
   * (fora do escopo desta fase de autenticação).
   */
  createTenantAndAdmin(input: CreateTenantAdminInput) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          document: input.tenantDocument,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: input.adminName,
          email: input.adminEmail,
          passwordHash: input.passwordHash,
          role: UserRole.ADMIN,
        },
      });

      // Semeia o checklist inteligente (Fase 9) com valores padrão sensatos,
      // para que o primeiro sinistro do tenant já funcione sem configuração
      // manual prévia. É apenas uma constante de dados (não um serviço do
      // módulo Documents), então não cria dependência circular entre módulos.
      await tx.checklistTemplateItem.createMany({
        data: DEFAULT_CHECKLIST_TEMPLATES.map((t) => ({ ...t, tenantId: tenant.id })) as any,
      });

      await tx.emailTemplate.createMany({
        data: DEFAULT_EMAIL_TEMPLATES.map((t) => ({ ...t, tenantId: tenant.id })),
      });

      return { tenant, user };
    });
  }
}

