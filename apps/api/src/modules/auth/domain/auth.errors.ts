import { UnauthorizedException, ConflictException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';

export class InvalidCredentialsError extends UnauthorizedException {
  constructor() {
    super('E-mail ou senha inválidos.');
  }
}

export class AccountLockedError extends HttpException {
  constructor(retryAfterMinutes: number) {
    super(
      `Muitas tentativas de login falhas. Conta temporariamente bloqueada — tente novamente em ${retryAfterMinutes} minuto(s).`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class EmailAlreadyInUseError extends ConflictException {
  constructor() {
    super('Este e-mail já está em uso.');
  }
}

export class InvalidOrExpiredRefreshTokenError extends UnauthorizedException {
  constructor() {
    super('Sessão expirada. Faça login novamente.');
  }
}

export class InvalidTwoFactorCodeError extends BadRequestException {
  constructor() {
    super('Código de verificação inválido.');
  }
}

export class TwoFactorNotPendingError extends BadRequestException {
  constructor() {
    super('Nenhuma verificação em duas etapas pendente para este token.');
  }
}
