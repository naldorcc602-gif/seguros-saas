// @ts-nocheck
import { BadRequestException, NotFoundException } from '@nestjs/common';

export class ClaimNotFoundForAiError extends NotFoundException {
  constructor() {
    super('Sinistro não encontrado.');
  }
}

export class MissingQuestionError extends BadRequestException {
  constructor() {
    super('Informe a pergunta que deseja fazer.');
  }
}

export class MissingEmailPurposeError extends BadRequestException {
  constructor() {
    super('Informe o propósito do e-mail a ser gerado.');
  }
}

