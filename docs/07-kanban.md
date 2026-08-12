# Fase 7 — Pipeline Kanban

## O que foi implementado

**Backend** (`apps/api/src/modules/claims` — novo módulo, implementado parcialmente):
- `GET /claims/kanban` — lista todos os sinistros com os dados prontos para o cartão (segurado, seguradora, corretor, responsável, dias em aberto, prioridade, tags, valor, última atualização).
- `POST /claims` — criação rápida (nome + documento do segurado, tipo de produto, prioridade, valor estimado) para permitir abrir um sinistro direto do Kanban.
- `PATCH /claims/:id/stage` — move o sinistro entre colunas, com o `TimelineEvent` correspondente sempre registrado.
- Gateway WebSocket (`/realtime`, namespace com sala por tenant) — autentica com o mesmo access token JWT via `handshake.auth.token`, e emite `claim.created`/`claim.stage_changed` para todos os usuários do mesmo tenant.

**Frontend** (`apps/web`):
- `KanbanBoard` com `@dnd-kit` — 11 colunas (mesma ordem do enum `ClaimStage`), arrastar-e-soltar com atualização otimista.
- Busca instantânea (client-side) por número, segurado, seguradora ou corretor.
- `useRealtimeKanban` — mantém o quadro sincronizado entre usuários diferentes olhando o mesmo tenant ao mesmo tempo.
- Modal de criação rápida.

## Decisões e trade-offs

1. **Um Claims module mínimo nasceu nesta fase, não na Fase 8.** O Kanban não existe sem dados de sinistro para mostrar, então implementei aqui só o necessário (listar para o quadro, criar rápido, mudar etapa). O cadastro completo — todos os ~40 campos do escopo original (apólice, veículo, endereço, terceiros, fotos, etc.) — continua reservado para a Fase 8, que também vai trazer a tela de detalhe do sinistro, edição, e validações de negócio mais completas.
2. **Autenticação do WebSocket via `handshake.auth`, não query string.** Query strings de conexão costumam parar em logs de proxy/CDN; o token vai no campo de auth do handshake do Socket.IO, que não é logado por padrão.
3. **Isolamento de tenant no realtime é por sala (`tenant:<id>`), não por banco.** Descrevi isso com destaque no código do gateway: qualquer novo evento adicionado no futuro precisa emitir para a sala do tenant, nunca em broadcast global — senão um evento vazaria para outro tenant.
4. **`updateStage` usa `updateMany` em vez de `update`, de propósito.** Segui a mesma regra já documentada na Fase 5/6: operações de registro único (`update`/`findUnique`) não são filtradas automaticamente por tenant pela extensão do Prisma. Usar `updateMany` (que É filtrada) previne que alguém mova um sinistro de outro tenant adivinhando o `id`.
5. **Geração do número interno (`internalNumber`) por contagem, não por sequence dedicada.** Documentado como limitação conhecida no próprio repositório — sob altíssima concorrência de criação simultânea no mesmo tenant, pode colidir. Aceitável para o volume esperado agora; a evolução (sequence do Postgres por tenant) fica para o hardening pré-produção.
6. **Sem regra de transição de etapas ainda.** Qualquer coluna pode ir para qualquer coluna (como no Trello/Pipefy). Não impedi voltar de "Concluído"/"Negado" para uma etapa anterior — se isso for necessário (reabertura formal de sinistro com aprovação), fica para a Fase 8 como uma ação deliberada, não um simples drag-and-drop.

## Validação neste ambiente

Rodei `tsc --noEmit --noResolve` nos arquivos novos do backend (módulo `claims`) e do frontend (Kanban) — sem erros de sintaxe. Sem Docker/Postgres disponíveis aqui para testar o drag-and-drop e o WebSocket de ponta a ponta; recomendo testar localmente com dois navegadores abertos (ou uma aba anônima) logados no mesmo tenant para confirmar a atualização em tempo real.

## Próxima fase

**Fase 8 — Cadastro e gerenciamento de sinistros**: todos os campos do escopo original, tela de detalhe do sinistro (documentos, timeline, comentários), edição, e os cadastros auxiliares (seguradoras, corretores, peritos, oficinas) que o Kanban já referencia mas ainda não tem telas de gerenciamento.
