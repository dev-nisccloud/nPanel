# Nisc Payment Gateway - Implementation Guide

## Quick Start

This guide provides a step-by-step implementation plan for the Nisc Payment Gateway feature. See `NISC_PAYMENT_GATEWAY_ARCHITECTURE.md` for the complete architectural design and `nisc-gateway-flow.html` for the workflow diagram.

## Project Overview

**Goal**: Create a white-label payment processing gateway that allows external clients (WordPress sites, mobile apps, etc.) to process payments through our system without handling payment gateway integrations themselves.

**Current Payment Providers**: M-Pesa (expandable to Stripe, PayPal, Flutterwave, etc.)

**Key Benefits**:
- Centralized credential management (encrypted)
- Simplified integration for clients
- Future WordPress plugin support
- Agency-controlled payment processing

## Implementation Phases

### Phase 1: Database Schema & Encryption (Priority: HIGH)

#### 1.1 Create Database Schema File

**File**: `packages/db/src/schema/nisc-gateway.ts`

```typescript
// Tables to create (Phase 1 - NOW):
// 1. nisc_gateway_merchant - Merchant accounts
// 2. nisc_gateway_merchant_credentials - Encrypted provider credentials
// 3. nisc_gateway_api_key - API keys (with merchantId FK - CRITICAL!)
// 4. nisc_gateway_transaction - Gateway transaction records
// 5. nisc_gateway_webhook_log - Webhook delivery logs
// 6. nisc_gateway_request_log - Detailed request/response logging (debugging)
// 7. nisc_gateway_access_log - Lightweight access counting (START COLLECTING NOW!)

// Tables to create (Phase 2 - LATER, when pricing finalized):
// 8. nisc_gateway_merchant_quota - Usage limits & billing tiers (DEFER)
```

**IMPORTANT DESIGN DECISIONS**:

1. **API Key → Merchant Mapping**:
   - Each API key has `merchantId` foreign key
   - API key table includes merchant relationship
   - When authenticating, JOIN with merchant in ONE query
   - Client never sends merchant ID in requests

2. **Dual Logging System (IMPLEMENT NOW)**:
   - **`request_log`**: Detailed logs with raw request/response for debugging
   - **`access_log`**: Lightweight aggregated counters (START COLLECTING NOW!)
   - `request_log` is detailed but expensive to query
   - `access_log` is fast to query (aggregated by hour)
   - Both sanitize sensitive data (phone numbers, API keys)
   - Both have time-series indexes for fast queries
   - **Why start now**: Historical data valuable when you add billing later

3. **Billing & Quotas (DEFER TO PHASE 2)**:
   - **`merchant_quota`**: Add later when pricing finalized
   - Billing tiers (FREE, STARTER, etc.) - decide later
   - Hard/soft limits - add when needed
   - For now: collect usage data, no enforcement
   - Easy to add later since usage data already collected

3. **API Key Features**:
   - Optional IP restrictions per key
   - Per-key rate limits
   - Permissions array for scoping access
   - Environment flag (sandbox/production)

**Reference Implementation**: See architecture document section "Database Schema"

#### 1.2 Create Encryption Utility

**File**: `packages/api/src/lib/gateway-encryption.ts`

```typescript
// Functions to implement:
// - encryptCredentials(credentials: object): string
// - decryptCredentials(encryptedData: string): object
// - rotateEncryptionKey() - for future key rotation
```

**Security Requirements**:
- Use AES-256-GCM
- Store encryption key in environment variable
- Include auth tag for integrity verification
- Version encrypted data for key rotation support

#### 1.3 Environment Configuration

**File**: `system/.env` (and other env files)

```env
# Add these variables:
GATEWAY_ENCRYPTION_KEY=<64_character_hex_string>
GATEWAY_PUBLIC_API_URL=https://api.nisccloud.com/gateway/v1
GATEWAY_WEBHOOK_BASE_URL=https://api.nisccloud.com/gateway/webhooks
GATEWAY_RATE_LIMIT_DEFAULT=100
GATEWAY_RATE_LIMIT_WINDOW_MS=60000
GATEWAY_WEBHOOK_MAX_RETRIES=5
GATEWAY_WEBHOOK_RETRY_BACKOFF_MS=1000
```

**Action Items**:
- [ ] Generate secure encryption key using `openssl rand -hex 32`
- [ ] Add to all environment files (development, staging, production)
- [ ] Document key rotation procedure

---

### Phase 2: tRPC API (Agency Side) (Priority: HIGH)

#### 2.1 Create Gateway Router

**File**: `packages/api/src/routers/nisc-gateway/index.ts`

**Endpoints to implement**:

```typescript
export const niscGatewayRouter = router({
  // Merchant Management
  merchants: router({
    create: protectedProcedure,      // Create new merchant
    list: protectedProcedure,         // List all merchants (agency only)
    getById: protectedProcedure,      // Get merchant details
    update: protectedProcedure,       // Update merchant info
    suspend: protectedProcedure,      // Suspend merchant
    activate: protectedProcedure,     // Activate merchant
  }),
  
  // Provider Credentials
  credentials: router({
    set: protectedProcedure,          // Set/update provider credentials
    verify: protectedProcedure,       // Test credentials with provider
    list: protectedProcedure,         // List configured providers
    remove: protectedProcedure,       // Remove provider credentials
  }),
  
  // API Key Management
  apiKeys: router({
    create: protectedProcedure,       // Generate new API key
    list: protectedProcedure,         // List merchant API keys
    revoke: protectedProcedure,       // Revoke API key
    getUsage: protectedProcedure,     // Get usage statistics
  }),
  
  // Transaction Management
  transactions: router({
    list: protectedProcedure,         // List gateway transactions
    getById: protectedProcedure,      // Get transaction details
    retryWebhook: protectedProcedure, // Manually retry webhook
  }),
  
  // Analytics
  analytics: router({
    getMerchantStats: protectedProcedure,  // Merchant statistics
    getUsageMetrics: protectedProcedure,   // Usage metrics
  }),
});
```

**Permission Logic**:
- Only `AGENCY_USER`, `AGENCY_ADMIN`, `AGENCY_SUPER_ADMIN` can access
- Merchants can only see their own data
- Agency users can see all data

#### 2.2 API Key Generation Logic

**File**: `packages/api/src/lib/gateway-api-key.ts`

```typescript
// Functions:
// - generateApiKey(environment: 'live' | 'test'): { key: string, hash: string, prefix: string }
// - hashApiKey(key: string): string
// - verifyApiKey(key: string, hash: string): boolean
```

**Key Format**: `npg_{environment}_{32_char_random}`

Example: `npg_live_4a8f3e7c9b2d1f6e8a4b7c9d2e5f8a3b`

---

### Phase 3: Public REST API (Priority: HIGH)

#### 3.1 Create REST API Endpoints

**File**: `apps/server/src/api/gateway/payments.ts`

**Endpoints**:
- `POST /api/gateway/v1/payments` - Create payment
- `GET /api/gateway/v1/payments/:id` - Get payment status
- `GET /api/gateway/v1/payments` - List payments

**File**: `apps/server/src/api/gateway/webhooks.ts`

**Endpoint**:
- `POST /api/gateway/webhooks/:provider/:merchantId` - Receive provider callbacks

#### 3.2 API Key Authentication Middleware

**File**: `apps/server/src/middleware/gateway-auth.ts`

**CRITICAL DESIGN**: API key directly maps to merchant - client NEVER sends merchant details!

```typescript
// Middleware flow:
// 1. Extract API key from Authorization header
// 2. Validate key format (npg_{env}_{32chars})
// 3. Hash and lookup in database
// 4. JOIN with merchant table (one query)
// 5. Check key is active and not expired
// 6. Check merchant account is active
// 7. Verify IP restrictions (if configured)
// 8. Check rate limits (per key)
// 9. Attach merchant context to request

// Result: request.merchant contains:
// - merchantId (the authenticated merchant)
// - merchantName
// - merchantEmail
// - settings (webhook URL, allowed origins, etc.)
// - apiKeyId (which key was used)
// - permissions (what this key can do)
// - environment (sandbox/production)
// - rateLimitRemaining

// Downstream code uses request.merchant to:
// - Load payment provider credentials
// - Send webhooks to correct URL
// - Log requests with merchant context
// - Enforce permissions
```

#### 3.3 Dual Logging Middleware

**File**: `apps/server/src/middleware/gateway-request-logger.ts`

**PURPOSE**: Two-tier logging - detailed + lightweight

```typescript
// 1. DETAILED REQUEST LOG (for debugging)
// - Full request: headers, body, raw request (optional)
// - Full response: status, body, raw response (optional)
// - Context: merchantId, apiKeyId, IP, user-agent
// - Timing: duration, timestamp
// - Links: gatewayTransactionId
// - Sanitized: phone numbers masked, API keys redacted

// 2. LIGHTWEIGHT ACCESS LOG (for billing)
// - Aggregated by hour (one row per merchant per hour)
// - Counts: total requests, successful, failed
// - By endpoint: payment create, read, list, refunds
// - By status: 2xx, 4xx, 5xx
// - Billable count: successful payment creations only
// - UPSERT on conflict: increment counters

// 3. QUOTA TRACKING
// - Update merchant_quota.currentPeriodRequests
// - Check if soft/hard limits reached
// - Send alerts if needed
```

#### 3.4 Access Log Aggregation (IMPLEMENT NOW)

**File**: `packages/api/src/lib/gateway-access-log.ts`

**PURPOSE**: Collect usage data for future billing

```typescript
// Function: incrementAccessLog()
// - Called for EVERY request (after success or failure)
// - UPSERT to nisc_gateway_access_log
// - Composite key: [merchantId, year, month, day, hour]
// - Increments counters atomically:
//   * totalRequests++
//   * successfulRequests++ (if 2xx)
//   * failedRequests++ (if 4xx/5xx)
//   * paymentCreateRequests++ (if POST /payments)
//   * billableRequests++ (if successful payment creation)
// - Non-blocking (don't wait for completion)
// - Even though no billing yet, START COLLECTING DATA NOW!
```

**Why collect now**:
- ✅ Historical usage data when you add billing
- ✅ Understand actual usage patterns before pricing
- ✅ No performance impact (aggregated, async)
- ✅ Easy to add billing later since data already there

#### 3.5 Quota Enforcement (DEFER TO PHASE 2)

**Status**: NOT IMPLEMENTED YET

When you're ready to add billing:
1. Create `nisc_gateway_merchant_quota` table
2. Define billing tiers and pricing
3. Add quota check middleware
4. Enable hard/soft limits
5. Add billing calculation endpoints

**For now**: All merchants have unlimited access while you collect usage data.

#### 3.6 Rate Limiting (IMPLEMENT NOW - Abuse Prevention)

**Implementation**: Use Redis for per-key rate limiting

```typescript
// Per-key rate limiting (short-term - IMPLEMENT NOW)
// - Default: 100 requests per minute
// - Configurable per API key in nisc_gateway_api_key.rateLimit
// - Redis key: "gateway:ratelimit:{apiKeyId}"
// - TTL: 60 seconds
// - Prevents API abuse and DDoS

// Per-merchant quota limiting (long-term - DEFER)
// - Monthly request limits based on billing tier
// - Will be added in Phase 2 with merchant_quota table
```

**For now**: Only implement per-key rate limiting (100/min default). Add monthly quotas later.

---

### Phase 4: Payment Provider Abstraction (Priority: HIGH)

#### 4.1 Create Provider Interface

**File**: `packages/api/src/lib/payment-providers/base.ts`

```typescript
export interface PaymentProvider {
  name: string;
  
  // Initialize payment
  initiatePayment(params: {
    amount: number;
    currency: string;
    phoneNumber?: string;
    reference: string;
    description?: string;
    callbackUrl: string;
  }): Promise<PaymentInitiationResponse>;
  
  // Query payment status
  queryPayment(transactionId: string): Promise<PaymentStatusResponse>;
  
  // Verify credentials
  verifyCredentials(): Promise<boolean>;
  
  // Parse webhook callback
  parseCallback(payload: unknown): PaymentCallbackData;
}
```

#### 4.2 M-Pesa Provider Implementation

**File**: `packages/api/src/lib/payment-providers/mpesa.ts`

```typescript
export class MpesaGatewayProvider implements PaymentProvider {
  constructor(credentials: {
    consumerKey: string;
    consumerSecret: string;
    shortCode: string;
    passkey: string;
  }) {}
  
  // Implement interface methods
  // Reuse existing M-Pesa client logic
}
```

---

### Phase 5: Webhook Forwarding System (Priority: MEDIUM)

#### 5.1 Webhook Forwarder

**File**: `packages/api/src/lib/gateway-webhook-forwarder.ts`

```typescript
export async function forwardWebhookToMerchant(params: {
  merchantId: string;
  gatewayTransactionId: string;
  event: 'payment.success' | 'payment.failed' | 'payment.cancelled';
  payload: object;
}): Promise<void> {
  // 1. Load merchant webhook URL and secret
  // 2. Generate HMAC signature
  // 3. Send POST request to merchant webhook URL
  // 4. Log attempt in nisc_gateway_webhook_log
  // 5. If failed, schedule retry with exponential backoff
}
```

#### 5.2 Webhook Retry Logic

**Implementation**: Use QStash or similar job queue

```typescript
// Retry schedule:
// Attempt 1: Immediate
// Attempt 2: +1 second
// Attempt 3: +2 seconds
// Attempt 4: +4 seconds
// Attempt 5: +8 seconds
// Attempt 6: +16 seconds (final)
```

#### 5.3 Webhook Signature Generation

**File**: `packages/api/src/lib/gateway-webhook-signature.ts`

```typescript
export function generateWebhookSignature(
  payload: object,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}
```

**Client Verification Example** (for documentation):
```javascript
// Client-side verification
const signature = request.headers['x-nisc-signature'];
const expectedSignature = generateWebhookSignature(
  request.body,
  merchantWebhookSecret
);

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

---

### Phase 6: Integration & Testing (Priority: MEDIUM)

#### 6.1 Integration Points

**Update Main App Router**:

**File**: `apps/server/src/create-app.ts`

```typescript
// Add new routes:
app.post('/api/gateway/v1/payments', gatewayAuth, handleCreatePayment);
app.get('/api/gateway/v1/payments/:id', gatewayAuth, handleGetPayment);
app.get('/api/gateway/v1/payments', gatewayAuth, handleListPayments);
app.post('/api/gateway/webhooks/:provider/:merchantId', handleGatewayCallback);
```

**File**: `packages/api/src/routers/index.ts`

```typescript
// Add to appRouter:
export const appRouter = router({
  // ... existing routers
  niscGateway: niscGatewayRouter,
});
```

#### 6.2 Testing Strategy

**Unit Tests**:
- [ ] Encryption/decryption functions
- [ ] API key generation and validation
- [ ] Webhook signature generation
- [ ] Rate limiting logic

**Integration Tests**:
- [ ] Create merchant account
- [ ] Set M-Pesa credentials
- [ ] Generate API key
- [ ] Initiate payment via public API
- [ ] Receive M-Pesa callback
- [ ] Forward webhook to merchant
- [ ] Query payment status

**E2E Tests**:
- [ ] Full payment flow in sandbox mode
- [ ] Webhook retry logic
- [ ] Rate limiting enforcement
- [ ] API key expiration

---

### Phase 7: Documentation (Priority: MEDIUM)

#### 7.1 API Documentation

**File**: `docs/NISC_GATEWAY_API_REFERENCE.md`

Create OpenAPI/Swagger documentation for:
- Authentication (Bearer token)
- All public API endpoints
- Request/response schemas
- Error codes
- Rate limits

#### 7.2 Integration Guide

**File**: `docs/NISC_GATEWAY_INTEGRATION_GUIDE.md`

Include:
- Getting started
- Obtaining API keys
- Making your first payment
- Handling webhooks
- Testing in sandbox
- Going to production
- Troubleshooting

#### 7.3 WordPress Plugin Guide

**File**: `docs/NISC_GATEWAY_WORDPRESS_PLUGIN.md`

Document:
- Installation steps
- Configuration (API key, environment)
- WooCommerce integration
- Testing with test orders
- Production checklist

---

### Phase 8: WordPress Plugin (Priority: LOW - Future)

#### 8.1 Plugin Structure

```
nisc-payment-gateway-wordpress/
├── nisc-payment-gateway.php (main plugin file)
├── includes/
│   ├── class-nisc-gateway.php
│   ├── class-nisc-api-client.php
│   └── class-nisc-webhook-handler.php
├── admin/
│   ├── settings.php
│   └── dashboard.php
├── assets/
│   ├── css/
│   └── js/
└── readme.txt
```

#### 8.2 WooCommerce Integration

**Class**: `Nisc_Payment_Gateway extends WC_Payment_Gateway`

**Features**:
- Settings page for API key configuration
- Payment processing via Nisc Gateway API
- Webhook receiver for payment status updates
- Order status synchronization
- Admin dashboard widget

---

### Phase 9: Agency Dashboard (Priority: LOW)

#### 9.1 Dashboard Pages

**Location**: `apps/web/src/pages/nisc-gateway/`

**Pages to create**:
- `/nisc-gateway/merchants` - List merchants
- `/nisc-gateway/merchants/:id` - Merchant details
- `/nisc-gateway/merchants/:id/credentials` - Manage credentials
- `/nisc-gateway/merchants/:id/api-keys` - Manage API keys
- `/nisc-gateway/transactions` - View all transactions
- `/nisc-gateway/analytics` - Analytics dashboard

#### 9.2 Key Features

- Create new merchant accounts
- Configure payment provider credentials (encrypted)
- Generate and manage API keys
- View transaction history
- Retry failed webhooks
- Usage analytics and charts
- Merchant onboarding wizard

---

## Security Checklist

- [ ] All credentials encrypted at rest (AES-256-GCM)
- [ ] API keys hashed with bcrypt
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Webhook signatures verified (HMAC)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using Drizzle ORM)
- [ ] XSS prevention
- [ ] HTTPS enforced
- [ ] Sensitive data not logged
- [ ] Error messages don't expose internals
- [ ] Permission checks on all agency endpoints

---

## Migration Path

### From Current System

Current M-Pesa integration can remain for agency's internal use. New gateway system runs in parallel.

**Migration Steps**:
1. Deploy Phase 1-2 (database & tRPC API)
2. Agency can start creating merchant accounts
3. Deploy Phase 3 (public API)
4. First merchant can integrate
5. Monitor and iterate
6. Scale to more merchants

### Future Payment Providers

To add a new provider (e.g., Stripe):

1. Create provider implementation: `packages/api/src/lib/payment-providers/stripe.ts`
2. Add provider enum to database schema
3. Update credential encryption to handle provider-specific fields
4. Add provider-specific webhook handler
5. Test in sandbox
6. Document in integration guide

---

## Monitoring & Alerts

### Key Metrics to Track

1. **Transaction Success Rate**
   - Target: > 95%
   - Alert if below threshold

2. **Webhook Delivery Success Rate**
   - Target: > 98%
   - Alert if below threshold

3. **API Response Time**
   - Target: p95 < 2 seconds
   - Alert if exceeded

4. **Rate Limit Hits**
   - Monitor per merchant
   - Alert on patterns

5. **Failed Credentials**
   - Alert immediately on auth failures

### Logging Strategy

**Structured Logging**:
```typescript
logger.info('gateway.payment.initiated', {
  merchantId,
  gatewayTransactionId,
  provider,
  amount,
  currency,
});

logger.error('gateway.webhook.failed', {
  merchantId,
  gatewayTransactionId,
  attempt,
  error: error.message,
});
```

---

## Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Documentation reviewed
- [ ] Environment variables configured
- [ ] Encryption keys generated and stored securely
- [ ] Database migrations tested
- [ ] Backup strategy in place

### Deployment

- [ ] Run database migrations
- [ ] Deploy API changes
- [ ] Deploy server webhook handlers
- [ ] Verify webhooks are reachable
- [ ] Test with sandbox transactions
- [ ] Monitor error logs

### Post-deployment

- [ ] Create first test merchant
- [ ] Verify full payment flow
- [ ] Check webhook delivery
- [ ] Monitor performance metrics
- [ ] Update documentation if needed

---

## Support & Troubleshooting

### Common Issues

**Issue**: "Invalid API key"
- Verify key format: `npg_{env}_{32_chars}`
- Check key is not expired
- Confirm key is active in database

**Issue**: "Webhook not received"
- Verify merchant webhook URL is accessible
- Check webhook logs in dashboard
- Retry webhook manually from dashboard

**Issue**: "Payment stuck in PROCESSING"
- Query M-Pesa directly for status
- Check if callback webhook failed
- Manually update status if needed

### Debug Mode

Enable debug logging:
```env
DEBUG_GATEWAY=true
LOG_LEVEL=debug
```

---

## Timeline Estimate

| Phase | Estimated Time | Priority |
|-------|---------------|----------|
| Phase 1: Database & Encryption | 1-2 days | HIGH |
| Phase 2: tRPC API | 2-3 days | HIGH |
| Phase 3: Public REST API | 2-3 days | HIGH |
| Phase 4: Provider Abstraction | 1-2 days | HIGH |
| Phase 5: Webhook System | 2-3 days | MEDIUM |
| Phase 6: Integration & Testing | 2-3 days | MEDIUM |
| Phase 7: Documentation | 1-2 days | MEDIUM |
| Phase 8: WordPress Plugin | 3-5 days | LOW |
| Phase 9: Dashboard UI | 3-5 days | LOW |
| **Total (Core Features)** | **~2 weeks** | - |
| **Total (Complete System)** | **~3-4 weeks** | - |

---

## Next Steps

1. **Review Architecture**: Read `NISC_PAYMENT_GATEWAY_ARCHITECTURE.md`
2. **View Workflow**: Open `nisc-gateway-flow.html` in browser
3. **Confirm Approach**: Discuss with team
4. **Start Implementation**: Begin with Phase 1

---

## Questions to Address

Before starting implementation:

1. **Merchant Onboarding**: Self-service or agency-assisted?
2. **Pricing Model**: Per-transaction fee? Monthly subscription?
3. **Provider Priority**: M-Pesa only initially, or need Stripe too?
4. **Sandbox Environment**: Separate database or same DB with flags?
5. **Multi-currency**: Support multiple currencies initially?
6. **Refunds**: Include refund functionality in v1?
7. **Compliance**: KRA/tax integration needed?

---

**Status**: Ready for implementation pending final review and approval.
