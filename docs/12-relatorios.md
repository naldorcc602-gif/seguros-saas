# Fase 12 — Relatórios e Dashboards Avançados

## O que foi implementado

**Backend** (`apps/api/src/modules/reports`, novo módulo):
- 5 relatórios do escopo original, cada um com sua própria agregação: `GET /reports/resolution-time` (tempo médio geral, por regulador, por seguradora), `/reports/sla-compliance` (% de cumprimento geral/por seguradora/por regulador), `/reports/financial` (total, por tipo de lançamento, mensal, por seguradora), `/reports/productivity` (sinistros atribuídos/encerrados/comentários por regulador nos últimos 30 dias), `/reports/pending-documents` (checklist obrigatório ainda pendente, com link direto para o sinistro).
- Exportação em **PDF, Excel e CSV** — `GET /reports/:key/export?format=pdf|xlsx|csv`. Todos os três formatos partem da mesma tabela genérica (`reportToTable`), então adicionar um relatório novo no futuro não exige escrever lógica de exportação 3 vezes.
- Restrito a ADMIN/MANAGER/SUPERVISOR (dados gerenciais, não operacionais do dia a dia).

**Frontend**: página de Relatórios com abas para os 5 relatórios, cada um com uma visualização dedicada (barra de progresso para SLA, gráfico de barras para o financeiro mensal, tabelas para os demais), e botões de exportação que baixam o arquivo autenticado.

## Decisões e trade-offs

1. **Correção de isolamento de tenant encontrada e corrigida**: `pendingDocuments()` inicialmente não filtrava por tenant. `ClaimChecklistItem` não tem coluna `tenantId` própria (herda isolamento via `Claim`, como já documentado na Fase 9) — usar `prisma.claimChecklistItem.findMany` sem passar pelo relacionamento com `Claim.tenantId` explicitamente teria vazado documentos pendentes de todos os tenants. Corrigido antes de prosseguir.
2. **Exportação parte de uma tabela genérica (`{ title, headers, rows }`), não de templates específicos por formato.** CSV, Excel e PDF são só 3 "renderizadores" diferentes da mesma estrutura tabular — evita triplicar a lógica de formatação (moeda, percentual, dias) toda vez que um relatório novo for adicionado.
3. **PDF gerado com `pdfkit` (desenho direto), não HTML-to-PDF via Chromium headless.** Um Chromium embarcado (puppeteer) geraria um PDF com layout mais rico, mas adicionaria ~300MB à imagem Docker e um processo mais pesado — para tabelas de relatório simples, `pdfkit` é suficiente e muito mais leve.
4. **Download do arquivo exportado via Blob, não via link direto com token na URL.** Coloquei o token de acesso na URL numa primeira tentativa e corrigi antes de finalizar: tokens em URL podem vazar em logs de proxy e no histórico do navegador. O front-end busca o arquivo autenticado via `fetch` (Bearer token no header) e dispara o download a partir do Blob resultante.
5. **"Financeiro" reaproveita o modelo `FinancialEntry`** já existente desde a Fase 2 — não foi criado um `FinancialModule` novo separado, já que o escopo de "financeiro" do roadmap (custos, honorários, indenizações, pagamentos) já tinha modelagem própria; este relatório é a primeira tela que efetivamente lê esses dados. Lançar entradas financeiras (criar/editar `FinancialEntry`) ainda não tem tela própria — fica como próxima extensão natural quando o módulo financeiro precisar de operação, não só relatório.

## Validação neste ambiente

`tsc --noEmit --noResolve` sem erros em 115 arquivos de backend/workers e 79 de frontend. Sem Postgres disponível para testar as queries agregadas de verdade (particularmente as com `FILTER`/`JOIN` em SQL raw) — recomendo rodar com dados de exemplo antes de confiar nos números em produção.

## Próxima fase

**Fase 13 — API REST documentada com Swagger**: o Swagger já está de pé desde a Fase 4 (`/docs`), mas ainda em nível básico; esta fase preenche `@ApiProperty`/`@ApiResponse` em todos os DTOs e controllers das fases anteriores, para a documentação ficar completa e navegável.
