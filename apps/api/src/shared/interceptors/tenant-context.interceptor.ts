// @ts-nocheck
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { requestContextStorage } from '@seguros/database';
import { Observable } from 'rxjs';

/**
 * Roda logo após o JwtAuthGuard (é um interceptor, não um guard, para
 * garantir que `request.user` já esteja populado). Envolve o restante do
 * pipeline da requisição num AsyncLocalStorage contendo tenantId/userId/role,
 * que o Prisma Client Extension (packages/database) lê automaticamente.
 *
 * Rotas públicas (@Public()) não têm `request.user` — nesse caso o contexto
 * simplesmente não é populado e as queries rodam em "modo administrativo"
 * (ver comentário em prisma-tenant-extension.ts). Rotas públicas que
 * precisam de isolamento por tenant (ex: portal de upload por token, Fase 9)
 * devem resolver o tenantId a partir do token da URL e filtrar explicitamente.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      requestContextStorage.run(
        { tenantId: user.tenantId, userId: user.userId, role: user.role },
        () => {
          next.handle().subscribe(subscriber);
        },
      );
    });
  }
}

