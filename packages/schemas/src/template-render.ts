/**
 * Substituição simples de variáveis `{{variavel}}` — usada tanto pelo preview
 * do editor de templates (API) quanto pelo envio real (worker), garantindo
 * que os dois produzam exatamente o mesmo resultado. Variáveis não
 * reconhecidas ficam como estão no texto (não quebram o template, só não
 * são substituídas) — ajuda a debugar um nome de variável digitado errado.
 */
export function renderTemplateString(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => variables[key] ?? match);
}
