# @nPanel/db

Database package for nPanel using Prisma ORM with PostgreSQL.

## Features

- ✅ **Singleton Pattern**: Prevents multiple Prisma instances (critical for connection management)
- ✅ **Connection Pool Configuration**: Validates and monitors connection pool settings
- ✅ **Graceful Shutdown**: Properly closes connections on application exit
- ✅ **Connection Monitoring**: Utilities for monitoring connection pool health

## Quick Start

```typescript
import prisma from "@nPanel/db";

// Use Prisma client
const users = await prisma.user.findMany();
```

## Connection Pool Configuration

**⚠️ IMPORTANT**: Configure connection pool parameters in your `DATABASE_URL` environment variable to prevent connection exhaustion.

### Recommended Configuration

```bash
# Development
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?connection_limit=5&pool_timeout=20&connect_timeout=10"

# Production
DATABASE_URL="postgresql://user:password@host:5432/database?connection_limit=10&pool_timeout=20&connect_timeout=10"
```

### Parameters

- `connection_limit`: Maximum connections in pool (recommended: 5-10)
- `pool_timeout`: Timeout for getting connection from pool (recommended: 20s)
- `connect_timeout`: Timeout for establishing connection (recommended: 10s)

See [CONNECTION_POOL_CONFIG.md](./CONNECTION_POOL_CONFIG.md) for detailed configuration guide.

## Connection Pool Utilities

### Validate Configuration

The Prisma client automatically validates connection pool configuration on startup and logs warnings if configuration is missing or incorrect.

### Monitor Connection Pool

```typescript
import { getConnectionPoolMetrics, logConnectionPoolMetrics } from "@nPanel/db";

// Get current metrics
const metrics = await getConnectionPoolMetrics();
console.log(`Active connections: ${metrics.activeConnections}`);
console.log(`Pool utilization: ${metrics.utilizationPercent}%`);
console.log(`Is healthy: ${metrics.isHealthy}`);

// Log metrics to console
await logConnectionPoolMetrics();
```

### Check Pool Health

```typescript
import { isConnectionPoolHealthy } from "@nPanel/db";

const isHealthy = await isConnectionPoolHealthy(80); // 80% threshold
if (!isHealthy) {
  console.warn("Connection pool utilization is high!");
}
```

### Parse and Validate DATABASE_URL

```typescript
import { parseDatabaseUrl, validateConnectionPoolConfig } from "@nPanel/db";

const databaseUrl = process.env.DATABASE_URL;
const parsed = parseDatabaseUrl(databaseUrl);
const validation = validateConnectionPoolConfig(parsed);

if (!validation.isValid) {
  console.warn("Connection pool configuration issues:", validation.warnings);
  console.log("Recommendations:", validation.recommendations);
}
```

## Development

### Prisma Commands

All Prisma commands should be run from the web workspace:

```bash
# Push schema changes
pnpm run db:push

# Open Prisma Studio
pnpm run db:studio

# Generate Prisma client
pnpm run db:generate

# Run migrations
pnpm run db:migrate
```

## Architecture

### Singleton Pattern

The Prisma client uses a singleton pattern to ensure only one instance exists:

- **Development**: Uses `globalThis` to persist across HMR (Hot Module Replacement)
- **Production**: Module-level singleton
- Prevents multiple connection pools from being created

### Connection Cleanup

Automatic graceful shutdown handlers ensure connections are properly closed:

- `beforeExit`
- `SIGINT` (Ctrl+C)
- `SIGTERM` (termination)
- `SIGUSR2` (Nodemon restart)
- `uncaughtException`
- `unhandledRejection`

## Troubleshooting

### Connection Exhaustion

If you see "too many database connections" errors:

1. **Check connection pool configuration**: Ensure `DATABASE_URL` includes `connection_limit` parameter
2. **Verify singleton pattern**: Only one Prisma instance should exist
3. **Monitor connections**: Use `getConnectionPoolMetrics()` to check current usage
4. **Review query patterns**: Ensure queries are batched and transactions are optimized

### Configuration Warnings

On startup, if connection pool configuration is missing, you'll see warnings with recommendations. Follow the recommendations to configure your `DATABASE_URL`.

## Related Documentation

- [Connection Pool Configuration Guide](./CONNECTION_POOL_CONFIG.md)
- [Database Optimization Implementation](../../docs/database-optimization-implemented.md)
- [Database Connection Issues Analysis](../../docs/database-connection-issues-analysis.md)
