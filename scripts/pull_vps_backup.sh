#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Pull latest VPS backup to local /backup folder
# Usage: ./scripts/pull_vps_backup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configure these ──────────────────────────────────────────────────────────
VPS_USER="${VPS_USER:-beni}"
VPS_HOST="${VPS_HOST:-echon.app}"
VPS_BACKUP_DIR="${VPS_BACKUP_DIR:-~/echon/backup}"
LOCAL_BACKUP_DIR="$(dirname "$0")/../backup"
# ─────────────────────────────────────────────────────────────────────────────

mkdir -p "${LOCAL_BACKUP_DIR}"

echo "Fetching latest backup from ${VPS_USER}@${VPS_HOST}:${VPS_BACKUP_DIR} ..."

# Copy the most recent backup file
LATEST=$(ssh "${VPS_USER}@${VPS_HOST}" "ls -t ${VPS_BACKUP_DIR}/echon_db_*.sql.gz 2>/dev/null | head -1")

if [ -z "${LATEST}" ]; then
  echo "No backup files found on VPS. Run vps_backup.sh on the server first."
  exit 1
fi

FILENAME=$(basename "${LATEST}")
scp "${VPS_USER}@${VPS_HOST}:${LATEST}" "${LOCAL_BACKUP_DIR}/${FILENAME}"

echo "Saved to: ${LOCAL_BACKUP_DIR}/${FILENAME}"
echo "You can now copy this to your USB drive from WSL2:"
echo "  cp ${LOCAL_BACKUP_DIR}/${FILENAME} /mnt/<drive>/echon-backups/"
