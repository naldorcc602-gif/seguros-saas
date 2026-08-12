// @ts-nocheck
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@seguros/database';

export const ROLES_KEY = 'roles';

/**
 * Restringe uma rota aos papéis informados. Combine com @RequirePermissions()
 * quando precisar de granularidade adicional além do papel (ex: um Assistente
 * específico com permissão extra liberada individualmente).
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

