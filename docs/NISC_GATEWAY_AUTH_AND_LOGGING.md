# Nisc Payment Gateway - Authentication & Logging Architecture

## Overview

This document explains how API key authentication and comprehensive request logging work together to provide secure, auditable payment processing.

## The Core Principle

**API Key → Merchant Direct Mapping**

Every API key is permanently linked to ONE merchant account. Clients authenticate with the API key, and the gateway automatically:
- Identifies which merchant is making the request
- Loads that merchant's payment provider credentials
- Logs the request with full merchant context
- Enforces that merchant's rate limits and permissions

**Client NEVER sends merchant ID** - this prevents impersonation and simplifies integration.

---

## Authentication Flow

### Step-by-Step Process

```
1. Client Request
   ↓
   POST /api/gateway/v1/payments
   Authorization: Bearer npg_live_4a8f3e7c9b2d1f6e8a4b7c9d2e5f8a3b
   
2. Extract API Key
   ↓
   Middleware: gateway-auth.ts
   - Parse Authorization header
   - Extract: "npg_live_4a8f3e7c9b2d1f6e8a4b7c9d2e5f8a3b"
   
3. Validate Format
   ↓
   - Check format: npg_{env}_{32hex}
   - Environment must be 'live' or 'test'
   - Random part must be 32 hex characters
   
4. Hash and Lookup
   ↓
   Database Query:
   SELECT 
     k.*,
     m.*
   FROM nisc_gateway_api_key k
   JOIN nisc_gateway_merchant m ON k.merchant_id = m.id
   WHERE k.key_hash = bcrypt_hash(api_key)
   
5. Validate Status
   ↓
   - Key must be active (is_active = true)
   - Key must not be expired (expires_at > now OR null)
   - Merchant must be active (status = 'ACTIVE')
   
6. Check IP Restrictions (if configured)
   ↓
   IF api_key.allowed_ips IS NOT EMPTY:
     - Extract client IP from x-forwarded-for header
     - Check if client IP is in allowed_ips array
     - Reject if not in list
   
7. Check Rate Limits
   ↓
   Redis:
   - Key: "gateway:ratelimit:{api_key_id}"
   - Increment counter
   - Check if count > api_key.rate_limit
   - Reject if over limit
   
8. Load Merchant Context
   ↓
   Attach to request object:
   request.merchant = {
     id: "merchant-uuid-123",
     name: "Acme Corp",
     email: "billing@acme.com",
     settings: {
       webhookUrl: "https://acme.com/webhook",
       webhookSecret: "secret123",
       allowedOrigins: ["https://acme.com"]
     },
     apiKeyId: "key-uuid-456",
     apiKeyName: "Production API",
     permissions: ["PAYMENT_CREATE", "PAYMENT_READ"],
     environment: "live",
     rateLimitRemaining: 95  // 100 - 5 requests used
   }
   
9. Load Payment Credentials
   ↓
   Database Query:
   SELECT encrypted_credentials
   FROM nisc_gateway_merchant_credentials
   WHERE merchant_id = request.merchant.id
     AND provider = 'mpesa'
     AND environment = request.merchant.environment
     AND is_active = true
   
10. Decrypt Credentials
    ↓
    decryptCredentials(encrypted_credentials) = {
      consumerKey: "...",
      consumerSecret: "...",
      shortCode: "...",
      passkey: "..."
    }
    
11. Process Payment
    ↓
    - Use decrypted credentials
    - Initiate M-Pesa STK Push
    - Create gateway transaction record
    - Log request (see logging flow below)
    - Return response
```

---

## Request Logging Flow

### What Gets Logged

**EVERY API request is logged** with comprehensive details for audit trails and debugging.

```
Before Request Processing:
- Capture start time
- Capture request details
- Prepare sanitized copies

After Request Processing:
- Calculate duration
- Capture response details
- Write to nisc_gateway_request_log table
- Include merchant context from auth middleware
```

### Log Record Structure

```typescript
{
  // Identity
  id: "log-uuid-789",
  merchantId: "merchant-uuid-123",  // From auth middleware
  apiKeyId: "key-uuid-456",         // From auth middleware
  
  // Request Details
  endpoint: "/api/gateway/v1/payments",
  method: "POST",
  path: "/api/gateway/v1/payments?source=checkout",
  requestHeaders: {
    "content-type": "application/json",
    "user-agent": "WordPress/6.0",
    "authorization": "Bearer npg_***"  // SANITIZED
  },
  requestBody: {
    "provider": "mpesa",
    "amount": 1000,
    "currency": "KES",
    "phoneNumber": "254712***678",  // MASKED
    "reference": "ORDER-12345",
    "description": "Payment for Order #12345",
    "metadata": {
      "orderId": "12345"
      // cardNumber removed if present
    }
  },
  requestSize: 234,  // bytes
  
  // Context
  ipAddress: "102.168.1.50",
  userAgent: "WordPress/6.0",
  country: "KE",  // from IP geolocation
  
  // Response
  statusCode: 200,
  success: true,
  errorCode: null,
  errorMessage: null,
  responseSize: 156,  // bytes
  
  // Timing
  timestamp: "2026-07-22T12:45:00Z",
  durationMs: 1234,
  
  // Related Records
  gatewayTransactionId: "gtx_abc123...",
  paymentTransactionId: "ptx_xyz789...",
  
  // Rate Limiting
  rateLimitRemaining: 95,
  rateLimitHit: false,
  
  // Time-Series Indexing (for fast analytics)
  year: 2026,
  month: 7,
  day: 22,
  hour: 12
}
```

### Sanitization Rules

**Phone Numbers**: Mask middle 6 digits
```
254712345678 → 254712***678
```

**API Keys**: Never log full keys
```
Bearer npg_live_4a8f3e7c9b2d1f6e8a4b7c9d2e5f8a3b
      ↓
Bearer npg_***
```

**Card Numbers**: Remove entirely
```
{ metadata: { cardNumber: "4111111111111111" } }
      ↓
{ metadata: {} }
```

**Other Sensitive Fields**: Remove or mask
- CVV codes
- PINs
- Passwords
- Social security numbers
- Full names (keep initials only)

---

## Log Access Control

### For Merchants (via tRPC)

```typescript
// Merchants can ONLY see their own logs
const logs = await trpc.niscGateway.logs.listMyLogs.query({
  limit: 50,
  offset: 0,
  startDate: new Date('2026-07-01'),
  endDate: new Date('2026-07-31'),
  endpoint: '/api/gateway/v1/payments',  // optional filter
  statusCode: 200,  // optional filter
  success: true,    // optional filter
});

// Backend automatically filters by merchantId from session
WHERE merchant_id = (SELECT merchant_id FROM session)
```

### For Agency Users (via tRPC)

```typescript
// Agency users can see ALL logs, with optional merchant filter
const logs = await trpc.niscGateway.logs.listAllLogs.query({
  merchantId: 'merchant-uuid-123',  // optional
  limit: 50,
  offset: 0,
  startDate: new Date('2026-07-01'),
  endDate: new Date('2026-07-31'),
});

// Backend checks user role
if (!isAgencyUser(user.role)) {
  throw new ForbiddenError();
}
```

### Analytics Dashboard

```typescript
// Get aggregated metrics
const analytics = await trpc.niscGateway.logs.getAnalytics.query({
  merchantId: 'merchant-uuid-123',  // optional
  startDate: new Date('2026-07-01'),
  endDate: new Date('2026-07-31'),
});

// Returns:
{
  totalRequests: 15000,
  successfulRequests: 14250,
  failedRequests: 750,
  avgDuration: 456,      // milliseconds
  p95Duration: 1234,     // milliseconds
  totalRateLimitHits: 23
}
```

---

## Database Indexes for Performance

```sql
-- Fast merchant-specific queries
CREATE INDEX idx_request_log_merchant_time 
  ON nisc_gateway_request_log(merchant_id, timestamp DESC);

-- Fast API key usage tracking
CREATE INDEX idx_request_log_apikey_time 
  ON nisc_gateway_request_log(api_key_id, timestamp DESC);

-- Fast transaction lookups
CREATE INDEX idx_request_log_gateway_txn 
  ON nisc_gateway_request_log(gateway_transaction_id);

-- Error monitoring
CREATE INDEX idx_request_log_errors 
  ON nisc_gateway_request_log(status_code, timestamp DESC)
  WHERE success = false;

-- Time-series analytics
CREATE INDEX idx_request_log_timeseries 
  ON nisc_gateway_request_log(year, month, day, hour);

-- IP-based security monitoring
CREATE INDEX idx_request_log_ip 
  ON nisc_gateway_request_log(ip_address, timestamp DESC);
```

---

## Security Benefits

### 1. **Prevents Merchant Impersonation**
Client cannot claim to be a different merchant. API key → merchant mapping is immutable and enforced at the database level.

### 2. **Automatic Credential Isolation**
Each merchant's payment provider credentials are isolated. Even if an attacker compromises an API key, they can only access that one merchant's credentials.

### 3. **Complete Audit Trail**
Every request logged with:
- Who (merchantId + apiKeyId)
- What (endpoint + method)
- When (timestamp)
- Where (IP address)
- Result (success/failure)

### 4. **Rate Limiting Per Key**
Different API keys for the same merchant can have different rate limits:
- Production key: 1000 req/min
- Staging key: 100 req/min
- Development key: 10 req/min

### 5. **IP Restrictions Per Key**
Optional IP allowlisting per API key:
```typescript
apiKey.allowedIps = [
  "203.0.113.10",      // Production server
  "203.0.113.20",      // Staging server
];

// Requests from other IPs are rejected
```

### 6. **Permission Scoping**
Each API key has specific permissions:
```typescript
apiKey.permissions = [
  "PAYMENT_CREATE",  // Can create payments
  "PAYMENT_READ",    // Can query payment status
  // "REFUND_CREATE" not included - this key cannot initiate refunds
];
```

---

## Log Retention & Compliance

### Retention Periods

**Financial Transactions**: 7 years (regulatory requirement)
```sql
-- Logs linked to payments
WHERE gateway_transaction_id IS NOT NULL
  AND timestamp > (NOW() - INTERVAL '7 years')
```

**General API Logs**: 90 days (operational)
```sql
-- Logs not linked to payments
WHERE gateway_transaction_id IS NULL
  AND timestamp > (NOW() - INTERVAL '90 days')
```

### Archive Strategy

```typescript
// Monthly job: archive old logs to cold storage
async function archiveOldLogs() {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 3);
  
  // Export to S3/cloud storage
  const logs = await db.query.niscGatewayRequestLog.findMany({
    where: and(
      lt(niscGatewayRequestLog.timestamp, cutoffDate),
      isNull(niscGatewayRequestLog.gatewayTransactionId)
    )
  });
  
  await uploadToS3(logs);
  
  // Delete from hot database
  await db.delete(niscGatewayRequestLog)
    .where(and(
      lt(niscGatewayRequestLog.timestamp, cutoffDate),
      isNull(niscGatewayRequestLog.gatewayTransactionId)
    ));
}
```

---

## Monitoring Queries

### 1. Real-Time Error Rate
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE success = false) as errors,
  (COUNT(*) FILTER (WHERE success = false)::float / COUNT(*)) * 100 as error_rate
FROM nisc_gateway_request_log
WHERE timestamp > NOW() - INTERVAL '5 minutes';

-- Alert if error_rate > 5%
```

### 2. Suspicious Activity Detection
```sql
-- Unusual IP for a merchant
SELECT 
  merchant_id,
  ip_address,
  COUNT(*) as request_count
FROM nisc_gateway_request_log
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY merchant_id, ip_address
HAVING COUNT(*) > 100;

-- Alert on spike from new IP
```

### 3. Rate Limit Abuse
```sql
SELECT 
  merchant_id,
  api_key_id,
  COUNT(*) as rate_limit_hits
FROM nisc_gateway_request_log
WHERE rate_limit_hit = true
  AND timestamp > NOW() - INTERVAL '1 day'
GROUP BY merchant_id, api_key_id
HAVING COUNT(*) > 10;

-- Alert on persistent rate limiting
```

### 4. Slow Requests
```sql
SELECT 
  endpoint,
  method,
  AVG(duration_ms) as avg_duration,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration,
  COUNT(*) as request_count
FROM nisc_gateway_request_log
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY endpoint, method
HAVING PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) > 2000;

-- Alert if p95 > 2 seconds
```

---

## Example: Complete Request Flow

```
1. WordPress Site (Client)
   ↓
   POST /api/gateway/v1/payments
   Authorization: Bearer npg_live_abc123...
   Body: { amount: 1000, phoneNumber: "254712345678", ... }

2. Nisc Gateway - Auth Middleware
   ↓
   - Extract API key: npg_live_abc123...
   - Hash and lookup in database
   - Found: merchantId = "merchant-xyz"
   - Validate: key active ✓, merchant active ✓
   - Check rate limit: 45/100 requests used ✓
   - Attach to request: request.merchant = { id: "merchant-xyz", ... }

3. Nisc Gateway - Logging Middleware (Start)
   ↓
   - Start timer
   - Capture request details
   - Sanitize sensitive data
   - Continue to handler...

4. Nisc Gateway - Payment Handler
   ↓
   - Get merchant: request.merchant.id = "merchant-xyz"
   - Load credentials for merchant-xyz (M-Pesa)
   - Decrypt credentials
   - Initiate M-Pesa STK Push
   - Create gateway transaction record
   - Return response

5. Nisc Gateway - Logging Middleware (End)
   ↓
   - Stop timer: duration = 1234ms
   - Capture response: statusCode = 200, success = true
   - Insert log record:
     {
       merchantId: "merchant-xyz",
       apiKeyId: "key-abc",
       endpoint: "/api/gateway/v1/payments",
       statusCode: 200,
       success: true,
       durationMs: 1234,
       gatewayTransactionId: "gtx_789",
       ...
     }

6. M-Pesa
   ↓
   - Customer receives STK prompt
   - Customer enters PIN
   - Payment processes
   - M-Pesa sends callback to gateway

7. Nisc Gateway - Webhook Receiver
   ↓
   - Receive M-Pesa callback
   - Update gateway transaction status
   - Forward webhook to merchant-xyz's webhook URL
   - Log webhook delivery attempt
   - Retry if failed

8. WordPress Site (Client)
   ↓
   - Receive webhook from gateway
   - Verify HMAC signature
   - Update order status
   - Send confirmation email
```

---

## Summary

**API Key → Merchant Mapping**:
- ✅ One API key = One merchant
- ✅ Client never sends merchant ID
- ✅ Prevents impersonation
- ✅ Automatic credential lookup

**Comprehensive Logging**:
- ✅ Every request logged
- ✅ Sanitized sensitive data
- ✅ Full audit trail
- ✅ Merchant-specific access
- ✅ Agency-wide monitoring
- ✅ Fast analytics queries
- ✅ Compliance-ready retention

**Security First**:
- ✅ Encrypted credentials at rest
- ✅ Hashed API keys
- ✅ Per-key rate limits
- ✅ Optional IP restrictions
- ✅ Permission scoping
- ✅ Complete audit trail
