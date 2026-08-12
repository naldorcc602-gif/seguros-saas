# Fase 10 — Notificações por E-mail

## O que foi implementado

**Refatoração de arquitetura (necessária antes de tudo):**
- O gateway WebSocket, que vivia dentro do `ClaimsModule` desde a Fase 7, foi extraído para `shared/realtime` (`RealtimeModule`/`RealtimeGateway`). Motivo: `NotificationsModule` precisa do gateway para avisar o sino de notificações em tempo real, e ao mesmo tempo precisa ser importado POR `ClaimsModule`/`DocumentsModule` (para eles dispararem notificações) — se o gateway continuasse dentro de `ClaimsModule`, teríamos um ciclo `Claims → Notifications → Claims`. Com o gateway em um módulo neutro, `Claims`, `Documents` e `Notifications` importam `RealtimeModule` sem depender uns dos outros.
- `RealtimeGateway` ganhou `emitToUser(userId, ...)` além do `broadcastToTenant` já existente — cada socket agora entra também numa sala pessoal (`user:<id>`), usada só pelo sino de notificações.

**Backend** (`apps/api/src/modules/notifications`, novo módulo):
- Notificações in-app (tabela `Notification`, já existia desde a Fase 2): `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.
- Fila de e-mail via BullMQ (`email-queue`) — a API só enfileira, nunca envia e-mail diretamente.
- `NotificationsService` dispara automaticamente para os eventos do escopo original: novo sinistro, mudança de etapa (incluindo os casos especiais de pagamento/negativa/encerramento), documento enviado/aprovado/recusado/pendente, e SLA/prazo vencido (verificado por um cron diário).
- CRUD + preview dos 8 modelos de e-mail do escopo (`document_request`, `confirmation`, `pending`, `update`, `payment`, `denial`, `closure`, `satisfaction_survey`), com variáveis `{{variavel}}`.
- Templates padrão semeados automaticamente para todo tenant novo (mesmo padrão do checklist da Fase 9) — sem isso, todo tenant nasceria sem nenhum texto configurado.

**Worker de e-mail** (`apps/workers`):
- Consome a fila `email-queue`, busca o template pelo par `(tenantId, templateKey)`, renderiza as variáveis e envia via SMTP (nodemailer). Sem `SMTP_HOST` configurado, apenas loga no console — útil em desenvolvimento sem servidor SMTP de verdade.
- Registra cada e-mail enviado como uma `Communication` (canal EMAIL, direção OUTBOUND) vinculada ao sinistro — atende ao requisito "todos vinculados ao sinistro" do escopo original.

**Frontend**:
- Sino de notificações real no Topbar (contagem de não lidas, marcar como lida/todas, atualização em tempo real via WebSocket, link direto para o sinistro).
- Página de Configurações com editor de modelos de e-mail (assunto + corpo HTML) e preview ao vivo com dados de exemplo.

## Decisões e trade-offs

1. **Notificação in-app (sino) ≠ e-mail (template).** São públicos diferentes por natureza: o sino avisa a equipe interna (reguladores/gestores) que algo aconteceu; os 8 templates de e-mail são todos redigidos para o segurado ("Olá, {{clientName}}"). Documento enviado pelo cliente, por exemplo, gera sino para a equipe mas não e-mail — o próprio cliente já sabe que acabou de enviar.
2. **"Editor visual" foi implementado como editor de texto + preview ao vivo, não um WYSIWYG completo tipo Mailchimp.** Um editor drag-and-drop de blocos de e-mail é um projeto à parte (normalmente uma lib dedicada tipo GrapesJS ou MJML); dado o volume de outras fases ainda pendentes, o trade-off foi entregar algo imediatamente utilizável (edita o HTML, vê o preview renderizado com dados de exemplo, variáveis documentadas na tela) em vez de um WYSIWYG mais bonito mas que consumiria uma fatia desproporcional do tempo.
3. **SLA vencido notifica todo dia enquanto o sinistro seguir vencido**, sem guardar "já avisei essa vez" — decisão consciente de simplicidade, documentada no próprio scheduler. Se isso incomodar na prática (alguém reclamar de alerta repetido), a evolução é uma coluna `slaAlertSentAt` no `Claim`.
4. **A fila de e-mail nunca falha silenciosamente**: 3 tentativas com backoff exponencial, falhas ficam retidas por 24h (um "dead-letter informal") antes de serem limpas — dá tempo de investigar um problema de SMTP sem perder o rastro do que não foi enviado.
5. **O worker consulta o Prisma diretamente** (não reaproveita nenhum repositório da API) — os dois processos rodam em containers separados; a única coisa que os conecta é o Postgres e o Redis, nunca chamada direta de código entre eles.

## Validação neste ambiente

`tsc --noEmit --noResolve` rodado em 93 arquivos de backend+workers e 66 de frontend — sem erros de sintaxe (encontrei e corrigi um erro de sintaxe real no meio do caminho, numa edição anterior do `notification.schema.ts` que tinha perdido uma linha). Sem Redis/SMTP disponíveis neste sandbox para testar o envio de ponta a ponta; a recomendação é usar um serviço como Mailtrap ou Mailhog em desenvolvimento antes de apontar para um SMTP de produção de verdade.

## Próxima fase

**Fase 11 — OCR e IA**: extração automática de dados de documentos (CNH, CRLV, RENAVAM, boletins) preenchendo o campo `ocrExtractedData` já existente desde a Fase 2, e as funções de IA do escopo original (resumo do sinistro, identificação de documentos faltantes, geração de pareceres e e-mails, respostas a perguntas do regulador).
