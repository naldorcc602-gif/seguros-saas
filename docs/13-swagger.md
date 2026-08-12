# Fase 13 — API REST Documentada com Swagger

## O que foi implementado

- **Plugin do NestJS/Swagger habilitado** (`apps/api/nest-cli.json`) — em vez de anotar manualmente `@ApiProperty` em cada um dos ~40 campos espalhados pelos DTOs das 12 fases anteriores, o plugin introspecciona os tipos TypeScript (e os decorators do `class-validator`, via `classValidatorShim: true`) em tempo de build e gera a documentação de schema automaticamente. Isso é o padrão recomendado pela própria NestJS para projetos deste tamanho — anotar tudo manualmente seria redundante com o que já está expresso nos tipos e nos decorators de validação.
- `DocumentBuilder` do `main.ts` reescrito: descrição completa (como autenticar, como funciona multi-tenancy, formato de erro padrão), 9 tags organizadas (uma por módulo/fase), esquema de segurança nomeado (`access-token`), `persistAuthorization: true` (o token digitado no Swagger UI não some ao recarregar a página).
- **Todos os controllers** (`auth`, `dashboard`, `claims`, `registries`, `documents`, `portal`, `notifications`, `ocr-ai`, `reports`, `health`) ganharam `@ApiOperation` com resumo em cada rota, `@ApiBearerAuth('access-token')` nos protegidos, e `@ApiResponse` para os status code relevantes (200/201/204/400/401/404/409/410/500) onde o comportamento não é óbvio pelo nome do método.

## Bug real encontrado e corrigido nesta fase

**`GET /health` não tinha `@Public()`.** Como o `JwtAuthGuard` é global (`APP_GUARD`), toda rota sem `@Public()` exige um JWT válido — inclusive, sem querer, o próprio endpoint de health check. Isso significa que o `HEALTHCHECK` do Docker (configurado desde a Fase 4 fazendo uma requisição sem token) estaria recebendo 401 indefinidamente, e o container da API nunca seria marcado como "healthy" pelo `docker compose`. Corrigido adicionando `@Public()` ao `HealthController`. Vale testar isso especificamente ao rodar `docker compose up` no seu ambiente.

## Decisões e trade-offs

1. **Plugin automático em vez de anotação manual exaustiva.** O trade-off é que a qualidade dos exemplos/descrições de cada campo fica um pouco mais genérica do que se cada `@ApiProperty({ example: ..., description: ... })` fosse escrito à mão — mas cobrir ~150 endpoints e dezenas de DTOs manualmente consumiria uma fatia desproporcional do tempo desta fase comparado ao ganho real de documentação. Se quiser exemplos mais ricos em campos específicos (ex: `CreateClaimDto.vehiclePlate` com um exemplo de placa Mercosul), dá para adicionar `@ApiProperty` pontualmente sem conflitar com o plugin.
2. **`RegistriesController` (28 endpoints CRUD, 7 entidades) documenta o comportamento de erro uma vez no comentário da classe, não repetido 28 vezes** — todos os 7 cadastros têm exatamente o mesmo contrato (200/201/204 em sucesso, 409 se o registro estiver em uso), então repetir o mesmo `@ApiResponse` 28 vezes só infla o arquivo sem agregar informação nova.
3. **`PortalController` é o único sem `@ApiBearerAuth`** — de propósito, já que nenhuma rota dele aceita ou usa o JWT; o comentário no topo do arquivo explica por quê, para quem for adicionar uma rota nova ali não presumir que precisa de token.
4. **Resposta dos endpoints não usa classes decoradas do NestJS Swagger (`@ApiOkResponse({ type: ... })`) — usa os tipos TypeScript compartilhados com o front-end (`packages/schemas`, inferidos de Zod).** Isso significa que o Swagger UI mostra bem o *corpo da requisição* (todos os DTOs são classes, o plugin funciona neles) mas o *corpo da resposta* aparece como objeto genérico em vez de um schema detalhado — a estrutura real da resposta já está documentada nos tipos TS compartilhados (mesma fonte de verdade usada pelo front-end), só não aparece formatada no Swagger UI. Duplicar cada tipo de resposta como uma classe decorada só para o Swagger renderizar o schema foi considerado não valer o esforço/duplicação neste momento.

## Validação neste ambiente

`tsc --noEmit --noResolve` sem erros em 115 arquivos de backend/workers. **O comportamento do plugin do Swagger em si não pôde ser testado neste sandbox** — ele roda como parte de `nest build` (que usa o compilador TypeScript com um transform customizado), e não temos o `@nestjs/cli` nem os demais pacotes instalados aqui. Recomendo fortemente rodar `npm run build --workspace=@seguros/api` no seu ambiente e abrir `/docs` para confirmar visualmente que os schemas dos DTOs aparecem completos antes de seguir confiando nisso.

## Próxima fase

**Fase 14 — Testes automatizados**: testes unitários (Jest) para os services de cada módulo, testes de integração para os fluxos críticos (login completo, criação de sinistro, upload de documento), e a configuração de CI (GitHub Actions) já prevista no escopo original.
