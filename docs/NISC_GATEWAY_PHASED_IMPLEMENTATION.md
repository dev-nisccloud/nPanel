# Nisc Payment Gateway - Phased Implementation

## Overview

**Phase 1 (NOW)**: Core gateway + usage tracking  
**Phase 2 (LATER)**: Billing tiers + quota enforcement  

This approach lets you:
- ✅ Launch gateway immediately
- ✅ Collect usage data from day 1
- ✅ Decide on pricing later with real usage data
- ✅ Add billing without disrupting service

---

## Phase 1: Core Gateway (Implement Now)

### What to Build

#### 1. Database Tables (7 tables)

```typescript
✅ nisc_gateway_merchant
✅ nisc_gateway_merchant_credentials
✅ nisc_gateway_api_key
✅ nisc_gateway_transaction
✅ nisc_gateway_webhook_log
✅ nisc_gateway_request_log (detailed)
✅ nisc_gateway_access_log (aggregated - START COLLECTING!)

❌ nisc_gateway_merchant_quota (DEFER to Phase 2)
```

#### 2. Core Features

```typescript
✅ API key authentication (merchantId from key)
✅ Credential encryption (AES-256-GCM)
✅ Payment initiation (M-Pesa STK Push)
✅ Webhook forwarding to merchants
✅ Request logging (detailed + aggregated)
✅ Per-key rate limiting (100/min)

❌ Quota enforcement (DEFER to Phase 2)
❌ Billing calculations (DEFER to Phase 2)
❌ Usage alerts (DEFER to Phase 2)
```

#### 3. Logging (CRITICAL - Start Now)

**Request Logs** (Detailed):
```typescript
// Log every request with full details
{
  merchantId,
  apiKeyId,
  endpoint,
  method,
  requestHeaders,    // sanitized
  requestBody,       // sanitized
  responseBody,      // sanitized
  statusCode,
  duration,
  timestamp,
  // ... full debugging info
}
```

**Access Logs** (Aggregated):
```typescript
// Aggregate by hour for fast queries
{
  merchantId,
  year, month, day, hour,
  
  totalRequests: 450,           // All requests
  successfulRequests: 445,      // 2xx
  failedRequests: 5,            // 4xx, 5xx
  
  paymentCreateRequests: 45,    // POST /payments
  paymentReadRequests: 350,     // GET /payments/:id
  paymentListRequests: 50,      // GET /payments
  
  billableRequests: 45,         // Successful payment creations
  
  // Ready for billing when you add it!
}
```

**Why start collecting now**:
- When you add billing, you'll have historical data
- You can analyze actual usage to set fair pricing
- No performance impact (async, aggregated)

---

## Phase 2: Billing & Quotas (Add Later)

### When to Implement

Add Phase 2 when:
- ✅ You've collected 2-3 months of usage data
- ✅ You've analyzed usage patterns
- ✅ You've decided on pricing tiers
- ✅ You're ready to monetize

### What to Add

#### 1. Database Table

```typescript
✅ nisc_gateway_merchant_quota

{
  merchantId,
  
  // Billing tier
  billingTier: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE',
  
  // Limits
  monthlyRequestLimit: 10000,
  monthlyBillableLimit: 1000,
  
  // Current usage (reset monthly)
  currentPeriodRequests: 1250,
  currentPeriodBillable: 125,
  
  // Hard limits
  hardLimitEnabled: true,
  quotaExceeded: false,
  
  // Soft limits (warnings)
  softLimitEnabled: true,
  softLimitThreshold: 8000,  // 80%
  
  // Overage
  overageEnabled: true,
  overageFeePerRequest: 0.01,
}
```

#### 2. New Features

```typescript
✅ Quota enforcement middleware
   - Check before each request
   - Block if quotaExceeded = true
   - Return 402 Payment Required

✅ Billing calculation
   - Monthly bill = base + overage
   - Query access_log (fast!)
   - Generate invoices

✅ Usage alerts
   - Email at 80% (soft limit)
   - Email at 100% (hard limit)
   - Monthly invoice email

✅ Quota reset
   - Cron job on 1st of month
   - Reset currentPeriodRequests to 0

✅ Dashboard updates
   - Show usage vs. limit
   - Show estimated bill
   - Upgrade plan button
```

---

## Implementation Guide

### Step 1: Phase 1 (NOW)

```bash
# 1. Create database schema (7 tables)
bun run db:generate

# 2. Create encryption utility
touch packages/api/src/lib/gateway-encryption.ts

# 3. Create access log aggregator
touch packages/api/src/lib/gateway-access-log.ts

# 4. Create middlewares
touch apps/server/src/middleware/gateway-auth.ts
touch apps/server/src/middleware/gateway-request-logger.ts

# 5. Create tRPC routers
touch packages/api/src/routers/nisc-gateway/merchants.ts
touch packages/api/src/routers/nisc-gateway/credentials.ts
touch packages/api/src/routers/nisc-gateway/api-keys.ts
touch packages/api/src/routers/nisc-gateway/transactions.ts
touch packages/api/src/routers/nisc-gateway/logs.ts

# 6. Create public REST API
touch apps/server/src/api/gateway/payments.ts
touch apps/server/src/api/gateway/webhooks.ts

# 7. Test end-to-end
# - Create merchant
# - Set M-Pesa credentials
# - Generate API key
# - Make test payment
# - Check logs collected
```

### Step 2: Monitor Usage (2-3 Months)

```sql
-- Check total usage across all merchants
SELECT 
  COUNT(DISTINCT merchant_id) as total_merchants,
  SUM(total_requests) as total_requests,
  SUM(billable_requests) as total_billable,
  AVG(billable_requests) as avg_billable_per_merchant
FROM nisc_gateway_access_log
WHERE year = 2026 AND month = 7;

-- Find heavy users
SELECT 
  merchant_id,
  SUM(total_requests) as total,
  SUM(billable_requests) as billable
FROM nisc_gateway_access_log
WHERE year = 2026 AND month = 7
GROUP BY merchant_id
ORDER BY total DESC
LIMIT 10;

-- Usage distribution
SELECT 
  CASE 
    WHEN billable < 100 THEN '0-100'
    WHEN billable < 1000 THEN '100-1K'
    WHEN billable < 10000 THEN '1K-10K'
    ELSE '10K+'
  END as bucket,
  COUNT(*) as merchant_count
FROM (
  SELECT merchant_id, SUM(billable_requests) as billable
  FROM nisc_gateway_access_log
  WHERE year = 2026 AND month = 7
  GROUP BY merchant_id
) t
GROUP BY bucket
ORDER BY bucket;
```

### Step 3: Decide Pricing

Based on usage data:

**Example findings**:
```
80% of merchants: < 1,000 billable/month
15% of merchants: 1,000-10,000 billable/month
4% of merchants: 10,000-100,000 billable/month
1% of merchants: > 100,000 billable/month
```

**Resulting tiers**:
```
FREE: 1,000 billable/month (covers 80%)
STARTER: 10,000 billable/month (covers next 15%)
BUSINESS: 100,000 billable/month (covers next 4%)
ENTERPRISE: Unlimited (for top 1%)
```

### Step 4: Phase 2 (LATER)

```bash
# 1. Add merchant_quota table
# Update packages/db/src/schema/nisc-gateway.ts

# 2. Create quota middleware
touch apps/server/src/middleware/gateway-quota-check.ts

# 3. Create billing endpoints
touch packages/api/src/routers/nisc-gateway/billing.ts

# 4. Create quota reset cron
touch apps/server/src/cron/reset-gateway-quotas.ts

# 5. Migrate existing merchants to tiers
# Assign based on historical usage

# 6. Enable quota enforcement
# Update middleware to check quotas

# 7. Set up alerts
# Email at 80% and 100%
```

---

## Access Log Schema (Implement Now)

```typescript
// Table: nisc_gateway_access_log
// One row per merchant per hour (aggregated)

{
  id: string (UUID)
  merchantId: string (FK)
  apiKeyId: string (FK)
  
  // Time period (composite unique key)
  year: number        // e.g., 2026
  month: number       // e.g., 7
  day: number         // e.g., 22
  hour: number        // e.g., 14
  
  // Aggregated counts
  totalRequests: number               // All requests this hour
  successfulRequests: number          // 2xx responses
  failedRequests: number              // 4xx, 5xx responses
  
  // By endpoint type
  paymentCreateRequests: number       // POST /payments
  paymentReadRequests: number         // GET /payments/:id
  paymentListRequests: number         // GET /payments
  refundRequests: number              // POST /refunds
  
  // By status code
  status2xxCount: number
  status4xxCount: number
  status5xxCount: number
  
  // Billing metric (even though no billing yet)
  billableRequests: number            // Successful payment creations
  
  // Rate limiting
  rateLimitHits: number               // How many hit rate limit
  
  // Timestamps
  periodStart: timestamp              // Start of hour
  periodEnd: timestamp                // End of hour
  createdAt: timestamp
  updatedAt: timestamp                // For increments
}

// Composite unique index
unique_index: [merchantId, year, month, day, hour]

// Fast query indexes
index: [merchantId, year, month]      // Monthly billing
index: [merchantId, year, month, day] // Daily usage
index: [apiKeyId, year, month]        // Per-key analytics
```

---

## Aggregation Logic (Implement Now)

```typescript
// File: packages/api/src/lib/gateway-access-log.ts

export async function incrementAccessLog(params: {
  merchantId: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  success: boolean;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  
  // Categorize endpoint
  const category = categorizeEndpoint(params.endpoint, params.method);
  
  // Determine if billable (even though no billing yet)
  const isBillable = 
    category === 'payment_create' && 
    params.success;
  
  // UPSERT: increment if exists, create if not
  await db
    .insert(niscGatewayAccessLog)
    .values({
      id: crypto.randomUUID(),
      merchantId: params.merchantId,
      apiKeyId: params.apiKeyId,
      year,
      month,
      day,
      hour,
      
      // Initialize counts at 1
      totalRequests: 1,
      successfulRequests: params.success ? 1 : 0,
      failedRequests: params.success ? 0 : 1,
      
      // By endpoint
      paymentCreateRequests: category === 'payment_create' ? 1 : 0,
      paymentReadRequests: category === 'payment_read' ? 1 : 0,
      paymentListRequests: category === 'payment_list' ? 1 : 0,
      refundRequests: category === 'refund' ? 1 : 0,
      
      // By status
      status2xxCount: params.statusCode >= 200 && params.statusCode < 300 ? 1 : 0,
      status4xxCount: params.statusCode >= 400 && params.statusCode < 500 ? 1 : 0,
      status5xxCount: params.statusCode >= 500 && params.statusCode < 600 ? 1 : 0,
      
      // Billing (track now, use later)
      billableRequests: isBillable ? 1 : 0,
      
      rateLimitHits: 0,
      
      periodStart: new Date(year, month - 1, day, hour, 0, 0),
      periodEnd: new Date(year, month - 1, day, hour, 59, 59),
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        niscGatewayAccessLog.merchantId,
        niscGatewayAccessLog.year,
        niscGatewayAccessLog.month,
        niscGatewayAccessLog.day,
        niscGatewayAccessLog.hour,
      ],
      set: {
        // Increment all counters atomically
        totalRequests: sql`${niscGatewayAccessLog.totalRequests} + 1`,
        successfulRequests: params.success
          ? sql`${niscGatewayAccessLog.successfulRequests} + 1`
          : sql`${niscGatewayAccessLog.successfulRequests}`,
        failedRequests: !params.success
          ? sql`${niscGatewayAccessLog.failedRequests} + 1`
          : sql`${niscGatewayAccessLog.failedRequests}`,
        
        // Increment by category
        paymentCreateRequests: category === 'payment_create'
          ? sql`${niscGatewayAccessLog.paymentCreateRequests} + 1`
          : sql`${niscGatewayAccessLog.paymentCreateRequests}`,
        // ... similar for other categories
        
        // Billing (for future)
        billableRequests: isBillable
          ? sql`${niscGatewayAccessLog.billableRequests} + 1`
          : sql`${niscGatewayAccessLog.billableRequests}`,
        
        updatedAt: now,
      },
    });
}

function categorizeEndpoint(endpoint: string, method: string): string {
  if (endpoint === '/api/gateway/v1/payments' && method === 'POST') {
    return 'payment_create';
  }
  if (endpoint.match(/\/api\/gateway\/v1\/payments\/[^\/]+$/) && method === 'GET') {
    return 'payment_read';
  }
  if (endpoint === '/api/gateway/v1/payments' && method === 'GET') {
    return 'payment_list';
  }
  if (endpoint.includes('/refunds')) {
    return 'refund';
  }
  return 'other';
}
```

---

## Usage Queries (Available Now)

Even without billing, you can query usage:

```typescript
// Get merchant's usage for July 2026
const usage = await db
  .select({
    totalRequests: sum(niscGatewayAccessLog.totalRequests),
    billableRequests: sum(niscGatewayAccessLog.billableRequests),
    successRate: sql<number>`
      (SUM(${niscGatewayAccessLog.successfulRequests})::float / 
       SUM(${niscGatewayAccessLog.totalRequests})::float) * 100
    `,
  })
  .from(niscGatewayAccessLog)
  .where(and(
    eq(niscGatewayAccessLog.merchantId, merchantId),
    eq(niscGatewayAccessLog.year, 2026),
    eq(niscGatewayAccessLog.month, 7),
  ));

// Result:
// {
//   totalRequests: 15000,
//   billableRequests: 1500,
//   successRate: 98.5
// }

// Get daily breakdown (for charts)
const daily = await db
  .select({
    day: niscGatewayAccessLog.day,
    requests: sum(niscGatewayAccessLog.totalRequests),
    billable: sum(niscGatewayAccessLog.billableRequests),
  })
  .from(niscGatewayAccessLog)
  .where(and(
    eq(niscGatewayAccessLog.merchantId, merchantId),
    eq(niscGatewayAccessLog.year, 2026),
    eq(niscGatewayAccessLog.month, 7),
  ))
  .groupBy(niscGatewayAccessLog.day)
  .orderBy(niscGatewayAccessLog.day);

// Result:
// [
//   { day: 1, requests: 450, billable: 45 },
//   { day: 2, requests: 520, billable: 52 },
//   // ... perfect for charts!
// ]
```

---

## Dashboard (Phase 1 Version)

Show usage without billing UI:

```typescript
// Merchant dashboard: usage stats
<Card>
  <h2>July 2026 Usage</h2>
  
  <Stat label="Total Requests" value="15,000" />
  <Stat label="Payment Creations" value="1,500" />
  <Stat label="Success Rate" value="98.5%" />
  
  <UsageChart data={dailyUsage} />
  
  <p className="text-muted">
    Usage tracking active. Billing will be added in the future.
  </p>
</Card>
```

When you add billing (Phase 2), just update the UI:

```typescript
// Merchant dashboard: usage + billing
<Card>
  <h2>July 2026 Usage</h2>
  
  <Stat label="Total Requests" value="15,000" />
  <Stat label="Billable Requests" value="1,500 / 10,000" />
  <ProgressBar value={15} max={100} />
  
  <Stat label="Estimated Bill" value="$50.00" />
  <p className="text-sm">STARTER plan • No overage</p>
  
  <UsageChart data={dailyUsage} />
  
  <Button>Upgrade Plan</Button>
</Card>
```

---

## Summary: What to Build Now

### ✅ Phase 1 (NOW - Essential)

1. **7 database tables** (skip merchant_quota)
2. **API key authentication** with merchant mapping
3. **Credential encryption** (AES-256-GCM)
4. **Payment processing** (M-Pesa STK Push)
5. **Webhook forwarding**
6. **Request logs** (detailed)
7. **Access logs** (aggregated - CRITICAL!)
8. **Per-key rate limiting** (100/min)

### ❌ Phase 2 (LATER - When Pricing Ready)

1. **merchant_quota table**
2. **Billing tier definitions**
3. **Quota enforcement middleware**
4. **Usage alerts** (80%, 100%)
5. **Billing calculations**
6. **Monthly quota reset cron**
7. **Upgrade plan UI**

---

## Timeline

**Phase 1**: ~2 weeks
- Core gateway with usage tracking
- Launch immediately
- All merchants unlimited (for now)

**Monitoring**: 2-3 months
- Collect real usage data
- Analyze patterns
- Set fair pricing

**Phase 2**: ~3-5 days
- Add quota table
- Enable enforcement
- Launch billing

**Total**: ~2 weeks to launch, then billing when ready

---

## Key Insight

By collecting access logs from day 1:
- ✅ You'll have historical data when adding billing
- ✅ You can set prices based on actual usage
- ✅ No "guessing" at fair pricing
- ✅ Smooth transition (data already there)

**Start collecting now, monetize later!** 🚀
