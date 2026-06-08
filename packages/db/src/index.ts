import { env } from "@npanel/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";
import { resolveDatabaseUrl, resolvePoolMax, resolveStatementTimeoutMs } from "./pool-config";
export { evaluatePoolHealth, type PoolHealthEvaluation } from "./pool-health";

/**
 * Postgres pool sized per service role (see pool-config.ts).
 *
 * The Nisc Cloud email marketing dispatcher runs on the workers service with a
 * larger pool. API traffic uses a smaller pool so Cloud Run horizontal scaling
 * does not exhaust Postgres max_connections.
 */
const poolMax = resolvePoolMax();

const statementTimeoutMs = resolveStatementTimeoutMs();

const pool = new Pool({
  connectionString: resolveDatabaseUrl() || env.DATABASE_URL,
  max: poolMax,
  // Idle clients are reaped so zombie connections holding resources (e.g. the
  // old session-based advisory lock) don't linger across deploys.
  idleTimeoutMillis: 30_000,
  // Fail fast rather than hang forever if the DB is unreachable.
  connectionTimeoutMillis: 10_000,
  // Make sure failed connection attempts don't leak into outstanding queries.
  allowExitOnIdle: false,
});

pool.on("connect", (client) => {
  void client.query(`SET statement_timeout = ${statementTimeoutMs}`).catch((err) => {
    console.error("[db] Failed to set statement_timeout:", err);
  });
});

export const db = drizzle(pool, { schema });

export type PoolMetrics = {
  max: number;
  total: number;
  idle: number;
  waiting: number;
  usingPooler: boolean;
  serviceRole: string | null;
};

/** Live connection-pool stats for health checks and monitoring. */
export function getPoolMetrics(): PoolMetrics {
  return {
    max: poolMax,
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    usingPooler: Boolean(process.env.DATABASE_POOLER_URL?.trim()),
    serviceRole: process.env.NPANEL_SERVICE_ROLE?.trim() ?? null,
  };
}

// Re-export all drizzle-orm operators so consumers import from "@npanel/db"
// instead of "drizzle-orm" directly. This ensures TypeScript resolves both the
// db/schema types and the query operators through the same module-resolution
// path, eliminating the dual-instance "separate declarations of 'shouldInlineParams'"
// error that occurs with moduleResolution: "bundler" + workspace packages.
export * from "drizzle-orm";
