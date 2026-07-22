# Nisc Payment Gateway - Billing & Logging System

## Overview

Two separate logging systems work together:

1. **Request Logs** (Detailed) - For debugging and audit trails
2. **Access Logs** (Lightweight) - For billing and quotas

This dual approach provides both **deep visibility** (request logs) and **fast billing** (access logs).

---

## The Two Logging Systems

### 1. Request Logs (`nisc_gateway_request_log`)

**Purpose**: Debugging, troubleshooting, audit trails

**What's logged**:
```
✅ Full request headers (sanitized)
✅ Full request body (sanitized)
✅ Raw HTTP request (optional, debug mode)
✅ Full response body (sanitized)
✅ Raw HTTP response (optional, debug mode)
✅ Status codes, errors, duration
✅ IP address, user agent
✅ Related transaction IDs
```

**Size**: ~1-5 KB per request (with raw data: 10-50 KB)

**Retention**: 
- Financial transactions: 7 years
- Other requests: 90 days
- Archived to cold storage after 90 days

**Query speed**: Slow (many rows, large columns)

**Use cases**:
- Debug failed payments
- Investigate customer complaints
- Security incident analysis
- Compliance audits

---

### 2. Access Logs (`nisc_gateway_access_log`)

**Purpose**: Billing, quotas, fast analytics

**What's logged**:
```
✅ Request counts (aggregated by hour)
✅ Success/failure counts
✅ Breakdown by endpoint type
✅ Breakdown by status code
✅ Billable request count
```

**Size**: ~1 row per merchant per hour

**Retention**: Indefinite (used for historical billing)

**Query speed**: FAST (aggregated, indexed)

**Use cases**:
- Calculate monthly bills
- Check quota remaining
- Generate usage charts
- Enforce hard limits

---

## How They Work Together

### On Each Request

```typescript
1. Request arrives
   ↓
2. Auth middleware → Extract merchant from API key
   ↓
3. Quota middleware → Check if merchant has quota remaining
   ↓
4. Process request → Create payment, query status, etc.
   ↓
5. Request logger → TWO writes:
   
   A. Write to request_log (detailed)
      - Full request/response
      - For debugging later
   
   B. Increment access_log (aggregated)
      - Upsert by [merchantId, year, month, day, hour]
      - Increment counters: totalRequests++, billableRequests++
      - FAST: just incrementing numbers
   
   C. Update merchant quota
      - Increment currentPeriodRequests
      - Check if limits reached
```

---

## Billing Model

### Billing Tiers

```typescript
FREE Tier:
- 1,000 requests/month
- 100 billable requests/month (payment creations)
- $0/month
- No overage allowed

STARTER Tier:
- 10,000 requests/month
- 1,000 billable requests/month
- $50/month
- Overage: $0.01 per extra request

BUSINESS Tier:
- 100,000 requests/month
- 10,000 billable requests/month
- $300/month
- Overage: $0.005 per extra request

ENTERPRISE Tier:
- 1,000,000 requests/month
- 100,000 billable requests/month
- $2,000/month
- Overage: $0.002 per extra request

CUSTOM Tier:
- Negotiated limits
- Custom pricing
```

### What Counts as "Billable"?

**Billable** (counted towards monthly limit):
- ✅ `POST /api/gateway/v1/payments` (successful payment creation)

**NOT Billable** (free, unlimited):
- ❌ `GET /api/gateway/v1/payments/:id` (query payment status)
- ❌ `GET /api/gateway/v1/payments` (list payments)
- ❌ Webhook deliveries (we call client)
- ❌ Failed requests (our fault, not charged)

**Rationale**: Only charge for the core value-add (initiating payments). Status queries are free to encourage polling.

---

## Monthly Bill Calculation

### Fast Calculation (Using Access Logs)

```sql
-- Calculate bill for July 2026
SELECT 
  merchant_id,
  SUM(billable_requests) as total_billable,
  SUM(total_requests) as total_requests
FROM nisc_gateway_access_log
WHERE merchant_id = 'merchant-xyz'
  AND year = 2026
  AND month = 7
GROUP BY merchant_id;

-- Result:
-- total_billable: 1,500
-- total_requests: 15,000

-- Then calculate fees:
-- Tier: STARTER ($50/month, 1,000 included, $0.01 overage)
-- Base fee: $50
-- Overage: (1,500 - 1,000) × $0.01 = $5.00
-- Total: $55.00
```

**Why it's fast**:
- Only ~720 rows per merchant per month (24 hours × 30 days)
- Simple SUM aggregation
- Indexed by [merchantId, year, month]

**Alternative (slow - using request logs)**:
```sql
-- DON'T DO THIS - too slow!
SELECT COUNT(*) 
FROM nisc_gateway_request_log
WHERE merchant_id = 'merchant-xyz'
  AND is_billable = true
  AND timestamp >= '2026-07-01'
  AND timestamp < '2026-08-01';

-- Might scan millions of rows!
```

---

## Quota Enforcement

### Quota Check (Real-Time)

```typescript
// Called on EVERY request (must be FAST)
async function checkQuota(merchantId: string) {
  // Single query to quota table
  const quota = await db.query.niscGatewayMerchantQuota.findFirst({
    where: eq(niscGatewayMerchantQuota.merchantId, merchantId),
  });
  
  // Check if hard limit reached
  if (quota.quotaExceeded) {
    throw new QuotaExceededError('Monthly limit exceeded');
  }
  
  // Check if approaching soft limit (80%)
  if (quota.currentPeriodRequests / quota.monthlyRequestLimit > 0.8) {
    sendWarningEmail(quota); // async, don't block
  }
  
  // Allow request
}
```

**Performance**:
- Single SELECT by primary key
- No aggregation needed
- `currentPeriodRequests` is pre-computed
- Indexed for instant lookup

### Quota Update (After Request)

```typescript
// Increment quota counter (fast atomic update)
await db
  .update(niscGatewayMerchantQuota)
  .set({
    currentPeriodRequests: sql`currentPeriodRequests + 1`,
    currentPeriodBillable: isBillable 
      ? sql`currentPeriodBillable + 1` 
      : sql`currentPeriodBillable`,
  })
  .where(eq(niscGatewayMerchantQuota.merchantId, merchantId));

// Check if just crossed hard limit
if (newCount >= hardLimit) {
  await db.update(niscGatewayMerchantQuota)
    .set({ quotaExceeded: true })
    .where(eq(niscGatewayMerchantQuota.merchantId, merchantId));
  
  sendAlertEmail('Quota exceeded!');
}
```

---

## Dashboard Views

### For Merchants

**Current Usage Widget**:
```
Your Usage (July 2026)

Requests:       1,250 / 10,000   [=====>    ] 12.5%
Billable:         125 / 1,000    [==>       ] 12.5%

Estimated Bill: $50.00 (no overage)

⚠️ You'll receive an alert at 80% usage (8,000 requests)
```

**Usage Chart** (Last 30 Days):
```javascript
// Query access logs (fast!)
const data = await trpc.niscGateway.logs.getUsageByDay.query({
  startDate: thirtyDaysAgo,
  endDate: today,
});

// Returns:
[
  { day: '2026-07-01', requests: 450, billable: 45 },
  { day: '2026-07-02', requests: 520, billable: 52 },
  // ... render as chart
]
```

**Request History** (Last 100 Requests):
```javascript
// Query detailed request logs
const logs = await trpc.niscGateway.logs.listMyLogs.query({
  limit: 100,
  offset: 0,
});

// Returns:
[
  {
    timestamp: '2026-07-22T12:45:00Z',
    endpoint: '/api/gateway/v1/payments',
    method: 'POST',
    statusCode: 200,
    duration: 1234,
    // ... click to see full details
  },
  // ...
]
```

### For Agency

**All Merchants Usage**:
```javascript
// Query access logs across all merchants
const usage = await db
  .select({
    merchantId: niscGatewayAccessLog.merchantId,
    merchantName: niscGatewayMerchant.merchantName,
    totalRequests: sum(niscGatewayAccessLog.totalRequests),
    billableRequests: sum(niscGatewayAccessLog.billableRequests),
  })
  .from(niscGatewayAccessLog)
  .leftJoin(niscGatewayMerchant, 
    eq(niscGatewayAccessLog.merchantId, niscGatewayMerchant.id))
  .where(and(
    eq(niscGatewayAccessLog.year, 2026),
    eq(niscGatewayAccessLog.month, 7),
  ))
  .groupBy(
    niscGatewayAccessLog.merchantId,
    niscGatewayMerchant.merchantName,
  )
  .orderBy(desc(sum(niscGatewayAccessLog.totalRequests)));

// Returns top merchants by usage
```

**Revenue Projection**:
```javascript
// Calculate total revenue for the month
const merchants = await getAllMerchants();
let totalRevenue = 0;

for (const merchant of merchants) {
  const bill = await calculateMonthlyBill(merchant.id, 2026, 7);
  totalRevenue += bill.totalFee;
}

console.log(`Projected revenue: $${totalRevenue.toFixed(2)}`);
```

---

## Database Sizing

### Request Logs (Detailed)

**Assumptions**:
- 1 million requests/month across all merchants
- Average 2 KB per log entry
- 7-year retention for financial transactions

**Storage**:
```
Financial logs:
  1M requests/month × 12 months × 7 years × 2 KB
  = 168 GB over 7 years
  = ~2 GB/month

Non-financial logs (90-day retention):
  1M requests/month × 3 months × 2 KB
  = 6 GB total
```

**Total**: ~8 GB hot storage, ~160 GB cold storage

### Access Logs (Aggregated)

**Assumptions**:
- 100 merchants
- 24 hours/day × 30 days/month = 720 rows per merchant per month
- Average 200 bytes per row

**Storage**:
```
Per merchant per month:
  720 rows × 200 bytes = 144 KB

All merchants per month:
  100 merchants × 144 KB = 14.4 MB

All merchants per year:
  14.4 MB × 12 months = 173 MB
```

**Total**: Negligible! Keep forever.

---

## Performance Optimizations

### 1. Access Log Upserts (Atomic)

```sql
-- Use PostgreSQL ON CONFLICT to avoid race conditions
INSERT INTO nisc_gateway_access_log (
  merchant_id, year, month, day, hour,
  total_requests, billable_requests, ...
) VALUES (
  'merchant-xyz', 2026, 7, 22, 12,
  1, 1, ...
)
ON CONFLICT (merchant_id, year, month, day, hour)
DO UPDATE SET
  total_requests = nisc_gateway_access_log.total_requests + 1,
  billable_requests = CASE 
    WHEN EXCLUDED.is_billable THEN nisc_gateway_access_log.billable_requests + 1
    ELSE nisc_gateway_access_log.billable_requests
  END,
  updated_at = NOW();
```

### 2. Quota Table (Pre-Computed)

```sql
-- Don't count requests on every check
-- Store current count in quota table

-- Fast check:
SELECT quota_exceeded, current_period_requests, monthly_request_limit
FROM nisc_gateway_merchant_quota
WHERE merchant_id = 'merchant-xyz';

-- Instead of slow:
SELECT COUNT(*) FROM nisc_gateway_request_log
WHERE merchant_id = 'merchant-xyz' 
  AND timestamp >= date_trunc('month', NOW());
```

### 3. Indexes for Fast Queries

```sql
-- Access logs: fast monthly billing
CREATE INDEX idx_access_log_merchant_period 
  ON nisc_gateway_access_log(merchant_id, year, month);

-- Request logs: fast merchant history
CREATE INDEX idx_request_log_merchant_time 
  ON nisc_gateway_request_log(merchant_id, timestamp DESC);

-- Quota: fast lookup
CREATE UNIQUE INDEX idx_quota_merchant 
  ON nisc_gateway_merchant_quota(merchant_id);
```

---

## Alert System

### Soft Limit Alert (80% Usage)

```
Subject: [Nisc Gateway] Approaching Monthly Limit

Hi Acme Corp,

You've used 8,000 of your 10,000 monthly requests (80%).

Current usage:
- Total requests: 8,000 / 10,000
- Billable requests: 800 / 1,000

To avoid service interruption, consider:
1. Upgrading to BUSINESS tier (100,000 requests)
2. Optimizing your integration (reduce polling)
3. Enabling overage ($0.01 per extra request)

View usage: https://app.nisccloud.com/gateway/usage

Questions? Reply to this email.
```

### Hard Limit Alert (100% Usage)

```
Subject: [URGENT] [Nisc Gateway] Monthly Limit Exceeded

Hi Acme Corp,

Your account has reached its monthly limit:
- 10,000 / 10,000 requests used

IMPORTANT: Further requests will be rejected with:
  402 Payment Required: Monthly limit exceeded

Actions required:
1. Upgrade your plan immediately (instant activation)
2. Or enable overage billing ($0.01 per request)
3. Or wait until next month (resets on Aug 1)

Upgrade now: https://app.nisccloud.com/gateway/billing

Urgent support: support@nisccloud.com
```

### Overage Summary (End of Month)

```
Subject: [Nisc Gateway] July 2026 Invoice - $55.00

Hi Acme Corp,

Your July 2026 usage:

Plan: STARTER
Base fee: $50.00

Usage:
- Total requests: 15,000
- Billable requests: 1,500 / 1,000 included

Overage:
- Extra requests: 500
- Rate: $0.01 per request
- Overage fee: $5.00

Total: $55.00

Payment will be charged to your card ending in 1234
on August 1, 2026.

View detailed invoice: https://app.nisccloud.com/gateway/invoices/2026-07

Questions? Reply to this email.
```

---

## Migration Path

### From Current System

**Current state**: No gateway yet, internal M-Pesa only

**Phase 1**: Deploy with FREE tier for all
- All merchants start on FREE tier (1,000 requests/month)
- Soft limit warnings, but no hard blocks
- Monitor usage patterns

**Phase 2**: Assign tiers based on usage
- After 30 days, analyze actual usage
- Move heavy users to BUSINESS/ENTERPRISE
- Keep light users on FREE/STARTER

**Phase 3**: Enable hard limits
- Give 30-day warning: "Hard limits will be enforced on Sep 1"
- Offer upgrade paths
- Turn on quota enforcement

---

## Summary

**Dual Logging**:
- ✅ Request logs: detailed, for debugging
- ✅ Access logs: lightweight, for billing
- ✅ Both sanitize sensitive data
- ✅ Fast billing calculations

**Billing Tiers**:
- ✅ FREE, STARTER, BUSINESS, ENTERPRISE
- ✅ Monthly limits with overage
- ✅ Only bill for payment creations
- ✅ Soft warnings, hard limits

**Performance**:
- ✅ Real-time quota checks (single SELECT)
- ✅ Fast billing (aggregated access logs)
- ✅ Detailed debugging (request logs)
- ✅ Efficient storage (8 GB hot, 160 GB cold)

**Merchant Experience**:
- ✅ Self-service dashboard
- ✅ Usage charts and alerts
- ✅ Transparent billing
- ✅ No surprise charges (soft warnings)

**Agency Control**:
- ✅ View all merchants' usage
- ✅ Set custom limits
- ✅ Revenue projections
- ✅ Billing automation

Ready to implement! 🎉
