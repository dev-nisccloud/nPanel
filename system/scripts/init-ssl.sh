#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
#  init-ssl.sh
#  Issues a Let's Encrypt TLS certificate for storage.nisccloud.com
#  (the MinIO S3 API domain — required for correct presigned URLs).
#
#  Prerequisites:
#    1. DNS A record: storage.nisccloud.com → this VM's external IP
#    2. Port 80 open in GCE firewall (for the ACME challenge)
#    3. Production stack running:
#         docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
#
#  Usage:
#    chmod +x scripts/init-ssl.sh
#    cd scripts && ./init-ssl.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
fi

DOMAIN_STORAGE="${DOMAIN_STORAGE:-storage.nisccloud.com}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@nisccloud.com}"

COMPOSE_CMD="docker compose -f ../docker-compose.yml -f ../docker-compose.prod.yml"

echo "─────────────────────────────────────────"
echo " nPanel System — SSL Certificate Setup"
echo "─────────────────────────────────────────"
echo "Domain:  $DOMAIN_STORAGE"
echo "Contact: $CERTBOT_EMAIL"
echo ""
echo "Ensure the DNS A record for $DOMAIN_STORAGE points to this VM."
printf "Continue? [y/N] "
read -r CONFIRM
[ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ] || { echo "Aborted."; exit 1; }
echo ""

$COMPOSE_CMD run --rm certbot \
  certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$CERTBOT_EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  -d "$DOMAIN_STORAGE"

echo ""
echo "Certificate issued. Reloading nginx..."
$COMPOSE_CMD exec nginx nginx -s reload

echo ""
echo "✓ Done."
echo ""
echo "  MinIO S3 API  → https://$DOMAIN_STORAGE"
echo "  MinIO Console → http://<VM-IP>:9001"
echo "  pgAdmin       → http://<VM-IP>:5050"
echo "  Grafana       → http://<VM-IP>:3100"
echo "  Uptime Kuma   → http://<VM-IP>:3102"
echo "  Prometheus    → http://<VM-IP>:9090"
echo "  Alertmanager  → http://<VM-IP>:9093"
