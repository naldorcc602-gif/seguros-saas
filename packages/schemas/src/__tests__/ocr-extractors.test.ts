// @ts-nocheck
import {
  extractAllFields,
  extractChassis,
  extractCnpj,
  extractCpf,
  extractDates,
  extractPlate,
  extractRenavam,
  guessNames,
} from '../ocr-extractors';

describe('extractCpf', () => {
  it('reconhece CPF formatado com pontos e traço', () => {
    expect(extractCpf('Nome: João\nCPF: 123.456.789-01')).toEqual(['12345678901']);
  });

  it('reconhece CPF sem formatação', () => {
    expect(extractCpf('12345678901')).toEqual(['12345678901']);
  });

  it('não reconhece um número de 10 dígitos como CPF', () => {
    expect(extractCpf('1234567890')).toEqual([]);
  });

  it('remove duplicatas', () => {
    expect(extractCpf('123.456.789-01 e também 12345678901')).toEqual(['12345678901']);
  });

  it('retorna vazio quando não há CPF no texto', () => {
    expect(extractCpf('texto qualquer sem documento')).toEqual([]);
  });
});

describe('extractCnpj', () => {
  it('reconhece CNPJ formatado', () => {
    expect(extractCnpj('CNPJ: 12.345.678/0001-95')).toEqual(['12345678000195']);
  });

  it('não confunde CPF com CNPJ', () => {
    expect(extractCnpj('123.456.789-01')).toEqual([]);
  });
});

describe('extractPlate', () => {
  it('reconhece placa Mercosul (LLLNLNN)', () => {
    expect(extractPlate('Placa: ABC1D23')).toEqual(['ABC1D23']);
  });

  it('reconhece placa no padrão antigo (LLLNNNN)', () => {
    expect(extractPlate('placa ABC1234 do veículo')).toEqual(['ABC1234']);
  });

  it('normaliza para maiúsculas e remove hífen/espaço', () => {
    expect(extractPlate('abc-1234')).toEqual(['ABC1234']);
  });
});

describe('extractRenavam', () => {
  it('só reconhece números próximos à palavra RENAVAM', () => {
    expect(extractRenavam('RENAVAM: 123456789')).toEqual(['123456789']);
  });

  it('ignora um número de 9 dígitos qualquer sem a palavra RENAVAM por perto', () => {
    expect(extractRenavam('Documento 123456789 do veículo')).toEqual([]);
  });

  it('remove zeros à esquerda', () => {
    expect(extractRenavam('RENAVAM 000123456')).toEqual(['123456']);
  });
});

describe('extractChassis', () => {
  it('reconhece chassi de 17 caracteres (VIN)', () => {
    // VIN válido não usa I, O, Q
    expect(extractChassis('Chassi: 9BWZZZ377VT004251')).toEqual(['9BWZZZ377VT004251']);
  });

  it('ignora string de 17 caracteres com dígitos insuficientes de contexto', () => {
    expect(extractChassis('texto qualquer sem 17 caracteres válidos aqui')).toEqual([]);
  });
});

describe('extractDates', () => {
  it('reconhece datas no formato brasileiro DD/MM/AAAA', () => {
    expect(extractDates('Nascimento: 15/03/1990')).toEqual(['15/03/1990']);
  });

  it('reconhece múltiplas datas distintas', () => {
    expect(extractDates('De 01/01/2026 até 31/12/2026')).toEqual(['01/01/2026', '31/12/2026']);
  });
});

describe('guessNames', () => {
  it('reconhece uma linha em maiúsculas com 2+ palavras como candidato a nome', () => {
    expect(guessNames('CARTEIRA NACIONAL DE HABILITACAO\nJOAO DA SILVA SANTOS\nCPF 12345678901')).toContain(
      'JOAO DA SILVA SANTOS',
    );
  });

  it('ignora linhas com dígitos', () => {
    expect(guessNames('RG 12345678 SSP')).toEqual([]);
  });

  it('ignora linhas de uma palavra só', () => {
    expect(guessNames('BRASIL')).toEqual([]);
  });

  it('limita a no máximo 3 candidatos', () => {
    const text = ['NOME UM DOIS', 'NOME TRES QUATRO', 'NOME CINCO SEIS', 'NOME SETE OITO'].join('\n');
    expect(guessNames(text).length).toBeLessThanOrEqual(3);
  });
});

describe('extractAllFields', () => {
  it('combina todos os extratores e omite chaves sem resultado', () => {
    const text = 'CPF: 123.456.789-01\nPlaca: ABC1D23';
    const fields = extractAllFields(text);
    expect(fields.cpf).toEqual(['12345678901']);
    expect(fields.plate).toEqual(['ABC1D23']);
    expect(fields.cnpj).toBeUndefined();
    expect(fields.renavam).toBeUndefined();
  });

  it('retorna objeto vazio quando nada é reconhecido', () => {
    expect(extractAllFields('lorem ipsum dolor sit amet')).toEqual({});
  });
});

