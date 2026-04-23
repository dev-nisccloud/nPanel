import { env } from "@npanel/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

/**
 * Postgres pool sized for the dispatcher + normal API traffic.
 *
 * The NISC email marketing dispatcher can issue 2 writes per email at ~14 emails/s,
 * plus claim queries, campaign fetches and bookkeeping updates, all concurrently
 * with regular tRPC traffic and other workers. With the `pg` default `max: 10`
 * the pool saturates and individual writes start timing out — which, combined
 * with the dispatcher's SES-send-then-write ordering, can produce duplicate sends.
 *
 * Override with DB_POOL_MAX if your Postgres instance has a different
 * `max_connections` budget. Keep this comfortably below that value.
 */
function parsePoolMax(): number {
  const raw = process.env.DB_POOL_MAX;
  if (!raw) return 30;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 30;
  return Math.floor(n);
}

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: parsePoolMax(),
  // Idle clients are reaped so zombie connections holding resources (e.g. the
  // old session-based advisory lock) don't linger across deploys.
  idleTimeoutMillis: 30_000,
  // Fail fast rather than hang forever if the DB is unreachable.
  connectionTimeoutMillis: 10_000,
  // Make sure failed connection attempts don't leak into outstanding queries.
  allowExitOnIdle: false,
});

export const db = drizzle(pool, { schema });

// Re-export all drizzle-orm operators so consumers import from "@npanel/db"
// instead of "drizzle-orm" directly. This ensures TypeScript resolves both the
// db/schema types and the query operators through the same module-resolution
// path, eliminating the dual-instance "separate declarations of 'shouldInlineParams'"
// error that occurs with moduleResolution: "bundler" + workspace packages.
export * from "drizzle-orm";
