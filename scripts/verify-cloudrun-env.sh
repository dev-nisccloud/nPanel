#!/usr/bin/env bash
# Fail fast when Cloud Run is missing boot-critical env vars (see packages/env/src/server.ts).
set -euo pipefail

SERVICE_NAME="${1:?Usage: verify-cloudrun-env.sh <service-name> <region>}"
REGION="${2:?Usage: verify-cloudrun-env.sh <service-name> <region>}"

REQUIRED=(
  DATABASE_URL
  BETTER_AUTH_SECRET
  BETTER_AUTH_URL
  CORS_ORIGIN
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  QSTASH_ZEEPO_CANVAS_WORKER_ENDPOINT
  QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT
  REPLICATE_API_TOKEN
)

mapfile -t CONFIGURED < <(
  gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --format='value(spec.template.spec.containers[0].env[].name)'
)

missing=()
for name in "${REQUIRED[@]}"; do
  found=0
  for configured in "${CONFIGURED[@]}"; do
    if [[ "$configured" == "$name" ]]; then
      found=1
      break
    fi
  done
  if [[ $found -eq 0 ]]; then
    missing+=("$name")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "::error::Cloud Run service ${SERVICE_NAME} is missing required env vars: ${missing[*]}"
  echo "The container exits at boot without these (Cloud Run reports PORT=8080 timeout)."
  echo "Copy apps/server/.env.staging or .env.production into GCP Console → Cloud Run → ${SERVICE_NAME} → Variables & Secrets."
  echo "See docs/scaling-production.md"
  exit 1
fi

echo "Required runtime env vars present on ${SERVICE_NAME}"
