#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Echon VPS Backup Script
# Place this file on the VPS at ~/echon/scripts/vps_backup.sh
# Then add to crontab: crontab -e
#   0 3 * * * /bin/bash ~/echon/scripts/vps_backup.sh >> ~/echon/logs/backup.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BACKUP_DIR="${HOME}/echon/backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/echon_db_${TIMESTAMP}.sql.gz"
KEEP_DAYS=30   # Delete backups older than this

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup..."

# Dump from the Docker-managed Postgres container
# Container name: echon_postgres (adjust if yours differs)
docker exec echon_postgres pg_dump \
  -U echon \
  -d echon_db \
  --no-password \
  | gzip > "${BACKUP_FILE}"

echo "[$(date)] Backup written: ${BACKUP_FILE} ($(du -sh "${BACKUP_FILE}" | cut -f1))"

# Rotate old backups
find "${BACKUP_DIR}" -name "echon_db_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
echo "[$(date)] Cleaned up backups older than ${KEEP_DAYS} days"

echo "[$(date)] Done."
