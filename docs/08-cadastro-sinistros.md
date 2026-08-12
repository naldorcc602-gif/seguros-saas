# Fase 8 — Cadastro e Gerenciamento de Sinistros

## O que foi implementado

**Cadastros auxiliares** (`apps/api/src/modules/registries` + `apps/web` Cadastros):
- 7 entidades: Seguradoras, Corretores, Clientes, Peritos, Oficinas, Despachantes, Advogados.
- Backend: um `RegistryCrudRepository` genérico (parametrizado pelo nome do modelo Prisma) em vez de 7 repositórios quase idênticos; um `RegistriesController` com as rotas `/registries/:entidade`.
- Frontend: uma `RegistryTable` + `RegistryFormModal` genéricas, guiadas por uma configuração declarativa de campos por entidade (`registry-field-config.ts`) — página única com abas em vez de 7 páginas quase idênticas.
- Remoção de um cadastro em uso por um sinistro retorna 409 com mensagem clara, em vez de vazar um erro 500 de violação de chave estrangeira.

**Sinistros — cadastro completo** (`apps/api/src/modules/claims` estendido + `apps/web`):
- `POST /claims/full` — criação com todos os campos do escopo original (segurado, apólice, veículo, ocorrência, terceiros).
- `GET /claims` — listagem paginada com filtros (etapa, prioridade, seguradora, corretor, busca textual).
- `GET /claims/:id` — detalhe completo (segurado, apólice, veículo, terceiros, comentários, timeline).
- `PATCH /claims/:id` — edição dos campos do próprio sinistro.
- `POST /claims/:id/comments` — comentários.
- Frontend: página de listagem com filtros e paginação, formulário completo de abertura (com array dinâmico de terceiros via `useFieldArray`), tela de detalhe com abas (Dados/Terceiros/Comentários/Timeline/Documentos) e edição inline.

## Decisões e trade-offs

1. **Edição do sinistro não inclui os dados do segurado.** `UpdateClaimDto`/`updateClaimSchema` excluem nome/documento/contato do cliente de propósito — esses dados agora têm um lar próprio em Cadastros &gt; Clientes (que só existe a partir desta fase). Evita duas telas diferentes editando a mesma entidade com regras de validação potencialmente divergentes.
2. **Cliente é reaproveitado pelo documento, não sempre recriado.** Diferente do `quickCreate` do Kanban (Fase 7), que sempre criava um novo `Client`, o `create()` completo agora busca por documento existente no tenant e atualiza os dados de contato se já existir — evita duplicar o mesmo segurado a cada novo sinistro dele.
3. **Terceiros só são criados junto com o sinistro, ainda não editáveis depois.** Adicionar/remover terceiros de um sinistro já aberto ficaria melhor como sua própria sub-rota (`POST/DELETE /claims/:id/third-parties`) — decidi não abrir esse escopo nesta fase; a tela de detalhe já mostra os terceiros (somente leitura) para não esconder informação já capturada.
4. **`assignedUserId` (responsável) existe no backend mas não tem seletor na UI ainda.** Não existe um endpoint de listagem de usuários do tenant; adicionar um seletor de responsável exigiria isso primeiro. Fica como um gap pequeno e explícito, não escondido.
5. **Reconciliação de schema em andamento.** Uma parte do trabalho desta fase (DTOs de criação/atualização, boa parte do repositório e do mapper) tinha sido implementada em uma execução anterior desta mesma tarefa, com um formato de "detalhe do sinistro" diferente do que eu havia especificado no `packages/schemas`. Resolvi a divergência realinhando o schema Zod compartilhado para bater com o mapper já escrito (estrutura aninhada por relação — `client: {...}`, `insurer: {id,name}` — em vez de campos achatados), e completei o que faltava (criação de terceiros na transação, inclusão de comentários no detalhe, o método `addComment`).
6. **Evento de WebSocket dedicado para edições gerais.** A Fase 7 só tinha `claim.stage_changed`; como agora um `PATCH /claims/:id` pode alterar qualquer campo (não só a etapa), criei um evento `claim.updated` separado para não confundir o front-end com uma mudança de etapa que não aconteceu.

## Validação neste ambiente

Rodei `tsc --noEmit --noResolve` em todos os arquivos novos/alterados desta fase (backend: módulos `claims` e `registries`; frontend: Cadastros e Sinistros) — sem erros de sintaxe. Sem Postgres disponível aqui para testar de ponta a ponta (criar um sinistro completo, editar, comentar, remover um cadastro em uso). Recomendo esse teste manual assim que `docker compose up` rodar no seu ambiente.

## Próxima fase

**Fase 9 — Upload de documentos e geração de links seguros**: pasta de documentos por sinistro, aceite dos formatos do escopo (PDF, imagens, vídeos, DOCX/XLSX/ZIP), checklist inteligente por tipo de produto, e o portal público de upload para o cliente (sem login, com registro de IP/geolocalização).
