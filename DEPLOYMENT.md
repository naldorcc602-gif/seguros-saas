# Deploy — seguros-saas

O sistema **completo** (API Nest + Web Next.js + Workers + Postgres + Redis) roda
em **duas topologias possíveis**:

| Componente | Opção A — VPS Docker (recomendada) | Opção B — Vercel + serviços gerenciados |
|---|---|---|
| Web (Next.js) | Container `web` + Nginx | **Vercel** |
| API (Nest, WS, filas) | Container `api` | Container em provedor sempre-ligado (Railway, Render, Fly, VPS) |
| Workers (email/OCR) | Container `workers` | Container persistente no mesmo host da API |
| Postgres | Container `postgres` | Neon, Supabase, RDS |
| Redis (Bull + refresh tokens) | Container `redis` | Upstash, Redis Cloud |

> A Vercel **sozinha não hospeda o sistema inteiro**: a API é um servidor de
> longa duração (WebSocket/Socket.IO + BullMQ + workers), o que não cabe em
> funções serverless. Use a Vercel (se quiser) **só para o web**.

---

## Pré-requisitos (ambas as opções)

1. Repo git do `seguros-saas` criado (`git init -b main`) e subido para um
   remote (GitHub/GitLab):
   ```bash
   git remote add origin git@github.com:SEU-USUARIO/seguros-saas.git
   git add -A && git commit -m "chore: estado inicial deploy-ready"
   git push -u origin main
   ```
2. Definir as variáveis em `Settings → Environment Variables` da plataforma.
   Segredos (JWT, DATABASE_URL, SMTP, STORAGE): gerar **novos e únicos**:
   `openssl rand -base64 48`.
3. Referência dos nomes: `.env.example` (dev), `.env.homologacao.example`
   (staging), `.env.producao.example` (prod).

---

## Opção A — VPS com Docker (infra completa já no repo)

Stack já pronta em `docker-compose.yml` + `infra/`:

```
infra/docker/        api/web/workers.Dockerfile (multi-stage)
infra/nginx/         conf.d + certbot + template SSL (HTTPS + WebSocket)
infra/scripts/       deploy.sh, migrate.sh, backup.sh, smoke-test.sh, init-ssl.sh
```

### Passos

```bash
# 1. Em qualquer máquina com o repo clonado, copiar o env correto
cp .env.producao.example .env        # e preencher os segredos

# 2. Subir o stack
./infra/scripts/deploy.sh producao
#   => docker compose build/up, espera postgres/redis/api saudáveis,
#      roda `prisma migrate deploy` e o smoke test
```

- O `deploy.sh` faz `git pull origin main` **na branch `main`** — faça o push
  para `main` para publicar.
- Migrations: `docker compose exec -T api npx prisma migrate deploy --schema=./prisma/schema.prisma`
- HTTPS: `docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d SEU_DOMINIO`
  e depois `./infra/scripts/init-ssl.sh` (gera `production-ssl.conf.template` → `default.conf`).
- Backup: `./infra/scripts/install-backup-cron.sh` instala o cron do `backup.sh`.

### Env essencial (prod)

`DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/`JWT_2FA_TEMP_SECRET`,
`ANTHROPIC_API_KEY` ou `OPENAI_API_KEY` (conforme `AI_PROVIDER`), `STORAGE_*`, `SMTP_*`, `APP_BASE_URL=https://seudominio.com`,
`NEXT_PUBLIC_API_URL=https://seudominio.com/api`, `NODE_ENV=production`, `PORT=3001`.

### Verificação

`curl https://seudominio.com/health` → 200; abrir `/` e `/api/docs`; `./infra/scripts/smoke-test.sh`.

---

## Opção B — Vercel (só o web) + API/workers/DB gerenciados

### 1. Postgres + Redis gerenciados

- Postgres: Neon / Supabase. Rode as migrations da **máquina local** (ou CI),
  apontando `DATABASE_URL` para o host gerenciado:
  ```bash
  DATABASE_URL="postgresql://usuario:senha@host/seguros_saas?schema=public" \
    npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
  ```
  Se precisar de dados básicos: `npm run db:seed` (respeita o mesmo `DATABASE_URL`).
- Redis: Upstash (compatível com `redis://`). Use a porta TLS se o provedor
  exigir.

### 2. API + Workers em container (Railway / Render / Fly)

- Suba `api` (porta 3001, `node dist/main.js`) e `workers`
  (`tsx src/index.ts` ou o equivalente compilado) como **serviços
  persistentes** no mesmo host, com o deploy via `apps/api` e `apps/workers`.
- Suba o repositório navegando pelo host e apontando o dockerfile
  (`infra/docker/api.Dockerfile`, `infra/docker/workers.Dockerfile`), ou use
  `docker compose up -d api workers` num VPS sem o Nginx (expondo só a porta da API).
- `APP_BASE_URL` deve apontar para a **URL pública do web** (ex.: `https://meu-site.vercel.app`),
  pois é usada para os links de portal/e-mail (e CORS do Socket.IO).

### 3. Web na Vercel

- Importar o repo no dashboard da Vercel (New Project → import Git repo).
- **Root Directory: `apps/web`** (o `vercel.json` do repo já define);
  framework Next.js detectado; o `packageManager: npm@10.8.0` do root é
  respeitado automaticamente.
- Em `Settings → Environment Variables` (grupos Preview/Production):
  - `NEXT_PUBLIC_API_URL=https://omeu-host-api.exemplo/api` (ou a URL da API,
    com caminho certo do proxy; *inlined no build* — se mudar, redeploy).
- Build local equivalente ao da Vercel já validado:
  `npx -y npm@10.8.0 run build` → `6 successful, 6 total`.

> Sem o socket (Socket.IO) atrás de um mesmo domínio, em produção o browser
> pode bloquear o WebSocket por origem mista. Nesse caso, acesse o web por
> HTTPS e garanta que `NEXT_PUBLIC_API_URL` também seja HTTPS; para o WS usar
> o mesmo host, coloque um proxy `/realtime` (o template do nosso Nginx já
> cobre esse caso) ou um front no host da API.

### Env essencial (Vercel só p/ o web)

`NEXT_PUBLIC_API_URL` (build-time, obrigatório). Nada de JWT/database acessa o
browser — a Vercel **não** recebe `DATABASE_URL`/`REDIS_URL`/segredos.

---

## Checklist de prontidão

1. [ ] Repo `seguros-saas` no GitHub/`main` pushed
2. [ ] Postgres + Redis acessíveis (URLs TLS se aplicável)
3. [ ] `prisma migrate deploy` aplicado (não só `db push`)
4. [ ] Segredos JWT/SMTP/STORAGE/IA (ANTHROPIC ou OPENAI) **novos e únicos**
5. [ ] API recebe requests do web (CORS `APP_BASE_URL` correto)
6. [ ] Workers + filas funcionando (e-mail/OCR)
7. [ ] `curl <base>/health` → 200 e smoke test passando
8. [ ] HTTPS ativo (Vercel automático; VPS via certbot)