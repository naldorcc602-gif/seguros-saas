# Fase 15 — Deploy em Ambiente de Homologação

## O que foi implementado

- `infra/scripts/deploy.sh` — script de deploy idempotente (git pull → build → sobe postgres/redis → aguarda saudável → sobe o resto → migrations → smoke test). Compartilhado entre homologação e produção (recebe o ambiente como argumento), para não ter dois scripts quase iguais divergindo com o tempo.
- `infra/scripts/smoke-test.sh` — checagem rasa pós-deploy (health check, Swagger, rota pública/protegida respondendo com o status certo, front-end respondendo). Roda em segundos, não substitui os testes automatizados da Fase 14.
- `.env.homologacao.example` — variáveis específicas de homologação: banco e bucket **separados** de produção, SMTP apontando para um serviço de teste (Mailtrap/Mailhog) em vez do SMTP real (para não mandar e-mail de verdade para segurados durante testes).
- `.github/workflows/deploy-homologacao.yml` — deploy manual (`workflow_dispatch`, nunca automático a cada push) via SSH, usando um "Environment" do GitHub (`homologacao`) para guardar os secrets de acesso ao servidor.

## Guia passo a passo (primeira vez)

### 1. Provisionar o servidor

Um VPS Ubuntu 24.04 com pelo menos 2 vCPU / 4GB RAM (o OCR da Fase 11 é pesado de CPU). Instale Docker e Docker Compose:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# desloga e loga de novo para o grupo docker fazer efeito
```

### 2. DNS

Aponte um subdomínio (ex: `homolog.seudominio.com`) para o IP do servidor, tipo A.

### 3. Clonar o repositório

```bash
sudo mkdir -p /opt/seguros-saas && sudo chown $USER /opt/seguros-saas
git clone <url-do-seu-repositorio> /opt/seguros-saas
cd /opt/seguros-saas
```

### 4. Configurar o `.env`

```bash
cp .env.homologacao.example .env
# edite .env: gere os 3 segredos JWT (openssl rand -base64 48), preencha
# STORAGE_*, SMTP_* (serviço de teste) e ANTHROPIC_API_KEY
```

### 5. Ajustar o domínio no Nginx

Edite `infra/nginx/conf.d/default.conf`, trocando `server_name _;` por `server_name homolog.seudominio.com;` (o bloco SSL fica comentado até a Fase 16).

### 6. Primeiro deploy

```bash
chmod +x infra/scripts/*.sh
SMOKE_TEST_BASE_URL=http://localhost ./infra/scripts/deploy.sh homologacao
```

O script builda as imagens, sobe os serviços, roda as migrations e termina com o smoke test. Se tudo passar, a aplicação está de pé em `http://IP_DO_SERVIDOR` (SSL só na Fase 16).

### 7. Popular dados de teste

```bash
docker compose exec api npx prisma db seed --schema=./prisma/schema.prisma
```

Isso semeia as permissões granulares (Fase 5). Para ter um tenant de teste, use o Swagger (`/docs`) ou `curl` para chamar `POST /api/auth/register-tenant` com dados fictícios — nunca reaproveite um e-mail/CNPJ real de cliente em homologação.

### 8. Configurar o deploy contínuo (opcional)

No GitHub, crie um "Environment" chamado `homologacao` (Settings → Environments) com os secrets:
- `HOMOLOG_SSH_HOST`, `HOMOLOG_SSH_USER`, `HOMOLOG_SSH_PRIVATE_KEY` (uma chave SSH dedicada, só com acesso a este servidor)
- `HOMOLOG_BASE_URL` (ex: `https://homolog.seudominio.com`)

Depois disso, `Actions → Deploy — Homologação → Run workflow` dispara o deploy remotamente.

## Decisões e trade-offs

1. **Deploy manual (`workflow_dispatch`), nunca automático a cada push.** Mesmo em homologação, preferi exigir uma ação deliberada — evita que um push de WIP numa branch dispare um deploy sem querer. Trocar para automático (`on: push: branches: [staging]`) é uma mudança de poucas linhas se preferir esse fluxo.
2. **`deploy.sh` é compartilhado entre homologação e produção**, recebendo o ambiente como argumento, em vez de dois scripts quase idênticos — reduz o risco de um dos dois ficar desatualizado silenciosamente.
3. **Smoke test roda duas vezes no workflow de CI**: uma vez de dentro do próprio `deploy.sh` (contra `localhost`, garantindo que os containers sobem certo antes de considerar o deploy bem-sucedido) e uma vez de fora, do runner do GitHub Actions, contra o domínio público — a segunda checagem existe porque um deploy pode "funcionar" localmente no servidor mas ainda assim estar inacessível de fora (DNS não propagado, firewall bloqueando a porta, etc.).
4. **Homologação usa SMTP de teste, nunca o SMTP de produção.** Isso é mencionado com destaque no `.env.homologacao.example` — é fácil esquecer e, sem essa separação, um teste de "abrir sinistro" em homologação manda e-mail de verdade para o endereço que foi digitado no formulário de teste.
5. **Sem SSL ainda nesta fase** — o bloco HTTPS do Nginx já existe (desde a Fase 4) mas fica comentado até a Fase 16, porque emitir certificado via Let's Encrypt exige o domínio já resolvendo publicamente, o que só faz sentido confirmar depois que o primeiro deploy HTTP simples já validou que a aplicação sobe corretamente.

## Validação neste ambiente

Não há como provisionar um VPS real e testar o deploy de ponta a ponta neste sandbox. Revisei os scripts (`sh -n` para checagem de sintaxe do shell) e o YAML dos workflows (`python3 -c "import yaml..."`) — ambos válidos. A validação de verdade só acontece rodando `./infra/scripts/deploy.sh homologacao` no seu servidor.

## Próxima fase

**Fase 16 — Deploy em produção**: SSL via Let's Encrypt (ativar o bloco já preparado no Nginx), rate limiting, revisão de segurança final, backups automatizados agendados (o script já existe desde a Fase 4, falta o cron), e o checklist de produção.
