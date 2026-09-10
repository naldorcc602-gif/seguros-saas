import { createClaimSchema } from '../claim-detail.schema';
import { quickCreateClaimSchema } from '../claim.schema';
import { clientSchema } from '../registry.schema';
import { CLAIM_STAGE_LABELS, claimStageEnum } from '../dashboard.schema';

describe('quickCreateClaimSchema', () => {
  const validInput = {
    clientName: 'Maria Souza',
    clientDocumentType: 'CPF',
    clientDocument: '12345678901',
    productType: 'AUTO',
  };

  it('aceita um payload mínimo válido e aplica o default de priority', () => {
    const result = quickCreateClaimSchema.parse(validInput);
    expect(result.priority).toBe('MEDIUM');
  });

  it('rejeita nome do segurado com menos de 2 caracteres', () => {
    expect(() => quickCreateClaimSchema.parse({ ...validInput, clientName: 'M' })).toThrow();
  });

  it('rejeita tipo de produto desconhecido', () => {
    expect(() => quickCreateClaimSchema.parse({ ...validInput, productType: 'INEXISTENTE' })).toThrow();
  });

  it('rejeita tipo de documento fora de CPF/CNPJ', () => {
    expect(() => quickCreateClaimSchema.parse({ ...validInput, clientDocumentType: 'RG' })).toThrow();
  });
});

describe('createClaimSchema (Fase 8)', () => {
  const base = {
    clientName: 'João Silva',
    clientDocumentType: 'CPF' as const,
    clientDocument: '12345678901',
    productType: 'AUTO' as const,
  };

  it('aplica default de thirdParties como array vazio quando omitido', () => {
    const result = createClaimSchema.parse(base);
    expect(result.thirdParties).toEqual([]);
  });

  it('aceita terceiros com campos opcionais omitidos', () => {
    const result = createClaimSchema.parse({ ...base, thirdParties: [{ name: 'Pedro' }] });
    expect(result.thirdParties[0].name).toBe('Pedro');
  });

  it('rejeita terceiro sem nome', () => {
    expect(() => createClaimSchema.parse({ ...base, thirdParties: [{ name: 'P' }] })).toThrow();
  });
});

describe('clientSchema', () => {
  it('rejeita documento com menos de 5 caracteres', () => {
    expect(() =>
      clientSchema.parse({ id: '1', name: 'Ana', documentType: 'CPF', document: '123' }),
    ).toThrow();
  });

  it('aceita e-mail vazio (campo opcional com string vazia permitida)', () => {
    const result = clientSchema.parse({
      id: '1',
      name: 'Ana Paula',
      documentType: 'CPF',
      document: '12345678901',
      email: '',
    });
    expect(result.email).toBe('');
  });
});

describe('CLAIM_STAGE_LABELS', () => {
  it('tem um rótulo em pt-BR para toda etapa do enum', () => {
    for (const stage of claimStageEnum.options) {
      expect(CLAIM_STAGE_LABELS[stage]).toBeDefined();
      expect(typeof CLAIM_STAGE_LABELS[stage]).toBe('string');
    }
  });
});
