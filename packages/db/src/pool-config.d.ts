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
export declare function resolveDatabaseUrl(): string;
export declare function resolvePoolMax(): number;
