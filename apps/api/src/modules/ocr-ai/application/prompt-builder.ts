// @ts-nocheck
import { CLAIM_STAGE_LABELS, type ClaimStage } from '@seguros/schemas';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClaimContext = any; // formato vindo do AiContextRepository.getClaimContext — solto de propósito, ver nota no service

/**
 * Monta um resumo textual do sinistro (dados cadastrais, checklist,
 * comentários, timeline) reaproveitado por todos os prompts — cada função
 * de IA do escopo original só muda a INSTRUÇÃO (system prompt) sobre o que
 * fazer com esse mesmo contexto, não o contexto em si.
 */
function buildContextBlock(claim: ClaimContext): string {
  const lines: string[] = [];
  lines.push(`Sinistro: ${claim.internalNumber}`);
  lines.push(`Etapa atual: ${CLAIM_STAGE_LABELS[claim.stage as ClaimStage] ?? claim.stage}`);
  lines.push(`Prioridade: ${claim.priority}`);
  lines.push(`Tipo de produto: ${claim.productType}`);
  lines.push(`Segurado: ${claim.client?.name} (${claim.client?.documentType} ${claim.client?.document})`);
  if (claim.insurer?.name) lines.push(`Seguradora: ${claim.insurer.name}`);
  if (claim.broker?.name) lines.push(`Corretor: ${claim.broker.name}`);
  if (claim.assignedUser?.name) lines.push(`Regulador responsável: ${claim.assignedUser.name}`);
  if (claim.occurredAt) lines.push(`Data do sinistro: ${claim.occurredAt}`);
  if (claim.occurredLocation) lines.push(`Local: ${claim.occurredLocation}`);
  if (claim.description) lines.push(`Descrição: ${claim.description}`);
  if (claim.cause) lines.push(`Causa: ${claim.cause}`);
  if (claim.estimatedValue) lines.push(`Valor estimado: R$ ${claim.estimatedValue}`);
  if (claim.notes) lines.push(`Observações internas: ${claim.notes}`);

  if (claim.thirdParties?.length) {
    lines.push('\nTerceiros envolvidos:');
    for (const tp of claim.thirdParties) {
      lines.push(`- ${tp.name}${tp.vehiclePlate ? ` (placa ${tp.vehiclePlate})` : ''}${tp.description ? `: ${tp.description}` : ''}`);
    }
  }

  if (claim.checklistItems?.length) {
    lines.push('\nChecklist de documentos:');
    for (const item of claim.checklistItems) {
      const docCount = item.documents?.length ?? 0;
      lines.push(`- ${item.name} [${item.required ? 'obrigatório' : 'opcional'}] — status: ${item.status}, ${docCount} arquivo(s) anexado(s)`);
    }
  }

  if (claim.comments?.length) {
    lines.push('\nComentários da equipe:');
    for (const c of claim.comments) {
      lines.push(`- ${c.author?.name ?? 'Sistema'}: ${c.content}`);
    }
  }

  if (claim.timelineEvents?.length) {
    lines.push('\nHistórico de eventos (mais antigo primeiro):');
    for (const e of claim.timelineEvents) {
      lines.push(`- ${new Date(e.createdAt).toLocaleString('pt-BR')}: ${e.description}`);
    }
  }

  return lines.join('\n');
}

const BASE_SYSTEM_PROMPT =
  'Você é um assistente especializado em regulação de sinistros de seguros no Brasil, ajudando reguladores ' +
  'profissionais em seu trabalho do dia a dia. Seja objetivo, use linguagem técnica apropriada do setor ' +
  'de seguros, e nunca invente dados que não estejam no contexto fornecido — se faltar informação, diga isso ' +
  'explicitamente em vez de supor.';

export function buildSummaryPrompt(claim: ClaimContext) {
  return {
    system: BASE_SYSTEM_PROMPT,
    user: `Resuma o sinistro abaixo em um parágrafo curto (4-6 linhas), destacando o essencial para quem está assumindo o caso agora:\n\n${buildContextBlock(claim)}`,
  };
}

export function buildMissingDocumentsPrompt(claim: ClaimContext) {
  return {
    system: BASE_SYSTEM_PROMPT,
    user: `Com base no checklist de documentos abaixo, liste quais documentos obrigatórios ainda estão faltando (status diferente de "Aprovado" ou sem nenhum arquivo anexado). Se todos os obrigatórios já foram recebidos, diga isso claramente.\n\n${buildContextBlock(claim)}`,
  };
}

export function buildInconsistenciesPrompt(claim: ClaimContext) {
  return {
    system: BASE_SYSTEM_PROMPT,
    user: `Analise o sinistro abaixo e aponte possíveis inconsistências ou pontos de atenção (ex: datas que não batem, valores muito distantes do usual para o tipo de sinistro, informações contraditórias entre a descrição e os comentários). Se não encontrar nada suspeito, diga isso explicitamente — não invente problemas.\n\n${buildContextBlock(claim)}`,
  };
}

export function buildNextStepsPrompt(claim: ClaimContext) {
  return {
    system: BASE_SYSTEM_PROMPT,
    user: `Sugira os próximos passos práticos para avançar este sinistro, considerando a etapa atual e o que já foi feito. Liste em tópicos curtos, em ordem de prioridade.\n\n${buildContextBlock(claim)}`,
  };
}

export function buildEmailDraftPrompt(claim: ClaimContext, purpose: string) {
  return {
    system:
      BASE_SYSTEM_PROMPT +
      ' Ao gerar e-mails, escreva em português formal e cordial, adequado para enviar diretamente ao segurado.',
    user: `Redija um e-mail para o segurado com o seguinte propósito: "${purpose}".\n\nContexto do sinistro:\n${buildContextBlock(claim)}\n\nRetorne apenas o assunto (na primeira linha, prefixado com "Assunto:") e o corpo do e-mail.`,
  };
}

export function buildTechnicalOpinionPrompt(claim: ClaimContext) {
  return {
    system:
      BASE_SYSTEM_PROMPT +
      ' Um parecer técnico de regulação de sinistros normalmente cobre: resumo do ocorrido, documentação analisada, enquadramento na apólice/cobertura, e conclusão recomendada (aprovação, negativa ou pendência).',
    user: `Redija um parecer técnico preliminar para este sinistro, estruturado em seções curtas. Deixe claro que é uma minuta gerada por IA e precisa de revisão humana antes de ser usada oficialmente.\n\n${buildContextBlock(claim)}`,
  };
}

export function buildAskPrompt(claim: ClaimContext, question: string) {
  return {
    system: BASE_SYSTEM_PROMPT,
    user: `Responda à pergunta do regulador usando SOMENTE as informações do contexto abaixo. Se a resposta não estiver no contexto, diga que não há essa informação disponível no momento.\n\nPergunta: ${question}\n\nContexto do sinistro:\n${buildContextBlock(claim)}`,
  };
}

export function buildHistorySummaryPrompt(claim: ClaimContext) {
  return {
    system: BASE_SYSTEM_PROMPT,
    user: `Resuma a linha do tempo deste sinistro em ordem cronológica, em um parágrafo narrativo curto, sem listar cada evento individualmente — foque nos marcos importantes (abertura, mudanças de etapa, documentos-chave, decisões).\n\n${buildContextBlock(claim)}`,
  };
}

