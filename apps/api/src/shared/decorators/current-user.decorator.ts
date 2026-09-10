import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

/**
 * Extrai o usuário autenticado (populado pelo JwtStrategy) diretamente
 * no parâmetro do controller: `handler(@CurrentUser() user: AuthenticatedUser)`.
 */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
