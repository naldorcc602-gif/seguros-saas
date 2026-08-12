# Sistema de Regulação e Gestão de Sinistros

Monorepo (Turborepo + npm workspaces) do sistema SaaS de regulação de sinistros.

> Este é o scaffold da **Fase 3** do roadmap. Instalação, execução com Docker e as
> demais funcionalidades (auth, dashboard, kanban, etc.) chegam nas próximas fases —
> ver `ROADMAP.md`.

## Estrutura

```
seguros-saas/
├── apps/
│   ├── web/          # Next.js 15 — UI autenticada + portal público de upload
│   ├── api/           # NestJS — regras de negócio, RBAC, REST API
│   └── workers/       # Processadores assíncronos (OCR, IA, e-mail, WhatsApp, webhooks)
├── packages/
│   ├── schemas/       # Schemas Zod compartilhados entre web e api
│   ├── database/      # Prisma schema + client único (evita múltiplas instâncias)
│   ├── ui/             # Design system compartilhado (base shadcn/ui)
│   └── config/         # tsconfig e eslint-preset compartilhados
├── infra/
│   ├── docker/         # Dockerfiles (Fase 4)
│   ├── nginx/          # Configuração de proxy reverso e SSL (Fase 4/16)
│   └── scripts/        # Scripts de backup, deploy, seed
├── docker-compose.yml  # Orquestração local (Fase 4)
├── turbo.json          # Pipeline de build/dev/test/lint
└── .env.example        # Todas as variáveis de ambiente já previstas no escopo
```

### `apps/api/src/modules/*`

Cada bounded context (`claims`, `documents`, `notifications`, `ocr-ai`, `auth`,
`financial`, `reports`, `audit`) segue Clean Architecture:

```
modules/<contexto>/
├── domain/           # Entidades, Value Objects, regras de negócio puras
├── application/      # Casos de uso (Commands/Queries — CQRS)
├── infrastructure/   # Repositórios Prisma, adapters externos
└── presentation/     # Controllers REST, DTOs
```

As pastas existem desde já (com `.gitkeep`) para que a arquitetura da Fase 1 seja
visível no repositório; o conteúdo de cada módulo é implementado na fase do
roadmap correspondente.

## Como rodar

### Opção A — Docker (recomendado, ambiente completo)

```bash
cp .env.example .env
# edite .env: defina POSTGRES_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# Desenvolvimento (hot-reload, portas 3000/3001 expostas diretamente):
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Homologação/produção (via Nginx na porta 80, imagens otimizadas):
docker compose up --build -d
```

Depois de o container `postgres` estar de pé, aplique as migrations:

```bash
./infra/scripts/migrate.sh dev      # ambiente de desenvolvimento
./infra/scripts/migrate.sh deploy   # homologação/produção
```

Endpoints locais:
- Web: http://localhost:3000 (dev) ou http://localhost (via Nginx)
- API: http://localhost:3001 (dev) ou http://localhost/api (via Nginx)
- Swagger: http://localhost:3001/docs (dev) ou http://localhost/docs (via Nginx)

Primeiro acesso: crie um tenant + usuário Administrador via
`POST /auth/register-tenant` (Swagger ou curl) e depois faça login em
http://localhost:3000/login.

Backup manual do banco: `./infra/scripts/backup.sh` (ou agende automaticamente com `./infra/scripts/install-backup-cron.sh`).

Deploy em homologação/produção num servidor real (fora deste ambiente de desenvolvimento local): `./infra/scripts/deploy.sh homologacao` (ou `producao`) — ver o passo a passo completo em `docs/15-deploy-homologacao.md` e `docs/16-deploy-producao.md`. Antes do primeiro deploy real, confira o `docs/PRODUCTION-CHECKLIST.md`.

### Opção B — Node local, sem Docker

```bash
cp .env.example .env    # ajuste DATABASE_URL para localhost e configure um Postgres/Redis locais
npm install
npm run db:generate     # gera o Prisma Client a partir de packages/database
npm run dev              # sobe web (3000), api (3001) e workers via turbo
```

> **Nota sobre validação neste ambiente de geração**: o Docker não está disponível no sandbox
> usado para montar este projeto, então os `Dockerfile`s e o `docker-compose.yml` foram revisados
> manualmente e o YAML foi validado sintaticamente, mas não foi possível rodar `docker compose build`
> de fato. Rode `docker compose config` e `docker compose up --build` no seu ambiente para confirmar.

> **Migration pendente**: a Fase 16 adicionou dois campos ao model `User` (`failedLoginAttempts`,
> `lockedUntil`, para o bloqueio de conta) depois que o schema original foi desenhado na Fase 2 —
> rode `npx prisma migrate dev` (ambiente local) ou `npx prisma migrate deploy` (homologação/produção)
> antes do primeiro deploy para aplicar essa mudança.

## Documentação por fase

Cada fase do roadmap tem um documento em `docs/` explicando o que foi implementado e as decisões
tomadas (inclusive correções de bugs encontrados durante a implementação de fases posteriores):

| Fase | Documento |
|---|---|
| 5 — Autenticação e permissões | `docs/05-autenticacao-e-permissoes.md` |
| 6 — Dashboard | `docs/06-dashboard.md` |
| 7 — Kanban | `docs/07-kanban.md` |
| 8 — Cadastro de sinistros | `docs/08-cadastro-sinistros.md` |
| 9 — Documentos e portal | `docs/09-documentos-portal.md` |
| 10 — Notificações e e-mail | `docs/10-notificacoes-email.md` |
| 11 — OCR e IA | `docs/11-ocr-ia.md` |
| 12 — Relatórios | `docs/12-relatorios.md` |
| 13 — Swagger | `docs/13-swagger.md` |
| 14 — Testes automatizados | `docs/14-testes.md` |
| 15 — Deploy em homologação | `docs/15-deploy-homologacao.md` |
| 16 — Deploy em produção | `docs/16-deploy-producao.md` |
| — Checklist de produção | `docs/PRODUCTION-CHECKLIST.md` |

(Fases 1-4 — arquitetura, banco de dados, estrutura de pastas e ambiente Docker — não geraram
documento próprio; suas decisões estão registradas neste README e nos comentários do código.)

## Roadmap

Ver `ROADMAP.md` para a lista completa das 16 fases e o status de cada uma — todas concluídas.
