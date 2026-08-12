# Fase 5 — Autenticação e Controle de Permissões

## O que foi implementado

- **Login por e-mail/senha** com bcrypt (12 salt rounds).
- **Access token JWT** (15 min, configurável) contendo `sub`, `tenantId`, `role` e `permissions[]`.
- **Refresh token opaco** (não é um JWT): valor aleatório de 48 bytes, com apenas o **hash SHA-256** salvo no banco. Rotação a cada uso — o token antigo é sempre revogado, o que permite detectar reuso indevido (token roubado usado depois do dono legítimo já ter renovado a sessão).
- **2FA via TOTP** (compatível com Google Authenticator, Authy etc.): `POST /auth/2fa/setup` gera QR code, `POST /auth/2fa/confirm` ativa. No login, se o usuário tiver 2FA ativo, `POST /auth/login` devolve um `tempToken` de 5 minutos (assinado com um secret **diferente** do access token, então não pode ser usado para acessar rotas protegidas) em vez dos tokens finais; `POST /auth/2fa/login` troca esse `tempToken` + código de 6 dígitos pelos tokens de verdade.
- **RBAC por papel** (`@Roles(UserRole.ADMIN, ...)`) e **permissões granulares** (`@RequirePermissions('financeiro:visualizar')`), aplicadas como guards globais.
- **Isolamento de tenant automático na camada de dados**: um Prisma Client Extension (`packages/database/src/prisma-tenant-extension.ts`) injeta `tenantId` automaticamente em toda query de listagem/escrita em massa dos modelos multi-tenant, lendo o tenant da requisição atual de um `AsyncLocalStorage` populado pelo `TenantContextInterceptor`.

## Endpoints

| Método | Rota | Público? | Descrição |
|---|---|---|---|
| POST | `/auth/register-tenant` | Sim | Cria um novo tenant + usuário Administrador |
| POST | `/auth/login` | Sim | Login; retorna tokens ou `{ requiresTwoFactor: true, tempToken }` |
| POST | `/auth/2fa/login` | Sim | Completa o login quando 2FA está ativo |
| POST | `/auth/refresh` | Sim | Troca um refresh token válido por um novo par de tokens |
| POST | `/auth/logout` | Não | Revoga o refresh token informado |
| POST | `/auth/2fa/setup` | Não | Gera secret + QR code para ativar 2FA |
| POST | `/auth/2fa/confirm` | Não | Confirma o código gerado e ativa o 2FA |

## Decisões e trade-offs (vale revisar)

1. **Login por e-mail globalmente único na prática, não impondo isso no schema.** Um mesmo e-mail poderia teoricamente existir em dois tenants diferentes (o schema permite, `@@unique([tenantId, email])`), mas o login busca por e-mail sem tenant. Se isso for um problema real de negócio, a evolução é adicionar uma tela de seleção de tenant quando houver mais de um resultado — sem quebrar a API.
2. **Permissões ficam "congeladas" no JWT no momento do login/refresh.** Se um Administrador conceder uma permissão nova a um usuário, ela só passa a valer no próximo login (ou quando o access token expirar e for renovado, no máximo 15 minutos depois). Evita consultar o banco a cada requisição só para checar permissão. Se isso incomodar, dá para trocar por um cache curto em Redis sem mudar a assinatura do `PermissionsGuard`.
3. **A extensão de tenant do Prisma não cobre `findUnique`/`update`/`delete`/`upsert` de registro único** — o Prisma exige que o `where` desses métodos seja exatamente a chave única, sem filtros extras. Repositórios que buscarem por `id` devem validar `record.tenantId` depois de buscar, ou preferir `findFirst`/`updateMany`. Isso está documentado no cabeçalho do `prisma-tenant-extension.ts`.
4. **2FA obrigatório vs. opcional por papel**: o escopo original pede 2FA "para todos"; implementei o mecanismo completo, mas deixei a decisão de **quando exigir** (ex: obrigatório para Admin/Gestor, opcional para os demais) para ser configurada no módulo de Configurações (Fase de cadastros/admin), em vez de hard-codar aqui.

## O que falta para esta fase ser considerada "pronta para produção" (fica para o hardening pré-deploy, Fase 15/16)

- Rate limiting no `/auth/login` e `/auth/2fa/login` (proteção contra força bruta) — hoje não há.
- Bloqueio temporário de conta após N tentativas de login falhas.
- Endpoint de "esqueci minha senha" (envio de e-mail com link de reset) — depende do módulo de notificações (Fase 10).
- Testes automatizados (Fase 14).

## Validação neste ambiente

O sandbox não tem as dependências (`@nestjs/*`, `bcrypt`, `otplib`, etc.) instaladas — isso exigiria baixar pacotes com bindings nativos e não é o foco deste ambiente de geração de código. Rodei o compilador TypeScript apenas para checagem de sintaxe (`tsc --noEmit --noResolve`) em todos os arquivos novos: **nenhum erro de sintaxe ou de uso de decorators**; os únicos erros reportados são "módulo não encontrado", esperado sem `npm install`. Rode `npm install && npm run db:generate` no seu ambiente antes de testar de verdade.

## Próxima fase

**Fase 6 — Dashboard com indicadores**: cards de contagem por etapa, gráficos mensais/anuais, SLA médio. Vou implementar o endpoint de agregação na API (aproveitando os guards desta fase) e a tela no Next.js.
