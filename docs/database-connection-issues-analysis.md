# Database Connection Exhaustion - Root Cause Analysis

This document identifies all potential causes of the "too many database connections" error in the application.

## Critical Issues

### 1. **No Next.js Singleton Pattern for Prisma Client**

**Location:** `packages/db/src/index.ts`

**Problem:**
```typescript
import { PrismaClient } from "../prisma/generated/client";
const prisma = new PrismaClient();
export default prisma;
```

**Why This Causes Issues:**
- In Next.js development mode, hot module reloading (HMR) can create multiple instances of the Prisma client
- Each serverless function/route handler might create a new instance if modules are re-evaluated
- Next.js can create separate module instances for different compilation contexts (SSR, API routes, middleware)
- No global singleton pattern to ensure only ONE instance exists across the entire application lifecycle

**Impact:** HIGH - This is likely the primary cause of connection exhaustion in development

---

### 2. **No Connection Pool Configuration**

**Location:** `packages/db/src/index.ts` and `packages/db/prisma/schema/schema.prisma`

**Problem:**
- Prisma client is instantiated without any connection pool configuration
- No `connection_limit` in DATABASE_URL
- No `pool_timeout` configuration
- No `connect_timeout` settings
- Default Prisma connection pool size might be too large for your database limits

**Why This Causes Issues:**
- Prisma defaults to creating many connections (typically 10+ connections per client instance)
- With multiple Prisma client instances (see issue #1), you could have 50+ connections open
- PostgreSQL has a default `max_connections` of 100, which can be exhausted quickly
- No explicit limits means connections can grow unbounded

**Impact:** HIGH - Combined with multiple instances, this quickly exhausts connections

---

### 3. **Multiple Sequential Database Queries in Auth Hooks**

**Location:** `packages/auth/src/index.ts` (lines 35-201)

**Problem:**
The auth hooks make multiple sequential database queries:

1. **Before hook (lines 40-66):**
   - `prisma.user.findUnique()` - Check user status
   - `prisma.userActivityLog.create()` - Log blocked login

2. **After hook - get-session (lines 74-96):**
   - `prisma.user.findUnique()` - Fetch complete user data with role

3. **After hook - sign-in (lines 99-139):**
   - `prisma.session.update()` - Update session expiration
   - `prisma.user.update()` - Update last login time
   - `prisma.userActivityLog.create()` - Log successful login

4. **After hook - sign-up (lines 146-160):**
   - `prisma.userActivityLog.create()` - Log signup

5. **After hook - sign-out (lines 168-178):**
   - `prisma.userActivityLog.create()` - Log logout

6. **After hook - verify-email (lines 186-199):**
   - `prisma.userActivityLog.create()` - Log email verification

**Why This Causes Issues:**
- Each auth operation (login, session check, logout) triggers 2-3 database queries
- These queries happen on EVERY request that checks authentication
- Each query potentially opens a new connection if the pool is exhausted
- No batching or transaction wrapping for related operations
- Activity logging creates additional connections that could be deferred

**Impact:** HIGH - Auth operations happen on every request, multiplying connection usage

---

### 4. **Server Components Making Multiple Direct DB Calls**

**Location:** `apps/npanel/src/lib/auth-server.ts`

**Problem:**
The `verifyTeamAccess()` and `ensureCustomerHasTeam()` functions make multiple sequential queries:

**verifyTeamAccess() (lines 213-265):**
1. `prisma.team.findUnique()` - Find team by slug
2. `prisma.teamMember.findUnique()` - Check membership
3. `prisma.user.update()` - Update lastAccessedTeamId
4. `prisma.userActivityLog.create()` - Log team switch

**ensureCustomerHasTeam() (lines 286-361):**
1. `prisma.teamMember.findFirst()` - Check if team still exists
2. `prisma.teamMember.findMany()` - Find all user teams
3. `prisma.user.update()` - Update lastAccessedTeamId
4. `prisma.userActivityLog.create()` - Log team access

**Why This Causes Issues:**
- These functions are called on every page load for customer users
- Each function makes 2-4 sequential database queries
- No transaction batching, so each query might use a separate connection
- Activity logging happens synchronously, blocking and holding connections

**Impact:** MEDIUM-HIGH - Called frequently on page navigation

---

### 5. **Health Check Endpoint Making DB Queries**

**Location:** `apps/npanel/src/app/api/health/route.ts`

**Problem:**
```typescript
await prisma.$queryRaw`SELECT 1`;
```

**Why This Causes Issues:**
- Health check endpoints are often called frequently by monitoring systems
- Each call opens a database connection
- If health checks are called every few seconds, connections accumulate
- No caching or rate limiting on health checks

**Impact:** MEDIUM - Depends on monitoring frequency

---

### 6. **Multiple Database Queries in tRPC Routers**

**Location:** Multiple files in `packages/api/src/routers/`

**Problem:**
Many tRPC routers make multiple sequential queries without batching:

**Examples:**
- `invoicing/index.ts` - Makes queries for invoices, counts, user roles, team access checks
- `orders.ts` - Multiple queries for plans, teams, provisioning
- `teams.ts` - Multiple queries for team members, permissions
- `clients.ts` - Multiple queries for client data and roles

**Why This Causes Issues:**
- Each tRPC procedure might make 3-5+ database queries
- No query batching or optimization
- Some queries are repeated across different procedures
- User role checks happen repeatedly instead of being cached in context

**Impact:** MEDIUM - Each API call multiplies connection usage

---

### 7. **Long-Running Transactions**

**Location:** Multiple files using `prisma.$transaction()`

**Files with transactions:**
- `packages/api/src/routers/team-billing.ts` (2 transactions)
- `packages/api/src/routers/invoicing/index.ts` (9 transactions)
- `packages/api/src/routers/orders.ts` (1 transaction)
- `packages/api/src/routers/teams.ts` (2 transactions)

**Problem:**
- Transactions hold database connections for their entire duration
- If a transaction takes time (e.g., waiting for external API calls), the connection is held
- Nested transactions or transactions with external API calls can hold connections for seconds
- Example in `orders.ts` line 1122: Transaction includes Plesk API calls which could take time

**Why This Causes Issues:**
- Each transaction holds a connection until completion
- If transactions are slow (external API calls, complex operations), connections are held longer
- Multiple concurrent transactions = multiple held connections
- No timeout configuration on transactions

**Impact:** MEDIUM - Depends on transaction duration and concurrency

---

### 8. **No Connection Cleanup on Shutdown**

**Location:** Entire application

**Problem:**
- No `prisma.$disconnect()` calls anywhere in the application
- No graceful shutdown handlers
- Connections remain open when server restarts or functions terminate
- Next.js serverless functions might not properly clean up connections

**Why This Causes Issues:**
- Connections can linger after function execution
- In serverless environments, old connections might not be cleaned up
- Database might not immediately close idle connections
- Accumulated connections from previous function invocations

**Impact:** MEDIUM - More of an issue in serverless/production environments

---

### 9. **Middleware Making Session Checks**

**Location:** `apps/npanel/src/middleware.ts`

**Problem:**
- Middleware calls `isSessionValid()` which makes an internal fetch to `/api/auth/get-session`
- This triggers the auth system which makes database queries (see issue #3)
- Middleware runs on EVERY request matching the matcher pattern
- Even though it's using fetch, it still triggers database connections

**Why This Causes Issues:**
- Middleware runs before every page load and API call
- Each middleware execution can trigger database queries
- With many concurrent requests, this multiplies connection usage
- No caching of session checks in middleware

**Impact:** MEDIUM - Runs frequently but uses fetch (less direct than server components)

---

### 10. **Direct Prisma Imports Across Many Files**

**Location:** 17+ files importing `prisma from "@npanel/db"`

**Files:**
- `packages/api/src/routers/*` (13+ router files)
- `packages/auth/src/index.ts`
- `apps/npanel/src/lib/auth-server.ts`
- `apps/npanel/src/app/api/health/route.ts`
- `apps/npanel/src/app/api/auth/request-password-reset/route.ts`

**Problem:**
- Each import creates a reference to the Prisma client
- If the singleton pattern fails (see issue #1), each file might get a different instance
- No centralized connection management
- Difficult to monitor or limit connection usage

**Why This Causes Issues:**
- If singleton fails, 17+ instances could be created
- Each instance creates its own connection pool
- No way to track total connection usage
- No centralized connection pooling strategy

**Impact:** HIGH - Amplifies issue #1 if singleton pattern fails

---

### 11. **No Connection Pool Monitoring or Limits**

**Location:** Entire application

**Problem:**
- No logging of connection pool usage
- No monitoring of active connections
- No alerts when connections approach limits
- No connection pool metrics

**Why This Causes Issues:**
- Can't identify when connections are being exhausted
- No visibility into which operations use most connections
- Can't proactively prevent connection exhaustion
- Difficult to debug connection issues

**Impact:** LOW - Doesn't cause issues but makes debugging impossible

---

### 12. **Potential Race Conditions in Concurrent Requests**

**Location:** Multiple locations with user updates

**Problem:**
- `auth-server.ts` updates `lastAccessedTeamId` on every team access
- Multiple concurrent requests might trigger the same updates
- No locking or idempotency checks
- Each update holds a connection

**Why This Causes Issues:**
- Concurrent requests can trigger duplicate database operations
- Each operation holds a connection
- Race conditions might cause retries, multiplying connection usage

**Impact:** LOW-MEDIUM - Depends on traffic patterns

---

### 13. **Better Auth Adapter Using Same Prisma Instance**

**Location:** `packages/auth/src/index.ts` line 21

**Problem:**
```typescript
database: prismaAdapter(prisma, {
  provider: "postgresql",
}),
```

**Why This Causes Issues:**
- Better Auth internally uses the Prisma client for session management
- Every auth operation (login, logout, session check) uses the same Prisma instance
- Better Auth might create additional connections internally
- Combined with auth hooks (issue #3), this doubles connection usage

**Impact:** MEDIUM - Adds to connection usage from auth operations

---

### 14. **No Query Result Caching**

**Location:** Entire application

**Problem:**
- User role lookups happen repeatedly
- Team membership checks are repeated
- Session data is fetched multiple times per request
- No caching layer (Redis, in-memory cache)

**Why This Causes Issues:**
- Repeated queries for the same data use multiple connections
- Could be cached to reduce database load
- Especially problematic for frequently accessed data (user roles, permissions)

**Impact:** LOW-MEDIUM - Reduces efficiency but doesn't directly cause connection exhaustion

---

### 15. **Development-Specific Issues**

**Problem:**
- Next.js Fast Refresh in development can cause module re-evaluation
- Hot Module Replacement (HMR) might not properly clean up Prisma instances
- Development server restarts might leave connections open
- Multiple dev servers (if running) would create separate instances

**Why This Causes Issues:**
- Development environment is more prone to connection leaks
- HMR can create duplicate instances
- Dev server restarts might not clean up properly
- If running multiple dev processes, each creates its own connection pool

**Impact:** HIGH in development, LOW in production (if production uses different patterns)

---

## Summary of Root Causes (Priority Order)

1. **CRITICAL:** No Next.js singleton pattern - Multiple Prisma instances
2. **CRITICAL:** No connection pool configuration - Unbounded connection creation
3. **HIGH:** Multiple sequential queries in auth hooks - 2-3 queries per auth operation
4. **HIGH:** Direct Prisma imports in 17+ files - Amplifies singleton issue
5. **MEDIUM-HIGH:** Server components making multiple DB calls - 2-4 queries per page load
6. **MEDIUM:** Long-running transactions - Hold connections during external API calls
7. **MEDIUM:** Health check endpoint - Frequent DB queries
8. **MEDIUM:** tRPC routers making multiple queries - No query batching
9. **MEDIUM:** Better Auth adapter - Additional connection usage
10. **MEDIUM:** Middleware session checks - Trigger DB queries on every request
11. **LOW-MEDIUM:** No connection cleanup - Connections linger
12. **LOW:** No connection monitoring - Can't debug issues
13. **LOW:** No query caching - Inefficient but not directly causing exhaustion

---

## Recommended Solutions (Not Implemented - Analysis Only)

### Immediate Fixes (High Priority)

1. **Implement Next.js Singleton Pattern**
   - Use global singleton with proper cleanup
   - Handle Next.js dev mode HMR correctly
   - Ensure single instance across all modules

2. **Configure Connection Pool**
   - Set `connection_limit` in DATABASE_URL
   - Configure `pool_timeout` and `connect_timeout`
   - Set appropriate pool size (e.g., 5-10 connections per instance)

3. **Batch Auth Hook Queries**
   - Combine multiple queries into transactions
   - Defer activity logging (use queue or batch)
   - Cache user data in session to avoid repeated queries

4. **Optimize Server Components**
   - Batch database queries in `auth-server.ts`
   - Use transactions for related operations
   - Cache team membership checks

### Medium Priority Fixes

5. **Optimize tRPC Routers**
   - Batch related queries
   - Cache user role lookups in context
   - Use `$transaction` for related operations

6. **Add Connection Cleanup**
   - Implement graceful shutdown handlers
   - Call `prisma.$disconnect()` on shutdown
   - Handle serverless function cleanup

7. **Optimize Health Check**
   - Cache health check results
   - Rate limit health check endpoint
   - Consider removing DB query from health check

8. **Add Connection Monitoring**
   - Log connection pool metrics
   - Monitor active connections
   - Alert on high connection usage

### Low Priority Improvements

9. **Add Query Caching**
   - Cache user roles and permissions
   - Cache team membership data
   - Use Redis or in-memory cache

10. **Optimize Transactions**
    - Avoid external API calls inside transactions
    - Set transaction timeouts
    - Break large transactions into smaller ones

---

## Connection Usage Estimate

**Current Worst-Case Scenario:**
- 5 Prisma instances (if singleton fails) × 10 connections each = **50 connections**
- Auth operations: 3 queries × 10 concurrent requests = **30 connections**
- Server components: 4 queries × 5 concurrent page loads = **20 connections**
- tRPC routers: 3 queries × 10 concurrent API calls = **30 connections**
- Health checks: 1 query × 5 checks = **5 connections**

**Total: ~135 connections** (exceeds typical PostgreSQL limit of 100)

**In Production:**
- With proper singleton: 1 instance × 10 connections = **10 connections**
- But still vulnerable to:
  - High concurrency (multiple requests)
  - Long-running transactions
  - Auth query multiplication
  - No connection limits

---

## Conclusion

The primary causes are:
1. **No singleton pattern** allowing multiple Prisma instances
2. **No connection pool limits** allowing unbounded connection creation
3. **Multiple sequential queries** in auth hooks and server components
4. **No query batching** causing connection multiplication

These issues compound each other, especially in development with HMR, but will also affect production under load.


Critical issues found
No Next.js singleton pattern (packages/db/src/index.ts)
Module-level Prisma instance can spawn multiple instances in dev via HMR
Each instance creates its own connection pool (default ~10 connections)
With 5+ instances, you can quickly exceed connection limits
No connection pool configuration
No connection_limit, pool_timeout, or connect_timeout in DATABASE_URL
Unbounded connection creation
Default Prisma pool can create too many connections
Multiple sequential queries in auth hooks (packages/auth/src/index.ts)
Each auth operation (login, session check, logout) runs 2-3 sequential queries
Auth hooks run on many requests, multiplying connection usage
No batching or transaction wrapping
Server components making multiple DB calls (apps/npanel/src/lib/auth-server.ts)
verifyTeamAccess() and ensureCustomerHasTeam() each run 2-4 sequential queries
Called on many customer page loads
No query batching
Direct Prisma imports in 17+ files
13+ router files, auth, server components, API routes
If the singleton fails, each import could get a separate instance
Amplifies the singleton issue
Other issues
Long-running transactions holding connections
Health check endpoint making DB queries
tRPC routers making multiple sequential queries
No connection cleanup on shutdown
Middleware triggering session checks (DB queries)
Connection usage estimate
Worst case in development:
5 Prisma instances × 10 connections = 50 connections
Auth operations: 30+ connections
Server components: 20+ connections
tRPC routers: 30+ connections
Total: ~135 connections (exceeds typical PostgreSQL limit of 100)

Implement Next.js singleton pattern for Prisma
Configure connection pool limits in DATABASE_URL
Batch auth hook queries (use transactions)
Optimize server component queries (batch operations)
Analysis is complete and ready for review. This is theoretical analysis; no code changes were made. Should I continue by outlining fixes or reviewing specific areas?
