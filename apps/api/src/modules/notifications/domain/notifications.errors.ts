import { NotFoundException } from '@nestjs/common';

export class EmailTemplateNotFoundError extends NotFoundException {
  constructor() {
    super('Modelo de e-mail não encontrado.');
  }
}
