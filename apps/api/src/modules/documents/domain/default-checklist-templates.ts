/**
 * Checklist padrão por tipo de produto — semeado automaticamente para todo
 * tenant novo (ver UsersRepository.createTenantAndAdmin), para que o
 * "checklist inteligente" (Fase 9) já funcione com dados sensatos desde o
 * primeiro sinistro, sem exigir configuração manual antes de qualquer uso.
 * O Administrador pode editar/remover itens depois via
 * `/checklist-templates` (a UI de gestão fica para uma evolução futura;
 * por ora a API já suporta criar/listar/remover).
 */
export const DEFAULT_CHECKLIST_TEMPLATES: Array<{
  productType: string;
  name: string;
  required: boolean;
  order: number;
}> = [
  // Auto
  { productType: 'AUTO', name: 'CNH do condutor', required: true, order: 0 },
  { productType: 'AUTO', name: 'CRLV do veículo', required: true, order: 1 },
  { productType: 'AUTO', name: 'Boletim de ocorrência', required: false, order: 2 },
  { productType: 'AUTO', name: 'Fotos do veículo', required: true, order: 3 },
  { productType: 'AUTO', name: 'Orçamento ou nota fiscal', required: false, order: 4 },

  // Carga
  { productType: 'CARGO', name: 'Nota fiscal da carga', required: true, order: 0 },
  { productType: 'CARGO', name: 'CT-e (conhecimento de transporte)', required: true, order: 1 },
  { productType: 'CARGO', name: 'Boletim de ocorrência', required: false, order: 2 },
  { productType: 'CARGO', name: 'Fotos da carga/avaria', required: true, order: 3 },

  // Vida
  { productType: 'LIFE', name: 'Certidão de óbito', required: true, order: 0 },
  { productType: 'LIFE', name: 'Documento do beneficiário', required: true, order: 1 },
  { productType: 'LIFE', name: 'Laudo médico', required: false, order: 2 },

  // Residencial
  { productType: 'RESIDENTIAL', name: 'Boletim de ocorrência', required: false, order: 0 },
  { productType: 'RESIDENTIAL', name: 'Fotos do imóvel', required: true, order: 1 },
  { productType: 'RESIDENTIAL', name: 'Orçamento de reparo', required: false, order: 2 },

  // Empresarial
  { productType: 'BUSINESS', name: 'Boletim de ocorrência', required: false, order: 0 },
  { productType: 'BUSINESS', name: 'Fotos do local', required: true, order: 1 },
  { productType: 'BUSINESS', name: 'Orçamento de reparo', required: false, order: 2 },
  { productType: 'BUSINESS', name: 'Contrato social', required: false, order: 3 },

  // Transportes
  { productType: 'TRANSPORT', name: 'CT-e (conhecimento de transporte)', required: true, order: 0 },
  { productType: 'TRANSPORT', name: 'Manifesto de carga', required: false, order: 1 },
  { productType: 'TRANSPORT', name: 'Boletim de ocorrência', required: false, order: 2 },

  // RC, RCTR-C, RC-DC, RC-V
  { productType: 'RC', name: 'Boletim de ocorrência', required: true, order: 0 },
  { productType: 'RC', name: 'Laudo pericial', required: false, order: 1 },
  { productType: 'RCTRC', name: 'CT-e (conhecimento de transporte)', required: true, order: 0 },
  { productType: 'RCTRC', name: 'Boletim de ocorrência', required: true, order: 1 },
  { productType: 'RCDC', name: 'Boletim de ocorrência', required: true, order: 0 },
  { productType: 'RCDC', name: 'Laudo pericial', required: false, order: 1 },
  { productType: 'RCV', name: 'Boletim de ocorrência', required: true, order: 0 },
  { productType: 'RCV', name: 'CNH e CRLV do veículo envolvido', required: true, order: 1 },
];
