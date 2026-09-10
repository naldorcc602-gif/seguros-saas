import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Restringe uma rota às permissões granulares informadas (ex: "financeiro:visualizar").
 * O usuário precisa ter TODAS as permissões listadas (AND, não OR).
 * As chaves de permissão do usuário vêm embutidas no JWT no momento do login
 * (ver AuthService.buildTokenPayload) — se uma permissão for concedida/revogada
 * depois, ela só reflete no próximo login ou refresh de token. Essa é uma
 * decisão consciente de trade-off (evita consultar o banco a cada request só
 * para checar permissão); se no futuro isso for um problema, dá para trocar
 * por uma consulta com cache curto (Redis) sem mudar a assinatura do guard.
 */
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
