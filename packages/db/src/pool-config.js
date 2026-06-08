/**
 * Postgres pool sizing and connection URL resolution.
 *
 * Production layout (recommended):
 * - API Cloud Run:     NPANEL_SERVICE_ROLE=api      DB_POOL_MAX=8
 * - Workers Cloud Run: NPANEL_SERVICE_ROLE=workers  DB_POOL_MAX=20
 *
 * Optional DATABASE_POOLER_URL (PgBouncer / Supabase pooler port 6543) multiplexes
 * app connections without changing application code. When unset, DATABASE_URL is used.
 */
export function resolveDatabaseUrl() {
    const poolerUrl = process.env.DATABASE_POOLER_URL?.trim();
    if (poolerUrl)
        return poolerUrl;
    const directUrl = process.env.DATABASE_URL?.trim();
    if (!directUrl) {
        throw new Error("DATABASE_URL is not set");
    }
    return directUrl;
}
export function resolvePoolMax() {
    const raw = process.env.DB_POOL_MAX?.trim();
    if (raw) {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0)
            return Math.floor(n);
    }
    const role = process.env.NPANEL_SERVICE_ROLE?.trim().toLowerCase();
    if (role === "workers")
        return 20;
    if (role === "api")
        return 8;
    // Local dev / single combined server (workers + API on one process).
    return 30;
}
/** Per-query timeout applied on each new pool connection (ms). */
export function resolveStatementTimeoutMs() {
    const raw = process.env.DB_STATEMENT_TIMEOUT_MS?.trim();
    if (!raw)
        return 30_000;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0)
        return 30_000;
    return Math.floor(n);
}
