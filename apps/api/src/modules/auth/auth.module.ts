// @ts-nocheck
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../shared/guards';
import { TenantContextInterceptor } from '../../shared/interceptors/tenant-context.interceptor';
import { AuthService } from './application/auth.service';
import { PasswordService } from './infrastructure/password.service';
import { RefreshTokenRepository } from './infrastructure/refresh-token.repository';
import { TokenService } from './infrastructure/token.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { TwoFactorService } from './infrastructure/two-factor.service';
import { UsersRepository } from './infrastructure/users.repository';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRATION') ?? '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    TwoFactorService,
    UsersRepository,
    RefreshTokenRepository,
    JwtStrategy,
    // Ordem importa: JwtAuthGuard roda primeiro (autentica), depois Roles e
    // Permissions (autorizam com base em request.user já populado).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    // Interceptor global: popula o AsyncLocalStorage consumido pelo Prisma
    // Client Extension (ver packages/database/src/prisma-tenant-extension.ts).
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
  exports: [AuthService],
})
export class AuthModule {}

