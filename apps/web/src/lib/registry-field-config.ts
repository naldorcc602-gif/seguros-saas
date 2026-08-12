import type { RegistryKey } from '@seguros/schemas';

export interface RegistryFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'select';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  /** Aparece como coluna na tabela? (nem todo campo do formulário precisa virar coluna) */
  column?: boolean;
}

/**
 * Um objeto de configuração por entidade em vez de 7 tabelas/formulários
 * quase idênticos — a tabela e o modal genéricos (RegistryTable/RegistryFormModal)
 * simplesmente iteram sobre esta config. Espelha a decisão equivalente do
 * backend (RegistryCrudRepository genérico).
 */
export const REGISTRY_FIELD_CONFIG: Record<RegistryKey, RegistryFieldConfig[]> = {
  insurers: [
    { key: 'name', label: 'Nome', type: 'text', required: true, column: true },
    { key: 'document', label: 'CNPJ', type: 'text', column: true },
    { key: 'contactEmail', label: 'E-mail de contato', type: 'email', column: true },
    { key: 'contactPhone', label: 'Telefone', type: 'text', column: true },
  ],
  brokers: [
    { key: 'name', label: 'Nome', type: 'text', required: true, column: true },
    { key: 'document', label: 'CNPJ', type: 'text', column: true },
    { key: 'contactEmail', label: 'E-mail de contato', type: 'email', column: true },
    { key: 'contactPhone', label: 'Telefone', type: 'text', column: true },
  ],
  clients: [
    { key: 'name', label: 'Nome', type: 'text', required: true, column: true },
    {
      key: 'documentType',
      label: 'Tipo de documento',
      type: 'select',
      required: true,
      options: [
        { value: 'CPF', label: 'CPF' },
        { value: 'CNPJ', label: 'CNPJ' },
      ],
    },
    { key: 'document', label: 'CPF/CNPJ', type: 'text', required: true, column: true },
    { key: 'phone', label: 'Telefone', type: 'text', column: true },
    { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
    { key: 'email', label: 'E-mail', type: 'email', column: true },
    { key: 'address', label: 'Endereço', type: 'text' },
    { key: 'city', label: 'Cidade', type: 'text', column: true },
    { key: 'state', label: 'Estado', type: 'text' },
    { key: 'zipCode', label: 'CEP', type: 'text' },
  ],
  adjusters: [
    { key: 'name', label: 'Nome', type: 'text', required: true, column: true },
    { key: 'document', label: 'Documento', type: 'text', column: true },
    { key: 'specialty', label: 'Especialidade', type: 'text', column: true },
    { key: 'phone', label: 'Telefone', type: 'text', column: true },
    { key: 'email', label: 'E-mail', type: 'email' },
  ],
  workshops: [
    { key: 'name', label: 'Nome', type: 'text', required: true, column: true },
    { key: 'document', label: 'CNPJ', type: 'text', column: true },
    { key: 'phone', label: 'Telefone', type: 'text', column: true },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'address', label: 'Endereço', type: 'text', column: true },
  ],
  dispatchers: [
    { key: 'name', label: 'Nome', type: 'text', required: true, column: true },
    { key: 'document', label: 'Documento', type: 'text', column: true },
    { key: 'phone', label: 'Telefone', type: 'text', column: true },
    { key: 'email', label: 'E-mail', type: 'email', column: true },
  ],
  lawyers: [
    { key: 'name', label: 'Nome', type: 'text', required: true, column: true },
    { key: 'oabNumber', label: 'OAB', type: 'text', column: true },
    { key: 'phone', label: 'Telefone', type: 'text', column: true },
    { key: 'email', label: 'E-mail', type: 'email', column: true },
  ],
};
