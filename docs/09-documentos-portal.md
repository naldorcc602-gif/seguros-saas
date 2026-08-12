# Fase 9 — Upload de Documentos e Links Seguros

## O que foi implementado

**Armazenamento** (`apps/api/src/modules/documents`):
- `StorageService` abstrai S3 e Cloudflare R2 (ambos falam a API S3) — troca só `STORAGE_ENDPOINT`/`STORAGE_REGION` no `.env`, sem mudar código.
- Padrão de upload **sem multipart no NestJS**: o backend nunca recebe o arquivo em si.
  1. `POST /claims/:id/documents/presign` — gera uma URL pré-assinada de `PUT`.
  2. O navegador faz o upload **direto** para o S3/R2 usando essa URL.
  3. `POST /claims/:id/documents/confirm` — o cliente avisa a API que terminou, e só aí o metadado é gravado.
- Downloads também usam URL pré-assinada (`GET /documents/:id/download`) — o bucket nunca é público, mesmo os arquivos sendo sensíveis (CNH, boletim de ocorrência, laudos).
- Versionamento: reenviar um documento já existente (`POST /documents/:id/versions/*`) cria uma nova `DocumentVersion` em vez de sobrescrever — nada se perde, conforme o requisito original.

**Checklist inteligente**:
- Corrigido um gap real que encontrei ao revisar a Fase 8: a criação do sinistro **não estava** copiando os itens do `ChecklistTemplateItem` para o `ClaimChecklistItem` do sinistro — ou seja, o "checklist inteligente" existiria como conceito no banco mas nunca aconteceria na prática. Corrigido em `ClaimsRepository` (tanto na criação rápida do Kanban quanto na criação completa).
- Além disso, semeei um **checklist padrão por tipo de produto** (`DEFAULT_CHECKLIST_TEMPLATES`), aplicado automaticamente a todo tenant novo no momento do cadastro (`UsersRepository.createTenantAndAdmin`, Fase 5) — sem isso, todo tenant nasceria sem nenhum template configurado, e o checklist ficaria vazio até alguém popular manualmente via API.

**Portal público do cliente** (sem login):
- `GET /portal/:token` — valida o token e devolve os dados do sinistro + checklist pendente.
- `POST /portal/:token/documents/presign` e `/confirm` — mesmo fluxo de presigned URL, mas sem JWT: o próprio token aleatório de 24 bytes (com expiração opcional) é o controle de acesso.
- Registra IP e (com permissão do navegador) geolocalização de quem enviou.
- Página `/portal/[token]` no front-end — fora do layout autenticado (sidebar/topbar), com um cliente HTTP próprio (`portalFetch`) que nunca anexa Bearer token nem tenta refresh de sessão.

**Tempo real**: upload de documento (por regulador ou pelo portal do cliente) emite `document.uploaded` via WebSocket (mesmo gateway do Kanban), atualizando a lista de documentos/checklist de quem estiver com a tela do sinistro aberta.

## Decisões e correções que fiz

1. **`ClaimChecklistItem` não tem coluna `tenantId` própria** (herda o isolamento via `Claim.tenantId`) — por isso não está na lista de modelos interceptados pela extensão de multi-tenancy do Prisma. `updateChecklistItemStatus` valida a posse explicitamente via `join` com `Claim` antes de escrever, senão alguém de outro tenant que soubesse/adivinhasse um `itemId` poderia alterar o status de um checklist que não é seu.
2. **Upload nunca passa pela memória do servidor Node.** Arquivos de vídeo de vistoria podem ser grandes (limite de 200MB); URLs pré-assinadas evitam que isso vire um gargalo de memória/CPU da API sob muitos uploads simultâneos.
3. **Checklist do template é copiado, não referenciado** (decisão já registrada na Fase 2, reaproveitada aqui): se o Administrador mudar o template depois, sinistros já abertos mantêm o checklist que valia no momento da criação.
4. **Link de upload não expira por uso, só por tempo.** O campo `used` no banco existe mas não bloqueia reenvios — um mesmo link serve para o cliente enviar vários documentos ao longo de alguns dias, não é de uso único. Se isso precisar mudar (link de uso único), a validação fica em `DocumentsService.validateToken`, sem mudar o schema.
5. **OCR não está incluído nesta fase** — o escopo original pede extração automática de CNH/CRLV/RENAVAM etc., mas isso é o conteúdo específico da Fase 11 (OCR e IA). O campo `ocrExtractedData` (JSON) já existe no modelo `Document` desde a Fase 2, pronto para ser populado quando a Fase 11 chegar.

## Validação neste ambiente

`tsc --noEmit --noResolve` rodado em 51 arquivos de backend (`documents` + `auth` alterado + `claims` alterado + `schemas`) e 59 de frontend — sem erros de sintaxe. Não há como testar o upload de verdade sem um bucket S3/R2 real configurado; a recomendação é testar com um bucket de desenvolvimento (MinIO local via Docker é uma alternativa gratuita compatível com a API S3, se preferir não usar um bucket real ainda).

## Próxima fase

**Fase 10 — Notificações por e-mail**: os eventos já occurring (novo sinistro, documento enviado/aprovado/rejeitado, mudança de etapa, SLA vencendo) ganham disparo automático de e-mail, com os templates editáveis do escopo original.
