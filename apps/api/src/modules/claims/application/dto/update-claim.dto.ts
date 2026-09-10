import { PartialType, OmitType } from '@nestjs/swagger';

import { CreateClaimDto } from './create-claim.dto';

/**
 * Atualização de um sinistro já criado. Os dados do cliente (nome/documento)
 * ficam de fora de propósito: alterar o "dono" do sinistro é uma operação
 * diferente (transferência), fora do escopo desta fase — se necessário, um
 * endpoint dedicado pode ser adicionado depois sem quebrar este.
 */
export class UpdateClaimDto extends PartialType(
  OmitType(CreateClaimDto, [
    'clientName',
    'clientDocumentType',
    'clientDocument',
    'clientPhone',
    'clientWhatsapp',
    'clientEmail',
    'clientAddress',
    'clientCity',
    'clientState',
    'clientZipCode',
    'thirdParties',
  ] as const),
) {}
