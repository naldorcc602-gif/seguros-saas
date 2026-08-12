// @ts-nocheck
/**
 * Templates de e-mail padrão — semeados automaticamente para todo tenant
 * novo (ver UsersRepository.createTenantAndAdmin), no mesmo espírito do
 * checklist padrão da Fase 9: o sistema já funciona com textos sensatos
 * desde o primeiro sinistro, sem exigir configuração manual antes de
 * qualquer uso. O Administrador pode editar cada um depois em
 * Configurações > Modelos de E-mail.
 */
export const DEFAULT_EMAIL_TEMPLATES: Array<{ key: string; subject: string; bodyHtml: string }> = [
  {
    key: 'document_request',
    subject: 'Documentos pendentes — Sinistro {{claimNumber}}',
    bodyHtml:
      '<p>Olá, {{clientName}}.</p>' +
      '<p>Para dar andamento ao seu sinistro <strong>{{claimNumber}}</strong>, precisamos que você envie os documentos pendentes.</p>' +
      '<p>Use o link seguro enviado separadamente para fazer o upload, sem necessidade de login.</p>',
  },
  {
    key: 'confirmation',
    subject: 'Sinistro {{claimNumber}} recebido com sucesso',
    bodyHtml:
      '<p>Olá, {{clientName}}.</p>' +
      '<p>Confirmamos a abertura do seu sinistro <strong>{{claimNumber}}</strong> ({{productLabel}}).</p>' +
      '<p>Acompanharemos e avisaremos a cada atualização.</p>',
  },
  {
    key: 'pending',
    subject: 'Pendência no sinistro {{claimNumber}}',
    bodyHtml:
      '<p>Olá, {{clientName}}.</p>' +
      '<p>Identificamos uma pendência no seu sinistro <strong>{{claimNumber}}</strong>, atualmente na etapa "{{stageLabel}}".</p>' +
      '<p>Nossa equipe entrará em contato com mais detalhes em breve.</p>',
  },
  {
    key: 'update',
    subject: 'Atualização no sinistro {{claimNumber}}',
    bodyHtml:
      '<p>Olá, {{clientName}}.</p>' +
      '<p>Seu sinistro <strong>{{claimNumber}}</strong> avançou para a etapa "{{stageLabel}}".</p>',
  },
  {
    key: 'payment',
    subject: 'Pagamento liberado — Sinistro {{claimNumber}}',
    bodyHtml:
      '<p>Olá, {{clientName}}.</p>' +
      '<p>O pagamento referente ao sinistro <strong>{{claimNumber}}</strong> foi liberado.</p>' +
      '<p>Valor estimado: {{estimatedValue}}.</p>',
  },
  {
    key: 'denial',
    subject: 'Sinistro {{claimNumber}} — Comunicado de negativa',
    bodyHtml:
      '<p>Olá, {{clientName}}.</p>' +
      '<p>Após análise, o sinistro <strong>{{claimNumber}}</strong> não pôde ser aprovado.</p>' +
      '<p>Entre em contato com seu corretor ou regulador para mais informações sobre os motivos e possíveis recursos.</p>',
  },
  {
    key: 'closure',
    subject: 'Sinistro {{claimNumber}} encerrado',
    bodyHtml:
      '<p>Olá, {{clientName}}.</p>' +
      '<p>Seu sinistro <strong>{{claimNumber}}</strong> foi encerrado.</p>' +
      '<p>Agradecemos a confiança em nossos serviços.</p>',
  },
  {
    key: 'satisfaction_survey',
    subject: 'Como foi sua experiência com o sinistro {{claimNumber}}?',
    bodyHtml:
      '<p>Olá, {{clientName}}.</p>' +
      '<p>Seu sinistro <strong>{{claimNumber}}</strong> foi concluído. Gostaríamos de saber sua opinião sobre o atendimento.</p>' +
      '<p>Sua resposta nos ajuda a melhorar continuamente.</p>',
  },
];

