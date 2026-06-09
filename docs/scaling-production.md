# Production scaling configuration

This document describes the connection-pool and service-split changes for nPanel.

## Architecture

| Service | Cloud Run name | `NPANEL_SERVICE_ROLE` | `DB_POOL_MAX` |
|---|---|---|---|
| API + webhooks + tRPC | `npanel-server-*` | unset (or `api` after worker migration) | `12` (lower to `8` after `DISABLE_WORKER_ROUTES=1`) |
| QStash background workers | `npanel-workers-*` | `workers` | `20` |
| Static web SPA | `npanel-web-*` | - | - (no DB) |

## Safe rollout (no downtime)

1. **Deploy** - CI deploys API, workers, and web. Worker routes remain on the API service until you opt out.
2. **Optional pooler** - Add `DATABASE_POOLER_URL` (Supabase pooler port `6543` or PgBouncer) as a GitHub secret. When unset, `DATABASE_URL` is used unchanged.
3. **Optional Redis** - Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. When unset, session validation uses the database only (same behaviour as before).
4. **Migrate QStash** - Point each `QSTASH_*_WORKER_ENDPOINT` at the workers host. **Production:** `https://npanel-workers.nisccloud.com`. **Staging:** use the URL from the deploy log after the first workers deploy (no custom domain).
5. **Disable duplicate worker routes** - On the API Cloud Run service, set `DISABLE_WORKER_ROUTES=1` so only the workers service handles QStash jobs.

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

## GitHub Actions secrets

### Repository secrets (all environments)

| Secret | Purpose |
|---|---|
| `GCP_PROJECT_ID` | Deploy target |
| `GCP_REGION` | Cloud Run region |
| `GCP_ARTIFACT_REGION` | Artifact Registry |
| `GCP_ARTIFACT_REPO` | Docker repo name |
| `GCP_SA_KEY` | Deploy service account JSON |

### Environment secrets (`staging` / `production`)

Set per GitHub environment (values differ between staging and production):

| Secret | Purpose |
|---|---|
| `DATABASE_URL_STAGING` or `DATABASE_URL` | Staging migrations + server/workers deploy |
| `DATABASE_URL_PRODUCTION` | Production migrations + server/workers deploy |
| `BETTER_AUTH_SECRET_STAGING` | Staging boot |
| `BETTER_AUTH_URL_STAGING` | Staging boot |
| `CORS_ORIGIN_STAGING` | Staging boot |
| `BETTER_AUTH_SECRET_PRODUCTION` | Production boot |
| `BETTER_AUTH_URL_PRODUCTION` | Production boot |
| `CORS_ORIGIN_PRODUCTION` | Production boot |
| `GOOGLE_CLIENT_ID` | Boot |
| `GOOGLE_CLIENT_SECRET` | Boot |
| `QSTASH_ZEEPO_CANVAS_WORKER_ENDPOINT_STAGING` | Staging boot |
| `QSTASH_ZEEPO_CANVAS_WORKER_ENDPOINT_PRODUCTION` | Production boot |
| `QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT_STAGING` | Staging boot |
| `QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT_PRODUCTION` | Production boot |
| `REPLICATE_API_TOKEN` | Boot |

Add more secrets to `deploy.yml` as features need them (e.g. `QSTASH_TOKEN`, `AWS_SES_*`, `UPSTASH_REDIS_*`). `DIGITAX_API_KEY` is optional at boot.

Deploy uses **`merge`**: CI updates the vars above; anything else already on Cloud Run is kept.

### CI-managed Cloud Run vars (in `deploy.yml`)

| Service | Vars set by pipeline |
|---|---|
| API | Boot secrets above + `NODE_ENV`, `HOSTNAME`, `DB_POOL_MAX` |
| Workers | Boot secrets above + `NODE_ENV`, `HOSTNAME`, `NPANEL_SERVICE_ROLE=workers`, `DB_POOL_MAX` |
| Web | `NODE_ENV`, `HOSTNAME`, `VITE_SERVER_URL` (resolved from live server URL) |

## Local development

- `bun run apps/server/src/index.ts` - all routes, pool default `30`
- `NPANEL_SERVICE_ROLE=workers bun run apps/server/src/workers-index.ts` - workers only, pool `20`
