# Fase 6 — Dashboard com Indicadores

## O que foi implementado

**Backend** (`apps/api/src/modules/dashboard`):
- `GET /dashboard/summary` — um único endpoint agregando tudo que o dashboard precisa (evita N chamadas separadas do front-end): total/por etapa/em andamento/encerrados/negados, valor total estimado, tempo médio de resolução, SLA médio, volume mensal (últimos 12 meses), distribuição por seguradora/corretor/regulador/estado, sinistros críticos em aberto e atividade recente (últimos 15 eventos de `TimelineEvent`).
- Protegido por `@Roles(ADMIN, MANAGER, SUPERVISOR, ADJUSTER)` — visão ampla por papel, não uma permissão granular extra (ver decisão abaixo).

**Frontend** (`apps/web`):
- Sistema de design definido (cores, tipografia, elemento-assinatura) e aplicado via Tailwind + CSS vars, com tema claro/escuro persistido.
- Autenticação de fato ligada ao backend: `auth-store` (Zustand), `api-client` com refresh automático em 401, página de login com o fluxo de 2FA em duas etapas.
- Layout autenticado: `Sidebar` recolhível + `Topbar` (busca, tema, notificações, logout).
- Dashboard: fita de pipeline (elemento-assinatura), cards de indicadores, gráfico de volume mensal (Recharts), rankings por seguradora/corretor/regulador/estado, lista de sinistros críticos e feed de atividade recente — tudo consumindo o endpoint real via React Query (poll a cada 30s).

## Decisões e correções que fiz ao longo da implementação

1. **Correção de isolamento de tenant em SQL raw.** As médias de resolução/SLA e o volume mensal usam `prisma.$queryRaw` (necessário para `date_trunc`/`EXTRACT`), que **não passa** pela extensão de multi-tenancy do Prisma criada na Fase 5 — ela só intercepta chamadas via Query Builder. Sem correção, isso vazaria dados entre tenants. Corrigi injetando `tenantId` manualmente (via `getCurrentTenantId()`) em cada uma dessas três queries, com um comentário de alerta no topo do arquivo para qualquer nova query raw que for adicionada depois.
2. **Dashboard por papel, não por permissão granular.** Cheguei a gatear o endpoint com `@RequirePermissions('reports:view')`, mas como a tabela `UserPermission` começa vazia (nenhum grant automático), isso bloquearia até o próprio Administrador logo no primeiro acesso. Troquei para `@Roles(...)`, reservando `@RequirePermissions` para exceções pontuais, conforme o modelo de RBAC de duas camadas descrito na Fase 5.
3. **Superusuário Admin no `PermissionsGuard`.** Corrigi o guard para que o papel `ADMIN` sempre passe em checagens de permissão granular — sem isso, o Admin ficaria bloqueado em qualquer rota que exigisse uma `UserPermission` que ninguém concedeu ainda a ele mesmo.
4. **"Mapa de calor" é um proxy por estado, não geolocalização de verdade.** O escopo original pede um mapa de calor geográfico; isso exigiria geocodificação de endereço (CEP → lat/lng), fora do escopo desta fase. Implementei uma distribuição por estado do cliente como aproximação, deixado explícito na própria UI ("proxy do mapa de calor"). Se/quando isso for necessário de verdade, a evolução natural é geocodificar no cadastro do sinistro (Fase 8) e usar Leaflet/Mapbox aqui.
5. **Sem sinistros ainda = dashboard vazio, não quebrado.** Como o CRUD de sinistros só chega na Fase 8, testei mentalmente o caminho de "banco vazio": a fita de pipeline mostra uma mensagem de estado vazio em vez de uma barra quebrada, e todas as listas têm mensagens de "sem dados ainda" em vez de ficarem em branco sem explicação.
6. **Atualização em tempo real por polling (30s), não WebSocket ainda.** O escopo pede "atualização em tempo real"; comecei com polling via React Query por ser simples e já suficiente para um dashboard gerencial. Migrar para WebSocket/SSE fica melhor posicionado na Fase 7 (Kanban), quando arrastar-e-soltar entre colunas vai precisar do mesmo canal ao vivo — construir os dois no mesmo momento evita implementar tempo real duas vezes.

## Validação neste ambiente

Sem Docker/Postgres disponíveis no sandbox para rodar de ponta a ponta. Rodei `tsc --noEmit --noResolve` (checagem de sintaxe, ignorando resolução de módulos externos não instalados) em todos os 28 arquivos novos desta fase — sem erros de sintaxe. Assim como nas fases anteriores, um `npm install && npm run dev` no seu ambiente é o próximo passo antes de seguir.

## Próxima fase

**Fase 7 — Pipeline Kanban**: as colunas (Novo → Contato Inicial → ... → Concluído/Negado), cartões arrastáveis, atualização em tempo real (aqui sim via WebSocket, reaproveitando a base desta fase) e os filtros/busca instantânea do escopo original.
