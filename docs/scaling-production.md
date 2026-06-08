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

## GitHub Actions secrets (CI only)

`deploy.yml` does **not** inject runtime app secrets. Cloud Run deploy uses the default **`merge`** strategy: env vars you set in the GCP console are preserved; CI only updates a small set of deployment knobs.

### Repository secrets (all environments)

| Secret | Purpose |
|---|---|
| `GCP_PROJECT_ID` | Deploy target |
| `GCP_REGION` | Cloud Run region |
| `GCP_ARTIFACT_REGION` | Artifact Registry |
| `GCP_ARTIFACT_REPO` | Docker repo name |
| `GCP_SA_KEY` | Deploy service account JSON |

### Environment secrets (migrations only)

| Environment | Secret | Purpose |
|---|---|---|
| `staging` | `DATABASE_URL_STAGING` (or repo `DATABASE_URL`) | `migrate-staging` job |
| `production` | `DATABASE_URL_PRODUCTION` | `migrate-production` job |

### Set on Cloud Run (not GitHub)

Copy from `apps/server/.env.staging` or `.env.production` into each service in the GCP console:

- `npanel-server-staging` / `npanel-server-production`
- `npanel-workers-staging` / `npanel-workers-production`
- `npanel-web-staging` / `npanel-web-production` (minimal; web gets `VITE_SERVER_URL` from CI)

Includes auth, QStash worker URLs, Replicate webhooks, Redis, AWS SES, etc.

**Boot-critical vars** (process exits before listening on `PORT` if any are missing):

`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `QSTASH_ZEEPO_CANVAS_WORKER_ENDPOINT`, `QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT`, `REPLICATE_API_TOKEN`

`DIGITAX_API_KEY` is optional at boot; set it when DigiTax / eTIMS routes are used.

CI runs `scripts/verify-cloudrun-env.sh` before server and workers deploys to fail fast with a clear message instead of a 5-minute Cloud Run rollout timeout.

### CI-managed Cloud Run vars (in `deploy.yml`)

| Service | Vars set by pipeline |
|---|---|
| API | `NODE_ENV`, `HOSTNAME`, `DB_POOL_MAX` |
| Workers | `NODE_ENV`, `HOSTNAME`, `NPANEL_SERVICE_ROLE=workers`, `DB_POOL_MAX` |
| Web | `NODE_ENV`, `HOSTNAME`, `VITE_SERVER_URL` (resolved from live server URL) |

## Local development

- `bun run apps/server/src/index.ts` — all routes, pool default `30`
- `NPANEL_SERVICE_ROLE=workers bun run apps/server/src/workers-index.ts` — workers only, pool `20`
