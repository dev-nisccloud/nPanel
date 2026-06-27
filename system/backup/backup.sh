#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
#  nPanel PostgreSQL Backup Script
#  Runs inside the nPanel-System-pg-backup container via crond.
#
#  Output:  /backups/<database>_<YYYY-MM-DD_HHMMSS>.sql.gz
#  Retention: deletes backups older than BACKUP_RETENTION_DAYS (default: 7)
#
#  Manual restore:
#    docker compose exec -T postgres psql -U npanel -d npanel \
#      < <(gunzip -c /path/to/backup.sql.gz)
# ─────────────────────────────────────────────────────────────────────────────

set -e

TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="/backups/${PGDATABASE}_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

echo "[$(date -Iseconds)] Starting backup → ${BACKUP_FILE}"

# Run pg_dump and compress on the fly
pg_dump \
  --host="$PGHOST" \
  --username="$PGUSER" \
  --dbname="$PGDATABASE" \
  --no-password \
  --format=plain \
  --no-owner \
  --no-acl \
  | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date -Iseconds)] Backup complete  size: ${BACKUP_SIZE}"

# ── Retention cleanup ────────────────────────────────────────────────────────
echo "[$(date -Iseconds)] Removing backups older than ${RETENTION_DAYS} days..."
DELETED=$(find /backups -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
echo "[$(date -Iseconds)] Removed ${DELETED} old backup(s)"

# ── Summary ──────────────────────────────────────────────────────────────────
echo "[$(date -Iseconds)] Backups on disk:"
ls -lh /backups/*.sql.gz 2>/dev/null || echo "  (none)"
