#!/bin/sh
# Install the MinIO-only stack on the Plesk hosting server.
#
# From this directory, on the server:
#   cp .env.example .env
#   edit .env  (password, disk path, public URL)
#   mount the empty disk before the first run
#   chmod +x install.sh && ./install.sh
#
# Does not touch Plesk vhosts, mail, or port 80/443.
# After it is up, paste plesk-nginx-directives.conf into the storage domain.

set -e

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install Docker Engine, then run this again."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is not available (docker compose)."
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Wrote .env from .env.example."
  echo "Set MINIO_ROOT_PASSWORD, MINIO_DATA_DIR, and MINIO_SERVER_URL, then run ./install.sh again."
  exit 1
fi

# shellcheck disable=SC1091
. ./.env

if [ -z "${MINIO_ROOT_PASSWORD:-}" ] || [ "$MINIO_ROOT_PASSWORD" = "change_me_strong_password" ]; then
  echo "Set a real MINIO_ROOT_PASSWORD in .env before starting MinIO."
  exit 1
fi

if [ -z "${MINIO_SERVER_URL:-}" ]; then
  echo "Set MINIO_SERVER_URL in .env to the public https URL Plesk will serve."
  exit 1
fi

DATA_DIR="${MINIO_DATA_DIR:-/mnt/storage/minio}"
PARENT_DIR="$(dirname "$DATA_DIR")"

if [ ! -d "$PARENT_DIR" ]; then
  echo "Parent directory $PARENT_DIR does not exist."
  echo "Mount the empty disk first, then set MINIO_DATA_DIR to a path on that mount."
  exit 1
fi

mkdir -p "$DATA_DIR"
# Official MinIO image writes as uid 1000.
chown 1000:1000 "$DATA_DIR"
chmod 750 "$DATA_DIR"

echo "Starting MinIO with data in $DATA_DIR"
echo "CPU cap: ${MINIO_CPU_LIMIT:-1.0}    Memory cap: ${MINIO_MEMORY_LIMIT:-1g}"

docker compose up -d

echo ""
echo "S3 API (local only):  http://127.0.0.1:9000"
echo "Console (local only): http://127.0.0.1:9001"
echo "Public URL:           $MINIO_SERVER_URL"
echo ""
echo "Next: paste plesk-nginx-directives.conf into the Plesk domain for that URL."
echo "App env:"
echo "  S3_ENDPOINT=$MINIO_SERVER_URL"
echo "  S3_ACCESS_KEY=${MINIO_ROOT_USER:-minioadmin}"
echo "  S3_SECRET_KEY=<MINIO_ROOT_PASSWORD>"
echo "  S3_BUCKET=${MINIO_DEFAULT_BUCKET:-npanel-uploads}"
echo "  S3_REGION=us-east-1"
