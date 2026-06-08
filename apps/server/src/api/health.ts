import { Context } from "hono";
import { db, evaluatePoolHealth, getPoolMetrics, sql } from "@npanel/db";

let lastHealthCheck: {
  timestamp: number;
  result: {
    status: string;
    database: string;
    pool: ReturnType<typeof getPoolMetrics>;
  };
} | null = null;

const HEALTH_CHECK_CACHE_MS = 5000;

/**
 * Server health check endpoint
 */
export async function handleHealth(c: Context) {
  const now = Date.now();
  
  if (lastHealthCheck && now - lastHealthCheck.timestamp < HEALTH_CHECK_CACHE_MS) {
    return c.json({
      ...lastHealthCheck.result,
      timestamp: new Date().toISOString(),
      cached: true,
      environment: process.env.NODE_ENV,
    });
  }

  try {
    // Basic database connectivity check
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database query timeout")), 3000)
      ),
    ]);

    const pool = getPoolMetrics();
    const poolHealth = evaluatePoolHealth(pool);
    const result = {
      status: poolHealth.degraded ? "degraded" : "healthy",
      database: "connected",
      pool,
      poolWarnings: poolHealth.warnings,
      serviceRole: pool.serviceRole,
    };

    lastHealthCheck = {
      timestamp: now,
      result,
    };

    return c.json({
      ...result,
      timestamp: new Date().toISOString(),
      cached: false,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    lastHealthCheck = null;
    return c.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      pool: getPoolMetrics(),
      error: error instanceof Error ? error.message : "Unknown error",
      environment: process.env.NODE_ENV,
    }, 503);
  }
}
