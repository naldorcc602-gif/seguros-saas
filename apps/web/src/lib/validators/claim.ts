import { z } from 'zod';

export const quickCreateFormSchema = z.object({
  clientName: z.string().min(2, 'Informe o nome do segurado.'),
  clientDocumentType: z.enum(['CPF', 'CNPJ']),
  clientDocument: z.string().min(5, 'Informe um CPF/CNPJ válido.'),
  productType: z.enum([
    'AUTO',
    'CARGO',
    'LIFE',
    'RESIDENTIAL',
    'BUSINESS',
    'TRANSPORT',
    'RC',
    'RCTRC',
    'RCDC',
    'RCV',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  estimatedValue: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
});
export type QuickCreateFormValues = z.infer<typeof quickCreateFormSchema>;

export const PRODUCT_TYPE_LABELS: Record<QuickCreateFormValues['productType'], string> = {
  AUTO: 'Automóvel',
  CARGO: 'Carga',
  LIFE: 'Vida',
  RESIDENTIAL: 'Residencial',
  BUSINESS: 'Empresarial',
  TRANSPORT: 'Transportes',
  RC: 'RC',
  RCTRC: 'RCTR-C',
  RCDC: 'RC-DC',
  RCV: 'RC-V',
};
