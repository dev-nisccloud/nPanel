import prisma, { getConnectionPoolMetrics } from "@npanel/db";


// Cache health check results to reduce database connection usage
// Health checks are often called frequently by monitoring systems
let lastHealthCheck: {
  timestamp: number;
  result: { status: string; database: string };
} | null = null;

const HEALTH_CHECK_CACHE_MS = 5000; // Cache for 5 seconds

export async function GET() {
  const now = Date.now();
  
  // Return cached result if available and still fresh
  if (
    lastHealthCheck &&
    now - lastHealthCheck.timestamp < HEALTH_CHECK_CACHE_MS
  ) {
    return Response.json(
      {
        ...lastHealthCheck.result,
        timestamp: new Date().toISOString(),
        cached: true,
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    );
  }

  try {
    // Check database connectivity with timeout
    // Use a simple query that doesn't hold connections long
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database query timeout")), 3000)
      ),
    ]);

    // Get connection pool metrics (non-blocking, don't fail if it errors)
    let connectionPoolMetrics = null;
    try {
      connectionPoolMetrics = await getConnectionPoolMetrics();
    } catch (error) {
      // Ignore errors in metrics collection, don't fail health check
      console.warn("[Health Check] Failed to get connection pool metrics:", error);
    }

    const result = {
      status: "healthy",
      database: "connected",
    };

    // Cache the successful result
    lastHealthCheck = {
      timestamp: now,
      result,
    };

    return Response.json(
      {
        ...result,
        timestamp: new Date().toISOString(),
        cached: false,
        environment: process.env.NODE_ENV,
        ...(connectionPoolMetrics && {
          connectionPool: {
            activeConnections: connectionPoolMetrics.activeConnections,
            connectionLimit: connectionPoolMetrics.connectionLimit,
            utilizationPercent: connectionPoolMetrics.utilizationPercent,
            isHealthy: connectionPoolMetrics.isHealthy,
          },
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    // Don't cache errors - always check on next request
    lastHealthCheck = null;

    // Log error in production for monitoring
    if (process.env.NODE_ENV === "production") {
      // Use proper logging service here (e.g., Sentry, LogRocket)
      console.error("[Health Check] Database connection error:", error);
    }

    return Response.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        cached: false,
        environment: process.env.NODE_ENV,
      },
      { status: 503 }
    );
  }
}

