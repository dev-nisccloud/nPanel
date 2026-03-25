# Database Connection Pool Configuration

This document explains how to configure Prisma connection pooling to prevent database connection exhaustion.

## Problem

By default, Prisma creates a connection pool with ~10 connections per client instance. Without proper configuration:
- Multiple Prisma instances can exhaust database connection limits
- No limits on connection pool size
- Connections can accumulate and not be properly released

## Solution: Configure Connection Pool in DATABASE_URL

Add connection pool parameters to your `DATABASE_URL` environment variable:

### PostgreSQL Connection Pool Parameters

```bash
# Example DATABASE_URL with connection pool configuration
DATABASE_URL="postgresql://user:password@host:5432/database?connection_limit=5&pool_timeout=20&connect_timeout=10"
```

### Parameters Explained

1. **`connection_limit`** (recommended: 5-10)
   - Maximum number of connections in the pool
   - Default: ~10 per Prisma instance
   - **Recommended**: 5-10 for most applications
   - Lower values reduce connection usage but may limit concurrency
   - With singleton pattern, 5-10 connections should be sufficient

2. **`pool_timeout`** (recommended: 20)
   - Timeout in seconds for getting a connection from the pool
   - Default: 10 seconds
   - **Recommended**: 20 seconds
   - If all connections are busy, wait up to this time before erroring

3. **`connect_timeout`** (recommended: 10)
   - Timeout in seconds for establishing a new connection
   - Default: 5 seconds
   - **Recommended**: 10 seconds
   - How long to wait when connecting to the database

### Example Configuration

For a typical Next.js application with singleton Prisma client:

```bash
# Development
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?connection_limit=5&pool_timeout=20&connect_timeout=10"

# Production (with connection pooling service like PgBouncer)
DATABASE_URL="postgresql://user:password@host:5432/database?connection_limit=10&pool_timeout=20&connect_timeout=10"
```

## Connection Pool Size Guidelines

### Small Application (< 100 concurrent users)
- `connection_limit=5`
- Single Prisma instance (singleton pattern)

### Medium Application (100-1000 concurrent users)
- `connection_limit=10`
- Single Prisma instance (singleton pattern)
- Consider using PgBouncer for connection pooling

### Large Application (> 1000 concurrent users)
- `connection_limit=10-20` per instance
- Use PgBouncer or similar connection pooler
- Multiple application instances with proper load balancing

## Important Notes

1. **Singleton Pattern Required**: The singleton pattern in `packages/db/src/index.ts` ensures only ONE Prisma instance exists. Without it, each instance creates its own pool, multiplying connection usage.

2. **Database Limits**: PostgreSQL default `max_connections` is 100. With proper configuration:
   - 1 Prisma instance × 10 connections = 10 connections
   - Leaves 90 connections for other services

3. **Production Recommendations**:
   - Use a connection pooler like PgBouncer for better connection management
   - Monitor connection usage
   - Set appropriate `connection_limit` based on your database's `max_connections`

4. **Development**: Lower limits (5 connections) are fine for development to catch connection issues early.

## Verification

After configuring, you can verify connection pool settings:

```typescript
// Check active connections (PostgreSQL)
const result = await prisma.$queryRaw`
  SELECT count(*) as active_connections 
  FROM pg_stat_activity 
  WHERE datname = current_database()
`;
```

## Additional Resources

- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [PgBouncer Documentation](https://www.pgbouncer.org/)
