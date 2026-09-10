import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'node:crypto';

export interface TokenPayload {
  sub: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issueTokenPair(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRATION') ?? '15m',
    });

    // O refresh token em si é um valor opaco aleatório (não um JWT) — só o
    // hash dele fica no banco (ver RefreshTokenRepository), então mesmo um
    // vazamento do banco não permite forjar sessões.
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const refreshTokenExpiresAt = this.addDuration(
      new Date(),
      this.config.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d',
    );

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }

  hashRefreshToken(refreshToken: string): string {
    return crypto.createHash('sha256').update(refreshToken).digest('hex');
  }

  /**
   * Token de curtíssima duração emitido após validar e-mail/senha quando o
   * usuário tem 2FA ativado. Assinado com um secret DIFERENTE do access
   * token de propósito: assim, mesmo que o payload não carregue tenantId/
   * role/permissions, ele nunca é aceito pela JwtStrategy (que só valida
   * contra JWT_ACCESS_SECRET) — não dá para usá-lo para acessar rotas
   * protegidas, só para completar o segundo fator em /auth/2fa/login.
   */
  async issueTwoFactorTempToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, purpose: 'two-factor-pending' },
      {
        secret: this.config.get<string>('JWT_2FA_TEMP_SECRET'),
        expiresIn: '5m',
      },
    );
  }

  async verifyTwoFactorTempToken(token: string): Promise<{ sub: string }> {
    return this.jwtService.verifyAsync(token, {
      secret: this.config.get<string>('JWT_2FA_TEMP_SECRET'),
    });
  }

  private addDuration(base: Date, duration: string): Date {
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) {
      throw new Error(`Formato de duração inválido: ${duration}`);
    }
    const value = Number(match[1]);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';
    const msPerUnit: Record<'s' | 'm' | 'h' | 'd', number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(base.getTime() + value * msPerUnit[unit]);
  }
}
