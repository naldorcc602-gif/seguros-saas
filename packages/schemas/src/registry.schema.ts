import { z } from 'zod';

const baseRegistrySchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Informe o nome.'),
});

export const insurerSchema = baseRegistrySchema.extend({
  document: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional().or(z.literal('')),
  contactPhone: z.string().nullable().optional(),
  active: z.boolean().optional(),
});
export type Insurer = z.infer<typeof insurerSchema>;

export const brokerSchema = insurerSchema;
export type Broker = z.infer<typeof brokerSchema>;

export const clientSchema = baseRegistrySchema.extend({
  documentType: z.enum(['CPF', 'CNPJ']),
  document: z.string().min(5, 'Informe um documento válido.'),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
});
export type Client = z.infer<typeof clientSchema>;

export const adjusterSchema = baseRegistrySchema.extend({
  document: z.string().nullable().optional(),
  specialty: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
});
export type Adjuster = z.infer<typeof adjusterSchema>;

export const workshopSchema = baseRegistrySchema.extend({
  document: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  address: z.string().nullable().optional(),
});
export type Workshop = z.infer<typeof workshopSchema>;

export const dispatcherSchema = baseRegistrySchema.extend({
  document: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
});
export type Dispatcher = z.infer<typeof dispatcherSchema>;

export const lawyerSchema = baseRegistrySchema.extend({
  oabNumber: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
});
export type Lawyer = z.infer<typeof lawyerSchema>;

/** Chaves usadas nas rotas /registries/:key e para identificar a aba no front-end. */
export const REGISTRY_KEYS = [
  'insurers',
  'brokers',
  'clients',
  'adjusters',
  'workshops',
  'dispatchers',
  'lawyers',
] as const;
export type RegistryKey = (typeof REGISTRY_KEYS)[number];

export const REGISTRY_LABELS: Record<RegistryKey, string> = {
  insurers: 'Seguradoras',
  brokers: 'Corretores',
  clients: 'Clientes',
  adjusters: 'Peritos',
  workshops: 'Oficinas',
  dispatchers: 'Despachantes',
  lawyers: 'Advogados',
};
