# Fase 11 — OCR e IA

## O que foi implementado

**OCR** (assíncrono, via worker — mesmo padrão do e-mail na Fase 10):
- Todo upload de imagem (JPG/PNG/WEBP) ou PDF enfileira automaticamente um job na fila `ocr-queue` (`DocumentsService` → `OcrQueueService`).
- O worker baixa o arquivo do S3/R2, roda **Tesseract.js** (OCR de verdade, em português) para imagens, e tenta a camada de texto embutida via `pdf-parse` para PDFs.
- Extratores por regex (`packages/schemas/src/ocr-extractors.ts`) reconhecem CPF, CNPJ, placa (Mercosul e padrão antigo), RENAVAM, chassi (VIN de 17 caracteres) e datas — e uma heurística simples para nomes (linhas em maiúsculas com 2+ palavras).
- O resultado fica salvo em `Document.ocrExtractedData` (campo que já existia desde a Fase 2). A tela de Documentos mostra os valores encontrados com um botão **"aplicar"** por campo — a aplicação ao cadastro é sempre uma ação deliberada do regulador, nunca automática, porque OCR erra (principalmente com fotos de celular tiradas com má iluminação).

**IA** (síncrono, direto na API — ao contrário do OCR, o regulador espera a resposta na tela na hora):
- Integração com IA desacoplada do provedor (`AiClientService`): por padrão usa a **Anthropic** (`@anthropic-ai/sdk`, modelo via `ANTHROPIC_MODEL`), mas aceita **qualquer API compatível com OpenAI** (`OPENAI_BASE_URL` + `OPENAI_API_KEY` + `OPENAI_MODEL`) — dá para apontar para OpenAI, DeepSeek, Ollama/LM Studio local sem mudar código. Sem chave de nenhum provedor (`AI_PROVIDER`) o endpoint apenas responde com erro claro, sem derrubar o backend.
- 8 ações do escopo original, todas reaproveitando o mesmo bloco de contexto do sinistro (dados cadastrais, checklist, comentários, timeline) — só muda a instrução dada ao modelo: resumo do sinistro, documentos faltantes, inconsistências, próximos passos, gerar e-mail, parecer técnico, responder pergunta, histórico resumido.
- Endpoint único `POST /claims/:id/ai` com um campo `action`, em vez de 8 endpoints separados — mais simples de manter e documentar no Swagger.
- Painel de IA na tela do sinistro (aba "IA"): botões para as ações diretas, e dois campos de entrada livre (pergunta ao assistente, propósito do e-mail a gerar).

## Decisões e trade-offs

1. **OCR não faz nada sozinho — só sugere.** Os campos extraídos ficam disponíveis para revisão, com um botão explícito de "aplicar" por valor encontrado (pode haver mais de um candidato, ex: duas datas na mesma CNH). Preencher o cadastro automaticamente sem revisão humana seria arriscado dado o quanto OCR de foto de celular erra na prática.
2. **PDF escaneado como imagem não tem OCR de verdade nesta fase** — `pdf-parse` só lê a camada de texto de PDFs gerados digitalmente. Fazer OCR de PDF escaneado exigiria converter cada página em imagem antes (uma dependência pesada a mais, tipicamente `pdf-img-convert` ou similar) — documentado como limitação conhecida, não implementado agora para não inflar demais o escopo desta fase.
3. **IA é síncrona (chamada direta da API), não uma fila.** Ao contrário do e-mail/OCR (que rodam em segundo plano sem ninguém esperando), as funções de IA são acionadas por um clique do regulador que quer ver o resultado imediatamente na tela — enfileirar isso só adicionaria latência sem benefício.
4. **Um endpoint com `action` em vez de 8 rotas.** Todas as 8 funções pedem exatamente o mesmo contexto de sinistro; a única coisa que muda é a instrução (prompt). Consolidar num único endpoint evitou 8 controllers quase idênticos.
5. **Todo texto gerado por IA é rotulado como minuta que precisa de revisão** — isso está explícito tanto no prompt (instrução ao modelo) quanto na UI ("sempre revise antes de usar oficialmente"), para não criar a falsa impressão de que o parecer técnico gerado já é uma decisão oficial.
6. **`ANTHROPIC_API_KEY` ausente não quebra a aplicação** — o endpoint de IA retorna um erro claro pedindo para configurar a chave, em vez de todo o backend falhar ao subir. Isso segue o mesmo padrão do SMTP na Fase 10 (sem `SMTP_HOST`, o worker só loga em vez de enviar).

## Considerações operacionais

- **Tesseract.js baixa os dados de idioma na primeira execução** (a menos que sejam pré-cacheados/empacotados na imagem Docker) — em um ambiente de produção com rede restrita, isso precisa ser resolvido antes do deploy (baixar o `.traineddata` de português antecipadamente e apontar `tesseract.js` para o caminho local). Fica registrado aqui para o hardening pré-produção (Fase 15/16).
- OCR é intencionalmente processado com baixa concorrência (`concurrency: 2` no worker) porque é pesado de CPU — evita que um pico de uploads trave o processamento de e-mail na mesma máquina.

## Validação neste ambiente

`tsc --noEmit --noResolve` sem erros em todos os arquivos de backend/workers (108) e frontend (70) desta fase. Não há como testar OCR/IA de ponta a ponta sem uma chave da Anthropic e um bucket S3/R2 de verdade configurados neste sandbox.

## Próxima fase

**Fase 12 — Relatórios e dashboards avançados**: tempo médio por regulador/seguradora, SLA, relatório financeiro, produtividade, documentos pendentes — com exportação em PDF/Excel/CSV.
