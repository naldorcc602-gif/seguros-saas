import { BadRequestException, NotFoundException } from '@nestjs/common';

export class ClaimNotFoundError extends NotFoundException {
  constructor() {
    super('Sinistro não encontrado.');
  }
}

export class InvalidStageTransitionError extends BadRequestException {
  constructor(from: string, to: string) {
    super(`Não é possível mover o sinistro de "${from}" para "${to}" diretamente.`);
  }
}
