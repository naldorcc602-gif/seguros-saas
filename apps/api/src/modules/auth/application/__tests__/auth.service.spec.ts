// @ts-nocheck
import { InvalidCredentialsError, InvalidOrExpiredRefreshTokenError, InvalidTwoFactorCodeError } from '../../domain/auth.errors';
import { AuthService } from '../auth.service';

function makeDeps() {
  const usersRepository = {
    findByEmailAcrossTenants: jest.fn(),
    findById: jest.fn(),
    getPermissionKeys: jest.fn().mockResolvedValue([]),
    updateLastLogin: jest.fn(),
    setTwoFactorSecret: jest.fn(),
    enableTwoFactor: jest.fn(),
    createTenantAndAdmin: jest.fn(),
    registerFailedLogin: jest.fn(),
    resetFailedLogins: jest.fn(),
  };
  const refreshTokenRepository = {
    create: jest.fn(),
    findValidByHash: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  };
  const passwordService = {
    hash: jest.fn(async (v: string) => `hashed:${v}`),
    compare: jest.fn(async (plain: string, hash: string) => hash === `hashed:${plain}`),
  };
  const tokenService = {
    issueTokenPair: jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: new Date(),
    }),
    hashRefreshToken: jest.fn((t: string) => `hash(${t})`),
    issueTwoFactorTempToken: jest.fn().mockResolvedValue('temp-token'),
    verifyTwoFactorTempToken: jest.fn(),
  };
  const twoFactorService = {
    generateSecret: jest.fn().mockReturnValue('SECRET'),
    generateQrCodeDataUrl: jest.fn().mockResolvedValue('data:image/png;base64,xxx'),
    verifyCode: jest.fn(),
  };

  const service = new AuthService(
    usersRepository as never,
    refreshTokenRepository as never,
    passwordService as never,
    tokenService as never,
    twoFactorService as never,
  );

  return { service, usersRepository, refreshTokenRepository, passwordService, tokenService, twoFactorService };
}

describe('AuthService.login', () => {
  it('lança InvalidCredentialsError quando o e-mail não existe', async () => {
    const { service, usersRepository } = makeDeps();
    usersRepository.findByEmailAcrossTenants.mockResolvedValue(null);

    await expect(service.login({ email: 'x@x.com', password: '123' })).rejects.toThrow(InvalidCredentialsError);
  });

  it('lança InvalidCredentialsError quando a senha não confere', async () => {
    const { service, usersRepository } = makeDeps();
    usersRepository.findByEmailAcrossTenants.mockResolvedValue({
      id: 'u1',
      passwordHash: 'hashed:correta',
      twoFactorEnabled: false,
    });

    await expect(service.login({ email: 'x@x.com', password: 'errada' })).rejects.toThrow(InvalidCredentialsError);
  });

  it('retorna tokens diretamente quando a senha confere e 2FA está desativado', async () => {
    const { service, usersRepository, refreshTokenRepository } = makeDeps();
    usersRepository.findByEmailAcrossTenants.mockResolvedValue({
      id: 'u1',
      tenantId: 't1',
      role: 'ADMIN',
      passwordHash: 'hashed:correta',
      twoFactorEnabled: false,
    });

    const result = await service.login({ email: 'x@x.com', password: 'correta' });

    expect(result.requiresTwoFactor).toBe(false);
    expect(result.accessToken).toBe('access-token');
    expect(refreshTokenRepository.create).toHaveBeenCalledWith('u1', 'hash(refresh-token)', expect.any(Date), undefined, undefined);
  });

  it('retorna tempToken (não os tokens finais) quando 2FA está ativado', async () => {
    const { service, usersRepository, tokenService } = makeDeps();
    usersRepository.findByEmailAcrossTenants.mockResolvedValue({
      id: 'u1',
      tenantId: 't1',
      role: 'ADMIN',
      passwordHash: 'hashed:correta',
      twoFactorEnabled: true,
    });

    const result = await service.login({ email: 'x@x.com', password: 'correta' });

    expect(result.requiresTwoFactor).toBe(true);
    expect(result.tempToken).toBe('temp-token');
    expect(result.accessToken).toBeUndefined();
    expect(tokenService.issueTwoFactorTempToken).toHaveBeenCalledWith('u1');
  });

  it('registra a tentativa falha quando a senha não confere', async () => {
    const { service, usersRepository } = makeDeps();
    usersRepository.findByEmailAcrossTenants.mockResolvedValue({
      id: 'u1',
      passwordHash: 'hashed:correta',
      twoFactorEnabled: false,
      lockedUntil: null,
    });

    await expect(service.login({ email: 'x@x.com', password: 'errada' })).rejects.toThrow(InvalidCredentialsError);
    expect(usersRepository.registerFailedLogin).toHaveBeenCalledWith('u1', 5, 15);
  });

  it('lança AccountLockedError quando a conta está bloqueada, mesmo com a senha certa', async () => {
    const { service, usersRepository } = makeDeps();
    usersRepository.findByEmailAcrossTenants.mockResolvedValue({
      id: 'u1',
      passwordHash: 'hashed:correta',
      twoFactorEnabled: false,
      lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
    });

    await expect(service.login({ email: 'x@x.com', password: 'correta' })).rejects.toMatchObject({
      status: 429,
    });
  });

  it('zera o contador de tentativas falhas em todo login bem-sucedido', async () => {
    const { service, usersRepository } = makeDeps();
    usersRepository.findByEmailAcrossTenants.mockResolvedValue({
      id: 'u1',
      tenantId: 't1',
      role: 'ADMIN',
      passwordHash: 'hashed:correta',
      twoFactorEnabled: false,
      lockedUntil: null,
    });

    await service.login({ email: 'x@x.com', password: 'correta' });

    expect(usersRepository.resetFailedLogins).toHaveBeenCalledWith('u1');
  });
});

describe('AuthService.verifyTwoFactorLogin', () => {
  it('lança InvalidTwoFactorCodeError quando o código não confere', async () => {
    const { service, usersRepository, tokenService, twoFactorService } = makeDeps();
    tokenService.verifyTwoFactorTempToken.mockResolvedValue({ sub: 'u1' });
    usersRepository.findById.mockResolvedValue({
      id: 'u1',
      twoFactorEnabled: true,
      twoFactorSecret: 'SECRET',
    });
    twoFactorService.verifyCode.mockReturnValue(false);

    await expect(service.verifyTwoFactorLogin('temp-token', '000000')).rejects.toThrow(InvalidTwoFactorCodeError);
  });

  it('emite os tokens finais quando o código confere', async () => {
    const { service, usersRepository, tokenService, twoFactorService } = makeDeps();
    tokenService.verifyTwoFactorTempToken.mockResolvedValue({ sub: 'u1' });
    usersRepository.findById.mockResolvedValue({
      id: 'u1',
      tenantId: 't1',
      role: 'ADMIN',
      twoFactorEnabled: true,
      twoFactorSecret: 'SECRET',
    });
    twoFactorService.verifyCode.mockReturnValue(true);

    const result = await service.verifyTwoFactorLogin('temp-token', '123456');

    expect(result.requiresTwoFactor).toBe(false);
    expect(result.accessToken).toBe('access-token');
  });
});

describe('AuthService.refresh', () => {
  it('lança InvalidOrExpiredRefreshTokenError quando o token não existe/expirou/já foi usado', async () => {
    const { service, refreshTokenRepository } = makeDeps();
    refreshTokenRepository.findValidByHash.mockResolvedValue(null);

    await expect(service.refresh('algum-token')).rejects.toThrow(InvalidOrExpiredRefreshTokenError);
  });

  it('revoga o refresh token usado mesmo em caso de sucesso (rotação)', async () => {
    const { service, refreshTokenRepository } = makeDeps();
    refreshTokenRepository.findValidByHash.mockResolvedValue({
      id: 'rt1',
      user: { id: 'u1', tenantId: 't1', role: 'ADMIN' },
    });

    await service.refresh('algum-token');

    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('rt1');
  });
});

