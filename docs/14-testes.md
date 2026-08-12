# Fase 14 — Testes Automatizados

## O que foi implementado

**75 testes unitários rodados de verdade e passando** neste próprio ambiente de geração de código (não são apenas testes escritos — foram executados e confirmados, o que é uma exceção nesta jornada de 14 fases, já que a maior parte do resto do projeto só pôde ser validada por `tsc --noEmit`):

- **39 testes** em `packages/schemas` — extratores de OCR (CPF, CNPJ, placa, RENAVAM, chassi, datas, heurística de nomes), renderização de templates de e-mail (`{{variavel}}`), e validação dos schemas Zod principais (`quickCreateClaimSchema`, `createClaimSchema`, `clientSchema`, rótulos de etapa).
- **36 testes** em `apps/api` — `RolesGuard`/`PermissionsGuard` (incluindo o caso do Admin superusuário), `AuthService` (login, 2FA, refresh com rotação/detecção de reuso), `ClaimsService` (mudança de etapa, disparo de notificações), `ReportsService` (cálculo de % de SLA, incluindo divisão por zero), e o mapper de sinistros (`toKanbanCard`/`toClaimListItem`).

Além disso, um **teste e2e completo do fluxo de autenticação** (`apps/api/test/auth.e2e-spec.ts`) — registro de tenant, login, acesso a rota protegida, rejeição sem token, refresh com rotação — escrito e revisado, mas que exige um Postgres/Redis reais para rodar (não pôde ser executado neste sandbox).

Por fim, um **workflow de CI** (`.github/workflows/ci.yml`) rodando lint, type-check e os testes unitários a cada push/PR, com Postgres e Redis disponíveis como serviços do CI (para uma eventual execução manual dos testes e2e).

## Como consegui rodar testes de verdade neste ambiente

O maior obstáculo das fases anteriores sempre foi o mesmo: `@seguros/database` depende do Prisma Client gerado, que exige baixar engines de `binaries.prisma.sh` — domínio bloqueado neste sandbox. A solução para testes unitários foi simples e é uma boa prática de qualquer forma: **um mock de `@seguros/database`** (`apps/api/src/__mocks__/@seguros/database.ts`) mapeado via `moduleNameMapper` no `jest.config.js`. Testes unitários não deveriam depender de um banco de verdade mesmo em um ambiente sem essa restrição — cada service é testado com seu repositório mockado, então o mock existe só para satisfazer a resolução de módulo, não para fornecer dados.

O mesmo padrão foi aplicado a `bcrypt`, `otplib` e `qrcode` — não por serem inacessíveis, mas porque compilar o binding nativo do bcrypt ou gerar QR codes de verdade não agrega nada a um teste unitário que já mocka `PasswordService`/`TwoFactorService` como unidades completas.

## Decisões e trade-offs

1. **Nem todo service tem teste unitário ainda.** Priorizei os que concentram a lógica de negócio mais arriscada de quebrar silenciosamente (autenticação, permissões, cálculo de SLA) em vez de tentar cobrir os ~15 services do projeto por igual. `DocumentsService`, `NotificationsService` e `OcrAiService` ficam sem teste unitário nesta fase — são mais "orquestração fina" (chamam 2-3 dependências em sequência) do que lógica de decisão complexa, então o risco de regressão silenciosa é menor.
2. **Testes e2e existem mas não rodam no CI a cada PR.** Eles criam dados de verdade num banco e são mais lentos/frágeis que testes unitários — o CI roda o Postgres/Redis como serviços disponíveis, mas a etapa de `test:e2e` fica documentada como execução manual/sob demanda, não bloqueando todo PR. Se isso for indesejado, é só descomentar a etapa no `ci.yml`.
3. **Sem testes de componente React no front-end nesta fase.** Dado o volume já enorme de código coberto nas 14 fases, testar componentes React (que exigiria configurar Testing Library + jsdom + mocks de React Query/Zustand) ficou de fora — um gap real, registrado aqui em vez de disfarçado. Se for prioridade, a estrutura de testes do backend (mocks de módulo, `jest.config.js` por workspace) serve de modelo direto para replicar em `apps/web`.
4. **Coverage não tem threshold mínimo configurado** (`collectCoverageFrom` existe, mas sem `coverageThreshold`) — de propósito, para não bloquear o build por uma métrica arbitrária logo de cara. Fica como ajuste fácil de adicionar depois que a base de testes crescer organicamente.

## Validação neste ambiente

Ao contrário de todas as fases anteriores, aqui a validação não foi só `tsc --noEmit` — **75 testes foram executados de verdade** com Jest real (v29-30) e passaram. O teste e2e e o restante dos services sem cobertura ficam para rodar/expandir no ambiente real do usuário.

## Próxima fase

**Fase 15 — Deploy em ambiente de homologação**: validar o `docker-compose.yml` da Fase 4 rodando de ponta a ponta (`docker compose up --build`), rodar as migrations, popular o seed, e confirmar que os fluxos críticos funcionam com Postgres/Redis/S3 reais.
