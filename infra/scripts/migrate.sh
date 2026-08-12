#!/bin/sh
# infra/scripts/migrate.sh
#
# Aplica as migrations do Prisma no banco do docker-compose.
# Uso: ./infra/scripts/migrate.sh [dev|deploy]
#   dev    -> npx prisma migrate dev     (cria nova migration a partir do schema)
#   deploy -> npx prisma migrate deploy  (aplica migrations existentes, usado em produção)

set -eu

MODE="${1:-deploy}"

if [ "$MODE" != "dev" ] && [ "$MODE" != "deploy" ]; then
  echo "Uso: $0 [dev|deploy]" >&2
  exit 1
fi

echo "[migrate] Rodando 'prisma migrate ${MODE}' dentro do container da API..."
docker compose exec api npx prisma migrate "$MODE" --schema=./prisma/schema.prisma
echo "[migrate] Concluído."
