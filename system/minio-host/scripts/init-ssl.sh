#!/bin/sh
# Issue the Let's Encrypt certificate with the certbot container, switch
# nginx from the HTTP bootstrap to HTTPS, and schedule a reload so renewals
# are picked up. Run this only after DNS points at STORAGE_BIND_IP and
# `docker compose up -d minio minio-init nginx` is already running.

set -eu

cd /opt/nisccloudstorage

if [ ! -f .env ]; then
  echo "Missing /opt/nisccloudstorage/.env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

: "${DOMAIN_STORAGE:?Set DOMAIN_STORAGE in .env}"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL in .env}"
: "${STORAGE_BIND_IP:?Set STORAGE_BIND_IP in .env}"

if [ "$STORAGE_BIND_IP" = "change_me_storage_ip" ] || [ "$STORAGE_BIND_IP" = "0.0.0.0" ]; then
  echo "STORAGE_BIND_IP must be the dedicated storage address, not $STORAGE_BIND_IP."
  exit 1
fi

echo "Computer:  $(hostname)"
echo "Domain:    $DOMAIN_STORAGE"
echo "Bind IP:   $STORAGE_BIND_IP"
echo "Contact:   $CERTBOT_EMAIL"
echo
echo "The DNS A record for $DOMAIN_STORAGE must be $STORAGE_BIND_IP."
printf "Continue? [y/N] "
read -r confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Aborted."
  exit 1
fi

docker compose run --rm --entrypoint certbot certbot \
  certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$CERTBOT_EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  -d "$DOMAIN_STORAGE"

live="/mnt/storage/letsencrypt/live/$DOMAIN_STORAGE"
if [ ! -f "$live/fullchain.pem" ] || [ ! -f "$live/privkey.pem" ]; then
  echo "Certificate files were not written under $live"
  exit 1
fi

cp nginx/storage-http-redirect.conf nginx/conf.d/storage-http.conf
cp nginx/storage-https.conf nginx/conf.d/storage-https.conf

docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
docker compose up -d certbot

cron_line='15 3,15 * * * cd /opt/nisccloudstorage && docker compose exec -T nginx nginx -s reload'
(
  crontab -l 2>/dev/null | grep -v 'nisccloudstorage && docker compose exec -T nginx nginx -s reload' || true
  echo "$cron_line"
) | crontab -

echo
echo "Certificate is live."
echo "  https://$DOMAIN_STORAGE"
echo "  files: $live"
echo "Certbot renews inside nisccloudstorage-certbot every 12 hours."
echo "Nginx reloads at 03:15 and 15:15 so a renewed certificate is used."
