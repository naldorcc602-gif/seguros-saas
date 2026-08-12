# Fase 16 — Deploy em Produção

## O que foi implementado

**Duas lacunas de segurança fechadas** (documentadas como gaps desde a Fase 5):

1. **Rate limiting** (`@nestjs/throttler`) — limite global de 100 req/min por IP, e um limite mais estrito de 10 req/min nos endpoints de autenticação (`/auth/login`, `/auth/2fa/login`, `/auth/register-tenant`), que são o alvo mais comum de força bruta/scraping.
2. **Bloqueio de conta após tentativas falhas** — 5 tentativas erradas seguidas bloqueiam a conta por 15 minutos (`AccountLockedError`, HTTP 429). Exigiu uma alteração real de schema (`User.failedLoginAttempts`, `User.lockedUntil`) — a primeira mudança de schema desde a Fase 2, então vai precisar de uma migration nova quando você rodar `prisma migrate dev` no seu ambiente.

**Outros itens de hardening**:
- **Helmet** — cabeçalhos de segurança padrão na API (CSP desativada de propósito: a API não serve HTML, isso é responsabilidade do Next.js).
- **Swagger desativado por padrão em produção** (`NODE_ENV=production` desliga `/docs`, a menos que `SWAGGER_ENABLED=true` seja definido deliberadamente).
- **SSL via Let's Encrypt** — `infra/scripts/init-ssl.sh` emite o certificado inicial e ativa o bloco HTTPS do Nginx (template em `production-ssl.conf.template`, com HSTS); a renovação automática já existia desde a Fase 4 (serviço `certbot` em loop no `docker-compose.yml`).
- **Backup automatizado via cron** — `infra/scripts/install-backup-cron.sh` agenda o `backup.sh` (já existia desde a Fase 4) para rodar todo dia às 3h.
- **`.env.producao.example`** e **`deploy-producao.yml`** — workflow de deploy que exige um "Environment" do GitHub com aprovação manual obrigatória antes de rodar (não é só `workflow_dispatch`, é `workflow_dispatch` + gate humano).
- **`docs/PRODUCTION-CHECKLIST.md`** — checklist final cobrindo segredos, segurança, SSL, backup, observabilidade, validação funcional e LGPD.

## Decisões e trade-offs

1. **Rate limit da API é por IP, não por conta.** Um ataque distribuído (muitos IPs, poucas tentativas cada) não é pego pelo `ThrottlerGuard` — é pego pelo bloqueio de conta (que é por e-mail, independente de IP). As duas defesas se complementam: uma pega "muitas tentativas de um lugar", a outra pega "muitas tentativas numa conta".
2. **Bloqueio de conta usa HTTP 429 (Too Many Requests), não 401.** Retornar 401 para uma conta bloqueada seria enganoso (o problema não é mais a senha, é a política de bloqueio) — 429 comunica corretamente "espere e tente de novo".
3. **CSP desativada no Helmet da API.** Uma Content-Security-Policy genérica em uma API JSON pura não protege nada (não há HTML para injetar script) e só geraria falsos incômodos se algum cliente da API decidir renderizar a resposta de forma inesperada. A CSP de verdade deveria viver no Next.js, fora do escopo deste hardening de backend.
4. **`init-ssl.sh` reescreve `default.conf` a partir de um template, em vez de descomentar linhas.** Editar um arquivo de config via `sed`/manualmente para "descomentar" um bloco é frágil (mudanças futuras no arquivo quebram o comando); gerar o arquivo final inteiro a partir de um template com uma substituição simples (`${DOMAIN}`) é mais previsível e re-executável.
5. **Deploy em produção exige aprovação humana, sempre.** Homologação também é manual (`workflow_dispatch`), mas produção vai além: usa um GitHub Environment com "Required reviewers" configurável — a intenção é que apertar o botão de disparar o workflow não seja suficiente sozinho, precisa de uma segunda pessoa (ou a mesma pessoa, numa segunda etapa deliberada) confirmando.
6. **Sem teste de carga configurado.** Ferramentas como k6/Artillery/Locust não foram incluídas — dimensionar throughput esperado e rodar um teste de carga é uma decisão que depende do volume real de clientes esperado, então ficou registrado como item do checklist em vez de uma escolha arbitrária de ferramenta feita sem esse contexto.

## Validação neste ambiente

`tsc --noEmit --noResolve` sem erros em 110 arquivos de backend. Rodei a suíte de testes completa mais uma vez depois das mudanças desta fase — **78 testes continuam passando de verdade** (incluindo 3 testes novos especificamente para o bloqueio de conta: registra tentativa falha, bloqueia com 429, zera o contador em login bem-sucedido). Scripts shell (`sh -n`) e workflows YAML validados sintaticamente. Não há como testar a emissão de certificado SSL de verdade, o rate limiting sob carga real, nem o deploy em produção de ponta a ponta sem um domínio e servidor reais.

## O projeto está completo

As 16 fases do escopo original foram entregues. Um resumo do que existe, o que é uma simplificação consciente, e o que fica como próximo passo natural está no `README.md` e no `ROADMAP.md` na raiz do projeto — vale ler antes do primeiro deploy de verdade.
