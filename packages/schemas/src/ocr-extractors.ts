// @ts-nocheck
import type { OcrFieldKey } from './ocr-ai.schema';

/**
 * Extração por regex sobre o texto reconhecido pelo OCR. Não é infalível —
 * texto de OCR é ruidoso (erros de leitura de caractere, quebras de linha
 * estranhas) — por isso cada função retorna TODAS as ocorrências plausíveis
 * encontradas, e a tela de revisão (Fase 11) deixa o regulador escolher o
 * que aplicar ao cadastro, em vez de preencher automaticamente sem revisão.
 */

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function extractCpf(text: string): string[] {
  const matches = text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g) ?? [];
  return unique(matches.map((m) => m.replace(/\D/g, '')).filter((d) => d.length === 11));
}

export function extractCnpj(text: string): string[] {
  const matches = text.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g) ?? [];
  return unique(matches.map((m) => m.replace(/\D/g, '')).filter((d) => d.length === 14));
}

/** Placa Mercosul (LLLNLNN) ou padrão antigo (LLLNNNN). */
export function extractPlate(text: string): string[] {
  const matches = text.match(/\b[A-Z]{3}[- ]?\d[A-Z0-9]\d{2}\b/gi) ?? [];
  return unique(matches.map((m) => m.replace(/[- ]/g, '').toUpperCase()));
}

export function extractRenavam(text: string): string[] {
  // RENAVAM tem 9 a 11 dígitos; para reduzir falsos positivos, exige a
  // palavra "RENAVAM" nas proximidades (até 40 caracteres antes do número).
  const matches = text.match(/RENAVAM[\s:.\-]{0,10}(\d{9,11})/gi) ?? [];
  return unique(matches.map((m) => m.replace(/\D/g, '').replace(/^0+/, '')).filter(Boolean));
}

export function extractChassis(text: string): string[] {
  // Chassi (VIN) tem 17 caracteres alfanuméricos, sem I/O/Q.
  const matches = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/g) ?? [];
  return unique(matches.map((m) => m.toUpperCase()));
}

/** Datas em formato brasileiro (DD/MM/AAAA ou DD-MM-AAAA). */
export function extractDates(text: string): string[] {
  const matches = text.match(/\b\d{2}[/\-]\d{2}[/\-]\d{4}\b/g) ?? [];
  return unique(matches);
}

/** Heurística simples para "Nome": linha em maiúsculas com 2+ palavras, sem dígitos — comum em CNH/CRLV. */
export function guessNames(text: string): string[] {
  const lines = text.split('\n').map((l) => l.trim());
  const candidates = lines.filter((line) => {
    if (line.length < 6 || line.length > 60) return false;
    if (/\d/.test(line)) return false;
    if (line !== line.toUpperCase()) return false;
    return line.split(/\s+/).length >= 2;
  });
  return unique(candidates).slice(0, 3); // no máximo 3 candidatos, para não poluir a revisão
}

export function extractAllFields(text: string): Partial<Record<OcrFieldKey, string[]>> {
  const fields: Partial<Record<OcrFieldKey, string[]>> = {};
  const cpf = extractCpf(text);
  const cnpj = extractCnpj(text);
  const name = guessNames(text);
  const renavam = extractRenavam(text);
  const chassis = extractChassis(text);
  const plate = extractPlate(text);
  const dates = extractDates(text);

  if (cpf.length) fields.cpf = cpf;
  if (cnpj.length) fields.cnpj = cnpj;
  if (name.length) fields.name = name;
  if (renavam.length) fields.renavam = renavam;
  if (chassis.length) fields.chassis = chassis;
  if (plate.length) fields.plate = plate;
  if (dates.length) fields.dates = dates;

  return fields;
}

