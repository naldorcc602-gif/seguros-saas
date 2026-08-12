// @ts-nocheck
import { BadRequestException, GoneException, NotFoundException } from '@nestjs/common';

export class DocumentNotFoundError extends NotFoundException {
  constructor() {
    super('Documento não encontrado.');
  }
}

export class ChecklistItemNotFoundError extends NotFoundException {
  constructor() {
    super('Item de checklist não encontrado.');
  }
}

export class InvalidUploadLinkError extends NotFoundException {
  constructor() {
    super('Link de upload inválido.');
  }
}

export class ExpiredUploadLinkError extends GoneException {
  constructor() {
    super('Este link de upload expirou. Peça ao regulador para gerar um novo.');
  }
}

export class ClaimNotFoundForUploadError extends BadRequestException {
  constructor() {
    super('Sinistro não encontrado para este upload.');
  }
}

