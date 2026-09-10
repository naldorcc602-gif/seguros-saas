import { renderTemplateString } from '../template-render';

describe('renderTemplateString', () => {
  it('substitui uma variável simples', () => {
    expect(renderTemplateString('Olá, {{clientName}}!', { clientName: 'Maria' })).toBe('Olá, Maria!');
  });

  it('substitui múltiplas ocorrências da mesma variável', () => {
    expect(renderTemplateString('{{a}} e {{a}}', { a: 'x' })).toBe('x e x');
  });

  it('tolera espaços dentro das chaves duplas', () => {
    expect(renderTemplateString('{{ clientName }}', { clientName: 'Maria' })).toBe('Maria');
  });

  it('mantém a variável original quando não há valor correspondente (não quebra o template)', () => {
    expect(renderTemplateString('Olá, {{unknownVar}}!', {})).toBe('Olá, {{unknownVar}}!');
  });

  it('substitui múltiplas variáveis diferentes no mesmo template', () => {
    const result = renderTemplateString('{{claimNumber}} — {{clientName}}', {
      claimNumber: '2026-000123',
      clientName: 'João',
    });
    expect(result).toBe('2026-000123 — João');
  });

  it('não altera texto sem nenhuma variável', () => {
    expect(renderTemplateString('texto simples sem variáveis', {})).toBe('texto simples sem variáveis');
  });
});
