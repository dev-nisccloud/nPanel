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

Alert when `pool.waiting > 0` for sustained periods or when `idle === 0` with high traffic.

## Local development

- `bun run apps/server/src/index.ts` — all routes, pool default `30`
- `NPANEL_SERVICE_ROLE=workers bun run apps/server/src/workers-index.ts` — workers only, pool `20`
