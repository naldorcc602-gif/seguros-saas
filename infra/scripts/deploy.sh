#!/bin/sh
# infra/scripts/deploy.sh
#
# Deploy via SSH num VPS que já tem o repositório clonado e o Docker
# instalado (ver docs/15-deploy-homologacao.md para o setup inicial do
# servidor). Idempotente — pode rodar múltiplas vezes sem efeito colateral.
#
# Uso:
#   ./infra/scripts/deploy.sh homologacao
#   ./infra/scripts/deploy.sh producao
#
# Pressupõe que o arquivo .env correto (.env.homologacao ou .env.producao,
# copiado para .env) já está no servidor — este script NUNCA gera segredos
# nem lê variáveis de um ambiente CI, de propósito, para não arriscar um
# `.env` de produção vazar em log de pipeline.

set -eu

ENVIRONMENT="${1:-}"
if [ "$ENVIRONMENT" != "homologacao" ] && [ "$ENVIRONMENT" != "producao" ]; then
  echo "Uso: $0 [homologacao|producao]" >&2
  exit 1
fi

echo "[deploy] Ambiente: ${ENVIRONMENT}"

if [ ! -f .env ]; then
  echo "[deploy] ERRO: arquivo .env não encontrado. Copie .env.${ENVIRONMENT}.example para .env e preencha os segredos antes de rodar o deploy." >&2
  exit 1
fi

echo "[deploy] Buscando código mais recente..."
git fetch origin
git checkout main
git pull origin main

echo "[deploy] Construindo as imagens..."
docker compose build

echo "[deploy] Subindo postgres e redis primeiro (a API precisa deles saudáveis antes de migrar)..."
docker compose up -d postgres redis
echo "[deploy] Aguardando postgres/redis ficarem saudáveis..."
for i in $(seq 1 30); do
  if docker compose ps postgres | grep -q "healthy" && docker compose ps redis | grep -q "healthy"; then
    break
  fi
  sleep 2
done

echo "[deploy] Subindo os demais serviços..."
docker compose up -d --remove-orphans

echo "[deploy] Aguardando a API ficar saudável antes de migrar..."
for i in $(seq 1 30); do
  if docker compose ps api | grep -q "healthy"; then
    break
  fi
  sleep 2
done

echo "[deploy] Rodando as migrations pendentes..."
docker compose exec -T api npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "[deploy] Rodando o smoke test..."
BASE_URL="${SMOKE_TEST_BASE_URL:-http://localhost}" ./infra/scripts/smoke-test.sh

echo "[deploy] Deploy em ${ENVIRONMENT} concluído com sucesso."
