import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca uma rota como pública, bypassando o JwtAuthGuard global.
 * Uso: login, registro de tenant, refresh token, e as rotas do portal
 * do cliente (upload sem login, Fase 9).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
