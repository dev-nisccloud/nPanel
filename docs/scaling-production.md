# Production scaling configuration

This document describes the connection-pool and service-split changes for nPanel.

## Architecture

| Service | Cloud Run name | `NPANEL_SERVICE_ROLE` | `DB_POOL_MAX` |
|---|---|---|---|
| API + webhooks + tRPC | `npanel-server-*` | unset (or `api` after worker migration) | `12` (lower to `8` after `DISABLE_WORKER_ROUTES=1`) |
| QStash background workers | `npanel-workers-*` | `workers` | `20` |
| Static web SPA | `npanel-web-*` | — | — (no DB) |

## Safe rollout (no downtime)

1. **Deploy** — CI deploys API, workers, and web. Worker routes remain on the API service until you opt out.
2. **Optional pooler** — Add `DATABASE_POOLER_URL` (Supabase pooler port `6543` or PgBouncer) as a GitHub secret. When unset, `DATABASE_URL` is used unchanged.
3. **Optional Redis** — Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. When unset, session validation uses the database only (same behaviour as before).
4. **Migrate QStash** — Point each `QSTASH_*_WORKER_ENDPOINT` at the workers host. **Production:** `https://npanel-workers.nisccloud.com`. **Staging:** use the URL from the deploy log after the first workers deploy (no custom domain).
5. **Disable duplicate worker routes** — On the API Cloud Run service, set `DISABLE_WORKER_ROUTES=1` so only the workers service handles QStash jobs.

## Connection budget

```
max_cloud_run_api_instances × DB_POOL_MAX_api
  + max_cloud_run_worker_instances × DB_POOL_MAX_workers
  < postgres_max_connections × 0.7
```

With defaults (`8` × 8 API + `4` × 20 workers = 144), use a pooler or raise Postgres `max_connections`.

## Health monitoring

`GET /api/health` returns pool metrics:

```json
{
  "status": "healthy",
  "database": "connected",
  "pool": {
    "max": 8,
    "total": 3,
    "idle": 2,
    "waiting": 0,
    "usingPooler": true,
    "serviceRole": null
  }
}
```

Alert when `pool.waiting > 0` for sustained periods, `status` is `degraded`, or `poolWarnings` is non-empty.

## GitHub Actions secrets (staging vs production)

Worker URLs differ per environment. Use **`_STAGING`** and **`_PRODUCTION`** suffixes on GitHub environment secrets so `deploy.yml` injects the correct host.

### Staging (`main` branch → `staging` environment)

Workers host (after first deploy): `https://npanel-workers-staging-664360361267.us-east1.run.app`  
API webhooks stay on the API server URL.

| Secret | Example value |
|---|---|
| `VITE_PUBLIC_APP_URL_STAGING` | `https://npanel-staging.nisccloud.com` |
| `QSTASH_CAMPAIGN_WORKER_ENDPOINT_STAGING` | `https://npanel-workers-staging-….run.app/api/workers/send-campaign-emails` |
| `QSTASH_NISC_ORDER_WORKER_ENDPOINT_STAGING` | `…/api/workers/process-nisc-order` |
| `QSTASH_IMAGE_GENERATOR_WORKER_ENDPOINT_STAGING` | `…/api/workers/image-generator` |
| `QSTASH_BACKGROUND_REMOVER_WORKER_ENDPOINT_STAGING` | `…/api/workers/background-remover` |
| `QSTASH_NISC_EM_DISPATCH_WORKER_ENDPOINT_STAGING` | `…/api/workers/nisc-em-dispatch` |
| `QSTASH_WORKER_ENDPOINT_STAGING` | `…/api/workers/publish-content` |
| `QSTASH_LINKEDIN_WORKER_ENDPOINT_STAGING` | `…/api/workers/publish-linkedin-content` |
| `QSTASH_ZEEPO_CANVAS_WORKER_ENDPOINT_STAGING` | `…/api/workers/zeepo-canvas` |
| `QSTASH_EMAIL_BUILDER_AI_WORKER_ENDPOINT_STAGING` | `…/api/workers/email-builder-ai` |
| `QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT_STAGING` | `…/api/workers/meta-ads-analysis` |
| `QSTASH_ZEEPO_AGENT_WORKER_ENDPOINT_STAGING` | `…/api/workers/zeepo-agent` |
| `QSTASH_NISC_EMAIL_BUILDER_WORKER_ENDPOINT_STAGING` | `…/api/workers/nisc-email-builder` |
| `REPLICATE_*_WEBHOOK_URL_STAGING` | API server host + `/api/webhooks/…` |
| `QSTASH_TOKEN_STAGING` | Upstash QStash token (optional fallback: `QSTASH_TOKEN`) |
| `QSTASH_CURRENT_SIGNING_KEY_STAGING` | QStash signing key |
| `QSTASH_VITE_SIGNING_KEY_STAGING` | QStash next signing key |
| `DISABLE_WORKER_ROUTES_STAGING` | `1` after QStash jobs verified on workers |

### Production (`production` branch → `production` environment)

Workers host: `https://npanel-workers.nisccloud.com`  
API webhooks: `https://npanel-server.nisccloud.com/api/webhooks/…`

Use the same secret names with **`_PRODUCTION`** instead of `_STAGING`.

Shared across environments (no suffix): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DATABASE_POOLER_URL_*`, `AWS_SES_*`, `RESEND_API_KEY`.

## Local development

- `bun run apps/server/src/index.ts` — all routes, pool default `30`
- `NPANEL_SERVICE_ROLE=workers bun run apps/server/src/workers-index.ts` — workers only, pool `20`
