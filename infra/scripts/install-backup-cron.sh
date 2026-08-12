#!/bin/sh
# infra/scripts/install-backup-cron.sh
#
# Agenda o backup.sh (já existente desde a Fase 4) para rodar todo dia às
# 3h da manhã, via crontab do usuário atual. Idempotente — rodar de novo
# não duplica a entrada.
#
# Uso: ./infra/scripts/install-backup-cron.sh

set -eu

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CRON_MARKER="# seguros-saas-backup"
CRON_LINE="0 3 * * * cd ${REPO_DIR} && ./infra/scripts/backup.sh >> /var/log/seguros-saas-backup.log 2>&1 ${CRON_MARKER}"

if crontab -l 2>/dev/null | grep -qF "$CRON_MARKER"; then
  echo "[install-backup-cron] Já existe uma entrada de backup agendada — nada a fazer."
  exit 0
fi

(crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -

echo "[install-backup-cron] Backup diário agendado para 3h da manhã."
echo "[install-backup-cron] Logs em /var/log/seguros-saas-backup.log"
echo "[install-backup-cron] Lembrete: o backup.sh salva localmente em ./backups —"
echo "                       configure também uma cópia off-site (ex: rclone para"
echo "                       um bucket S3 separado) antes de confiar nisso como"
echo "                       única defesa contra perda de dados do servidor."
