#!/bin/sh
# Start the already-configured stack. Disk, .env, and the HTTP nginx
# config must exist first. Follow INSTALL.txt from the beginning.
# This does not format a disk and it does not request a certificate.

set -eu

cd "$(dirname "$0")"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is not installed. Follow INSTALL.txt section 4."
  exit 1
fi

if [ ! -f .env ]; then
  echo "Missing .env. Follow INSTALL.txt section 5."
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

if [ -z "${MINIO_ROOT_PASSWORD:-}" ] || [ "$MINIO_ROOT_PASSWORD" = "change_me_strong_password" ]; then
  echo "Set a real MINIO_ROOT_PASSWORD in .env."
  exit 1
fi

if [ -z "${STORAGE_BIND_IP:-}" ] || [ "$STORAGE_BIND_IP" = "change_me_storage_ip" ] || [ "$STORAGE_BIND_IP" = "0.0.0.0" ]; then
  echo "Set STORAGE_BIND_IP to the dedicated storage address from identify.sh."
  echo "0.0.0.0 would take ports 80 and 443 away from the hosting stack."
  exit 1
fi

if [ -z "${DOMAIN_STORAGE:-}" ]; then
  echo "Set DOMAIN_STORAGE in .env."
  exit 1
fi

if ! findmnt -n /mnt/storage >/dev/null 2>&1; then
  echo "/mnt/storage is not mounted. Run scripts/identify.sh, then scripts/prepare-disk.sh."
  exit 1
fi

for dir in /mnt/storage/minio /mnt/storage/letsencrypt /mnt/storage/certbot; do
  if [ ! -d "$dir" ]; then
    echo "Missing $dir. Run scripts/prepare-disk.sh."
    exit 1
  fi
done

if [ -f nginx/conf.d/storage-https.conf ] && [ ! -f "/mnt/storage/letsencrypt/live/${DOMAIN_STORAGE}/fullchain.pem" ]; then
  echo "nginx/conf.d/storage-https.conf is present but the certificate is not."
  echo "Move that file out of conf.d until scripts/init-ssl.sh succeeds."
  exit 1
fi

echo "Computer: $(hostname)"
echo "Binding:  ${STORAGE_BIND_IP}:80 and ${STORAGE_BIND_IP}:443"
echo "Data:     ${MINIO_DATA_DIR:-/mnt/storage/minio}"
echo "CPU cap:  ${MINIO_CPU_LIMIT:-1.0}    Memory cap: ${MINIO_MEMORY_LIMIT:-1g}"

docker compose up -d minio minio-init nginx

echo
echo "S3 on this machine, HTTP, until the certificate exists:"
echo "  http://${STORAGE_BIND_IP}/minio/health/live"
echo "Console, this machine only:"
echo "  http://127.0.0.1:9001"
echo
echo "When DNS for ${DOMAIN_STORAGE} is ${STORAGE_BIND_IP}, run:"
echo "  sh /opt/nisccloudstorage/scripts/init-ssl.sh"
