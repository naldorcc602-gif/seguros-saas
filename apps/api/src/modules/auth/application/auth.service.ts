// @ts-nocheck
import { Injectable } from '@nestjs/common';

import {
  AccountLockedError,
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidOrExpiredRefreshTokenError,
  InvalidTwoFactorCodeError,
  TwoFactorNotPendingError,
} from '../domain/auth.errors';
import { PasswordService } from '../infrastructure/password.service';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository';
import { TokenService } from '../infrastructure/token.service';
import { TwoFactorService } from '../infrastructure/two-factor.service';
import { UsersRepository } from '../infrastructure/users.repository';
import { ConfirmTwoFactorDto, LoginDto, RegisterTenantDto } from './dto';

// Bloqueio de conta após tentativas de login falhas (Fase 16 — hardening de
// produção). 5 tentativas / 15 minutos é um equilíbrio comum entre proteger
// contra força bruta e não travar um usuário legítimo que só errou a senha
// duas ou três vezes seguidas.
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export interface LoginResult {
  requiresTwoFactor: boolean;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  /**
   * Cria um novo tenant (corretora/seguradora) com seu primeiro usuário,
   * que sempre nasce como ADMIN. Usuários adicionais são criados depois,
   * de dentro do sistema, pelo próprio Administrador.
   */
  async registerTenant(dto: RegisterTenantDto) {
    const existing = await this.usersRepository.findByEmailAcrossTenants(dto.adminEmail);
    if (existing) {
      throw new EmailAlreadyInUseError();
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const { tenant, user } = await this.usersRepository.createTenantAndAdmin({
      tenantName: dto.tenantName,
      tenantDocument: dto.tenantDocument,
      adminName: dto.adminName,
      adminEmail: dto.adminEmail,
      passwordHash,
    });

    return { tenantId: tenant.id, userId: user.id };
  }

  /**
   * Login por e-mail/senha.
   *
   * Decisão de modelagem: a busca é feita globalmente por e-mail (sem exigir
   * que o usuário informe o tenant), assumindo que na prática um mesmo e-mail
   * não é reaproveitado em tenants diferentes. Se isso vier a ser um problema
   * real (ex: um mesmo profissional atende duas corretoras clientes), a
   * evolução natural é adicionar uma tela de seleção de tenant quando mais de
   * um resultado for encontrado — sem quebrar a API pública deste método.
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    const user = await this.usersRepository.findByEmailAcrossTenants(dto.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const retryAfterMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new AccountLockedError(retryAfterMinutes);
    }

    const passwordMatches = await this.passwordService.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      await this.usersRepository.registerFailedLogin(user.id, MAX_FAILED_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MINUTES);
      throw new InvalidCredentialsError();
    }

    await this.usersRepository.resetFailedLogins(user.id);

    if (user.twoFactorEnabled) {
      const tempToken = await this.tokenService.issueTwoFactorTempToken(user.id);
      return { requiresTwoFactor: true, tempToken };
    }

    return this.issueSessionForUser(user.id, user.tenantId, user.role, ipAddress, userAgent);
  }

  async verifyTwoFactorLogin(
    tempToken: string,
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResult> {
    let payload: { sub: string };
    try {
      payload = await this.tokenService.verifyTwoFactorTempToken(tempToken);
    } catch {
      throw new TwoFactorNotPendingError();
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new TwoFactorNotPendingError();
    }

    const isValid = this.twoFactorService.verifyCode(code, user.twoFactorSecret);
    if (!isValid) {
      throw new InvalidTwoFactorCodeError();
    }

    return this.issueSessionForUser(user.id, user.tenantId, user.role, ipAddress, userAgent);
  }

  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokenRepository.findValidByHash(tokenHash);
    if (!stored) {
      throw new InvalidOrExpiredRefreshTokenError();
    }

    // Rotação: o refresh token usado é sempre revogado, mesmo em caso de sucesso.
    // Se o mesmo refresh token for reapresentado depois, o pedido falha —
    // isso detecta reuso (ex: token roubado e usado por um atacante depois
    // do dono legítimo já ter renovado a sessão).
    await this.refreshTokenRepository.revoke(stored.id);

    return this.issueSessionForUser(
      stored.user.id,
      stored.user.tenantId,
      stored.user.role,
      ipAddress,
      userAgent,
    );
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokenRepository.findValidByHash(tokenHash);
    if (stored) {
      await this.refreshTokenRepository.revoke(stored.id);
    }
  }

  /** Primeira etapa da ativação do 2FA: gera o segredo e o QR code, mas NÃO ativa ainda. */
  async setupTwoFactor(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const secret = this.twoFactorService.generateSecret();
    await this.usersRepository.setTwoFactorSecret(userId, secret);
    const qrCodeDataUrl = await this.twoFactorService.generateQrCodeDataUrl(user.email, secret);
    return { qrCodeDataUrl, secret };
  }

  /** Segunda etapa: usuário confirma um código válido gerado a partir do secret -> 2FA fica ativo. */
  async confirmTwoFactor(userId: string, dto: ConfirmTwoFactorDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.twoFactorSecret) {
      throw new TwoFactorNotPendingError();
    }
    const isValid = this.twoFactorService.verifyCode(dto.code, user.twoFactorSecret);
    if (!isValid) {
      throw new InvalidTwoFactorCodeError();
    }
    await this.usersRepository.enableTwoFactor(userId);
    return { twoFactorEnabled: true };
  }

  private async issueSessionForUser(
    userId: string,
    tenantId: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResult> {
    const permissions = await this.usersRepository.getPermissionKeys(userId);
    const { accessToken, refreshToken, refreshTokenExpiresAt } = await this.tokenService.issueTokenPair({
      sub: userId,
      tenantId,
      role,
      permissions,
    });

    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);
    await this.refreshTokenRepository.create(userId, refreshTokenHash, refreshTokenExpiresAt, ipAddress, userAgent);
    await this.usersRepository.updateLastLogin(userId);

    return { requiresTwoFactor: false, accessToken, refreshToken };
  }
}

