#!/bin/sh
# infra/scripts/backup.sh
#
# Faz um dump do banco Postgres do docker-compose e mantém os últimos N dias.
# Uso recomendado: agendar via cron no host, ex:
#   0 3 * * * /caminho/para/seguros-saas/infra/scripts/backup.sh >> /var/log/seguros-backup.log 2>&1
#
# Requer que o serviço "postgres" do docker-compose esteja rodando.

set -eu

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-seguros-saas}"

mkdir -p "$BACKUP_DIR"

echo "[backup] Gerando dump do Postgres em ${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz"

docker compose exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-seguros_saas}" \
  | gzip > "${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz"

echo "[backup] Removendo backups com mais de ${RETENTION_DAYS} dias"
find "$BACKUP_DIR" -name 'db_*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete

echo "[backup] Concluído."
