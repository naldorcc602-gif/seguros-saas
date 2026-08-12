// @ts-nocheck
import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { CurrentUser, Public, type AuthenticatedUser } from '../../../shared/decorators';
import { AuthService } from '../application/auth.service';
import {
  ConfirmTwoFactorDto,
  LoginDto,
  RefreshTokenDto,
  RegisterTenantDto,
  VerifyTwoFactorLoginDto,
} from '../application/dto';

// Limite estrito nos endpoints de autenticação (Fase 16 — hardening de
// produção): 10 tentativas por minuto por IP, bem abaixo do limite global
// de 100/min da API. Complementa o bloqueio de conta por e-mail (5
// tentativas/15min, no AuthService) — um ataque de força bruta espalhando
// tentativas entre vários e-mails a partir do mesmo IP esbarra aqui antes
// de esbarrar no bloqueio individual de cada conta.
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register-tenant')
  @ApiOperation({
    summary: 'Cria um novo tenant (corretora/seguradora) + usuário Administrador',
    description: 'Rota pública. Usada uma única vez por tenant, no self-service signup inicial.',
  })
  @ApiResponse({ status: 201, description: 'Tenant e usuário Administrador criados.' })
  @ApiResponse({ status: 409, description: 'E-mail já em uso por outro usuário.' })
  registerTenant(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Login por e-mail/senha',
    description:
      'Rota pública. Se o usuário tiver 2FA ativo, retorna `{ requiresTwoFactor: true, tempToken }` em vez dos tokens finais — complete com `POST /auth/2fa/login`. ' +
      'Bloqueia a conta por 15 minutos após 5 tentativas falhas seguidas (429).',
  })
  @ApiResponse({ status: 200, description: 'Tokens emitidos, ou tempToken se 2FA estiver ativo.' })
  @ApiResponse({ status: 401, description: 'E-mail ou senha inválidos.' })
  @ApiResponse({ status: 429, description: 'Conta temporariamente bloqueada, ou rate limit excedido.' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('2fa/login')
  @ApiOperation({ summary: 'Completa o login em duas etapas com o código do app autenticador' })
  @ApiResponse({ status: 200, description: 'Tokens emitidos.' })
  @ApiResponse({ status: 400, description: 'Código inválido ou tempToken expirado/inexistente.' })
  verifyTwoFactorLogin(@Body() dto: VerifyTwoFactorLoginDto, @Req() req: Request) {
    return this.authService.verifyTwoFactorLogin(dto.tempToken, dto.code, req.ip, req.headers['user-agent']);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({
    summary: 'Troca um refresh token válido por um novo par de tokens (rotação)',
    description: 'O refresh token usado é sempre revogado, mesmo em caso de sucesso — reuso é detectado e rejeitado.',
  })
  @ApiResponse({ status: 200, description: 'Novo par de tokens emitido.' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido, expirado ou já utilizado.' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(dto.refreshToken, req.ip, req.headers['user-agent']);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoga o refresh token informado (encerra a sessão)' })
  @ApiResponse({ status: 204, description: 'Sessão encerrada.' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
  }

  @Post('2fa/setup')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Primeira etapa da ativação do 2FA — gera o secret e o QR code',
    description: 'O 2FA só passa a ser exigido no login depois de confirmado via `POST /auth/2fa/confirm`.',
  })
  @ApiResponse({ status: 201, description: 'QR code (data URL) e secret gerados.' })
  setupTwoFactor(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.setupTwoFactor(user.userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/confirm')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirma o código gerado pelo app autenticador e ativa o 2FA' })
  @ApiResponse({ status: 200, description: '2FA ativado.' })
  @ApiResponse({ status: 400, description: 'Código inválido ou nenhuma ativação pendente.' })
  confirmTwoFactor(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmTwoFactorDto) {
    return this.authService.confirmTwoFactor(user.userId, dto);
  }
}

