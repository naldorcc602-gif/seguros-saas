// @ts-nocheck
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionsGuard } from '../permissions.guard';

function mockContext(user: { role: string; permissions: string[] } | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let reflector: Reflector;
  let guard: PermissionsGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('permite acesso quando a rota não exige nenhuma permissão', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext({ role: 'ASSISTANT', permissions: [] }))).toBe(true);
  });

  it('ADMIN sempre passa, mesmo sem a permissão explicitamente concedida (superusuário do tenant)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['financial:view']);
    expect(guard.canActivate(mockContext({ role: 'ADMIN', permissions: [] }))).toBe(true);
  });

  it('permite acesso quando o usuário tem todas as permissões exigidas', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['financial:view', 'reports:view']);
    expect(
      guard.canActivate(mockContext({ role: 'ASSISTANT', permissions: ['financial:view', 'reports:view', 'other'] })),
    ).toBe(true);
  });

  it('bloqueia quando falta ao menos uma das permissões exigidas (AND, não OR)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['financial:view', 'reports:view']);
    expect(() =>
      guard.canActivate(mockContext({ role: 'ASSISTANT', permissions: ['financial:view'] })),
    ).toThrow(ForbiddenException);
  });

  it('bloqueia quando o usuário não tem nenhuma permissão', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['financial:view']);
    expect(() => guard.canActivate(mockContext({ role: 'ASSISTANT', permissions: [] }))).toThrow(ForbiddenException);
  });
});

