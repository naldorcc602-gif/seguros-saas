# Checklist de Produção

Confira item por item antes de considerar o sistema pronto para uso real por clientes.

## Segredos e credenciais

- [ ] `.env` de produção tem segredos **únicos**, gerados com `openssl rand -base64 48` — nenhum reaproveitado de desenvolvimento/homologação
- [ ] `POSTGRES_PASSWORD` forte, diferente em cada ambiente
- [ ] Credenciais do bucket S3/R2 de produção são diferentes das de homologação (bucket também deveria ser diferente)
- [ ] `ANTHROPIC_API_KEY` configurada e com limite de gastos definido no painel da Anthropic
- [ ] SMTP de produção configurado e testado (envie um e-mail de teste de verdade antes de liberar para clientes)
- [ ] `.env` nunca foi commitado no Git (`git log --all --full-history -- .env` deve retornar vazio)

## Segurança de aplicação (Fase 16)

- [ ] Rate limiting ativo (`ThrottlerModule`, global + limite estrito em `/auth/*`)
- [ ] Bloqueio de conta após 5 tentativas de login falhas está funcionando (teste manualmente)
- [ ] Helmet ativo (cabeçalhos de segurança)
- [ ] Swagger (`/docs`) desativado em produção, a menos que exposição pública seja uma decisão deliberada (`SWAGGER_ENABLED`)
- [ ] CORS restrito a `APP_BASE_URL`, não `*`
- [ ] 2FA obrigatório para os usuários ADMIN/MANAGER (decisão operacional — reforçar na política interna, o mecanismo já existe desde a Fase 5)

## Rede e SSL

- [ ] DNS do domínio de produção resolvendo corretamente
- [ ] Certificado SSL emitido (`infra/scripts/init-ssl.sh`) e renovação automática confirmada (serviço `certbot` do `docker-compose.yml`)
- [ ] HSTS ativo (já incluído no template de produção do Nginx)
- [ ] Firewall do servidor permite só as portas 80, 443 e SSH (feche 5432/6379 para fora, mesmo que o Docker já isole por rede interna — defesa em profundidade)

## Dados e backup

- [ ] Migrations aplicadas (`prisma migrate deploy`)
- [ ] Backup automático agendado (`infra/scripts/install-backup-cron.sh`)
- [ ] Backup testado — restaurar um dump de teste num banco separado e confirmar que os dados batem
- [ ] Cópia off-site do backup configurada (o script salva localmente no servidor; um incêndio/falha de disco no mesmo servidor perde tudo sem isso)

## Observabilidade

- [ ] Logs da aplicação acessíveis (`docker compose logs -f api`) e com rotação configurada (Docker já limita por padrão, mas confirme `max-size` no `docker-compose.yml` se o disco for pequeno)
- [ ] `HEALTHCHECK` dos containers confirmado funcionando (`docker compose ps` mostra "healthy" para api/web)
- [ ] Alguém tem alerta configurado para quando um container reinicia repetidamente (mínimo: revisão manual periódica de `docker compose ps`)

## Validação funcional

- [ ] Smoke test (`infra/scripts/smoke-test.sh`) passando contra o domínio de produção
- [ ] Fluxo completo testado manualmente: abrir sinistro → upload de documento → mudança de etapa → notificação por e-mail recebida de verdade
- [ ] Portal público do cliente testado num navegador anônimo (sem sessão logada)
- [ ] Teste de carga básico, se o volume esperado for alto (nenhuma ferramenta de carga foi configurada neste projeto — considere k6 ou Artillery antes de um lançamento com muito tráfego esperado)

## LGPD e privacidade

- [ ] Política de privacidade publicada e acessível para os segurados que usam o portal público
- [ ] Processo definido para atender pedido de exclusão/exportação de dados de um titular (o schema já isola por tenant, mas o *processo* de responder a esse pedido é organizacional, não só técnico)
