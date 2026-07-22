# Nisc Payment Gateway Architecture

## Overview

The Nisc Payment Gateway is a white-label payment processing service that allows external clients (websites, WordPress sites, mobile apps, etc.) to accept payments through various payment providers (M-Pesa, Stripe, etc.) without handling the complexity of payment gateway integration themselves.

## Core Concepts

### 1. **Merchant Accounts**
- Each client gets a merchant account in our system
- Agency users can create and manage merchant accounts
- Merchant credentials (M-Pesa consumer keys, Stripe secrets, etc.) are encrypted at rest

### 2. **API Keys**
- Each merchant account can have multiple API keys
- API keys have specific permissions (scopes)
- Keys can be rotated without disrupting service
- Usage tracking per API key

### 3. **Payment Flow**
```
External Client → Nisc Gateway API → Payment Provider (M-Pesa/Stripe) → Webhook → Nisc Gateway → Client Webhook
```

## Database Schema

### Tables to Create

#### 1. `nisc_gateway_merchant` (Merchant Accounts)
```typescript
{
  id: string (UUID)
  userId: string (reference to user.id - the customer)
  teamId: string (optional, for team-based merchants)
  
  // Merchant Details
  merchantName: string
  merchantEmail: string
  merchantPhone: string
  merchantWebsite: string
  
  // Business Information
  businessType: string (enum: 'INDIVIDUAL', 'BUSINESS', 'NGO')
  businessName: string
  businessRegistration: string (optional)
  
  // Status
  status: string (enum: 'PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED')
  
  // Settings
  settings: jsonb {
    webhookUrl: string (client's webhook URL)
    webhookSecret: string (for verifying webhooks we send to them)
    allowedOrigins: string[] (CORS origins)
    notificationEmails: string[]
  }
  
  // Metadata
  metadata: jsonb
  notes: string (agency notes)
  
  // Timestamps
  createdById: string (agency user who created it)
  createdAt: timestamp
  updatedAt: timestamp
  suspendedAt: timestamp (optional)
  closedAt: timestamp (optional)
}
```

#### 2. `nisc_gateway_merchant_credentials` (Encrypted Payment Provider Credentials)
```typescript
{
  id: string (UUID)
  merchantId: string (reference to nisc_gateway_merchant.id)
  
  // Provider Information
  provider: string (enum: 'MPESA', 'STRIPE', 'PAYPAL', 'FLUTTERWAVE')
  environment: string (enum: 'SANDBOX', 'PRODUCTION')
  
  // Encrypted Credentials
  credentialsEncrypted: text (JSON encrypted with AES-256)
  // Example decrypted structure for M-Pesa:
  // {
  //   consumerKey: string
  //   consumerSecret: string
  //   shortCode: string
  //   passkey: string
  //   callbackUrl: string (our webhook URL)
  // }
  
  // Encryption metadata
  encryptionVersion: string (to support key rotation)
  encryptedBy: string (user who set the credentials)
  
  // Status
  isActive: boolean
  
  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
  lastVerifiedAt: timestamp (optional - when credentials were last verified)
}
```

#### 3. `nisc_gateway_api_key` (API Keys for Merchants)
```typescript
{
  id: string (UUID)
  merchantId: string (reference to nisc_gateway_merchant.id) // CRITICAL: Direct merchant mapping
  
  // Key Information
  name: string (e.g., "Production Website", "WordPress Plugin")
  keyPrefix: string (e.g., "npg_live_" or "npg_test_")
  keyHash: string (bcrypt hash of the full key)
  
  // Permissions (scoped to what this key can do)
  permissions: string[] (enum: ['PAYMENT_CREATE', 'PAYMENT_READ', 'REFUND_CREATE'])
  environment: string (enum: 'SANDBOX', 'PRODUCTION')
  
  // Rate Limiting (per key)
  rateLimit: number (requests per minute, default: 100)
  
  // Status
  isActive: boolean
  expiresAt: timestamp (optional)
  lastUsedAt: timestamp
  
  // IP Restrictions (optional)
  allowedIps: string[] (optional IP whitelist for this key)
  
  // Metadata
  metadata: jsonb
  
  // Timestamps
  createdById: string (agency user or merchant user)
  createdAt: timestamp
  revokedAt: timestamp (optional)
  revokedBy: string (optional)
}
```

**Key Design Principle**: 
- API key → merchant mapping is 1:1 at call time
- Client NEVER sends merchant ID in requests
- Gateway looks up merchant from API key automatically
- This prevents impersonation and simplifies client code

#### 4. `nisc_gateway_transaction` (Gateway Transaction Records)
```typescript
{
  id: string (UUID)
  merchantId: string (reference to nisc_gateway_merchant.id)
  apiKeyId: string (which API key was used)
  
  // Original payment_transaction reference
  paymentTransactionId: string (reference to payment_transaction.id)
  
  // Client Information
  clientReferenceId: string (merchant's reference ID)
  clientMetadata: jsonb (merchant's custom data)
  
  // Provider Information
  provider: string (enum: 'MPESA', 'STRIPE', etc.)
  
  // Webhook Information
  webhookDeliveryStatus: string (enum: 'PENDING', 'DELIVERED', 'FAILED', 'NOT_CONFIGURED')
  webhookDeliveryAttempts: number
  lastWebhookAttemptAt: timestamp
  webhookDeliveredAt: timestamp
  
  // Status
  status: string (mirrors payment_transaction.status)
  
  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 5. `nisc_gateway_webhook_log` (Webhook Delivery Logs)
```typescript
{
  id: string (UUID)
  gatewayTransactionId: string (reference to nisc_gateway_transaction.id)
  merchantId: string
  
  // Request Details
  webhookUrl: string
  requestPayload: jsonb
  requestHeaders: jsonb
  
  // Response Details
  responseStatus: number
  responseBody: text
  responseHeaders: jsonb
  
  // Timing
  sentAt: timestamp
  respondedAt: timestamp
  durationMs: number
  
  // Result
  success: boolean
  errorMessage: text (optional)
  
  // Retry Information
  attemptNumber: number
  willRetry: boolean
  nextRetryAt: timestamp (optional)
}
```

#### 6. `nisc_gateway_request_log` (Detailed Request/Response Logging)
```typescript
{
  id: string (UUID)
  merchantId: string (who made the request)
  apiKeyId: string (which key was used)
  
  // Request Information
  endpoint: string (e.g., "/api/gateway/v1/payments")
  method: string (GET, POST, etc.)
  path: string (full path with query params)
  
  // Request Details (for debugging)
  requestHeaders: jsonb (sanitized - no sensitive data)
  requestBody: jsonb (sanitized - no phone numbers, amounts logged separately)
  requestSize: number (bytes)
  rawRequest: text (optional - full raw HTTP request for deep debugging)
  
  // Context
  ipAddress: string
  userAgent: string
  country: string (optional, from IP geolocation)
  
  // Response Information (for debugging)
  statusCode: number
  success: boolean
  errorCode: string (optional, e.g., "INVALID_PHONE_NUMBER")
  errorMessage: string (optional)
  responseBody: jsonb (sanitized response data)
  responseSize: number (bytes)
  rawResponse: text (optional - full raw HTTP response for deep debugging)
  
  // Timing
  timestamp: timestamp (when request started)
  durationMs: number (how long it took)
  
  // Related Records
  gatewayTransactionId: string (optional, if payment was created)
  paymentTransactionId: string (optional, link to payment_transaction)
  
  // Rate Limiting
  rateLimitRemaining: number (requests remaining in window)
  rateLimitHit: boolean (was this request rate limited?)
  
  // Indexing for Analytics (pre-computed for fast queries)
  year: number
  month: number
  day: number
  hour: number
  
  // Metadata
  metadata: jsonb (custom tracking data)
}

// Indexes for fast filtering
indexes: [
  merchantId + timestamp (merchant's request history)
  apiKeyId + timestamp (per-key usage)
  gatewayTransactionId (find all logs for a transaction)
  statusCode + timestamp (error monitoring)
  endpoint + timestamp (endpoint performance)
  ipAddress + timestamp (security monitoring)
  year + month + day (time-series analytics)
]
```

**Logging Principles**:
1. **Log Everything**: Every API call logged, no exceptions
2. **Sanitize Sensitive Data**: Never log full phone numbers, card details, PINs
3. **Enable Debugging**: Full request/response (including raw) for troubleshooting
4. **Access Control**: Merchants see only their logs, agency sees all
5. **Fast Queries**: Pre-computed time fields + proper indexes
6. **Retention**: Keep logs for compliance (e.g., 7 years for financial data)

#### 7. `nisc_gateway_access_log` (Lightweight Access Counting for Billing & Quotas)

```typescript
{
  id: string (UUID)
  merchantId: string
  apiKeyId: string
  
  // Aggregation Period (one record per hour per merchant)
  year: number
  month: number
  day: number
  hour: number
  
  // Counts by Category
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  
  // Counts by Endpoint Type
  paymentCreateRequests: number
  paymentReadRequests: number
  paymentListRequests: number
  refundRequests: number
  
  // Counts by Status
  status2xxCount: number (200-299)
  status4xxCount: number (400-499)
  status5xxCount: number (500-599)
  
  // Rate Limiting
  rateLimitHits: number
  
  // Billing Metrics
  billableRequests: number (successful payment creation only)
  
  // Timestamps
  periodStart: timestamp (start of hour)
  periodEnd: timestamp (end of hour)
  createdAt: timestamp
  updatedAt: timestamp (for increments)
}

// Composite unique index (one record per hour per merchant)
unique_index: [merchantId, year, month, day, hour]

// Indexes for queries
indexes: [
  merchantId + year + month (monthly billing)
  merchantId + year + month + day (daily usage)
  apiKeyId + year + month (per-key analytics)
]
```

**Purpose**: 
- Fast billing calculations (count requests per month)
- Quota enforcement (check against limits in real-time)
- Analytics (usage trends over time)
- Much faster than counting individual request logs

#### 8. `nisc_gateway_merchant_quota` (Usage Limits & Billing Tiers)

```typescript
{
  id: string (UUID)
  merchantId: string (reference to nisc_gateway_merchant.id)
  
  // Quota Configuration
  billingTier: string (enum: 'FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE', 'CUSTOM')
  
  // Monthly Limits
  monthlyRequestLimit: number (e.g., 10000 for FREE tier)
  monthlyBillableLimit: number (payment creations only)
  
  // Rate Limits
  requestsPerMinute: number (default 100)
  requestsPerHour: number (default 6000)
  requestsPerDay: number (default 144000)
  
  // Current Period Usage (reset monthly)
  currentPeriodStart: date
  currentPeriodEnd: date
  currentPeriodRequests: number
  currentPeriodBillable: number
  
  // Hard Limits
  hardLimitEnabled: boolean
  hardLimitThreshold: number (e.g., 110% of monthly limit)
  
  // Soft Limits (warnings)
  softLimitEnabled: boolean
  softLimitThreshold: number (e.g., 80% of monthly limit)
  softLimitNotified: boolean
  
  // Overage
  overageEnabled: boolean (allow over quota?)
  overageFeePerRequest: number (e.g., 0.01 for $0.01 per request)
  currentOverageCount: number
  currentOverageFee: number
  
  // Notifications
  notificationEmails: string[]
  
  // Status
  isActive: boolean
  quotaExceeded: boolean (hard limit reached)
  quotaWarning: boolean (soft limit reached)
  
  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
  lastResetAt: timestamp (when quota was last reset)
  quotaExceededAt: timestamp (optional)
}
```

**Billing Tiers Example**:
```typescript
const BILLING_TIERS = {
  FREE: {
    monthlyRequestLimit: 1000,
    monthlyBillableLimit: 100,
    monthlyFee: 0,
    overageEnabled: false,
  },
  STARTER: {
    monthlyRequestLimit: 10000,
    monthlyBillableLimit: 1000,
    monthlyFee: 50,
    overageEnabled: true,
    overageFeePerRequest: 0.01,
  },
  BUSINESS: {
    monthlyRequestLimit: 100000,
    monthlyBillableLimit: 10000,
    monthlyFee: 300,
    overageEnabled: true,
    overageFeePerRequest: 0.005,
  },
  ENTERPRISE: {
    monthlyRequestLimit: 1000000,
    monthlyBillableLimit: 100000,
    monthlyFee: 2000,
    overageEnabled: true,
    overageFeePerRequest: 0.002,
  },
  CUSTOM: {
    // Negotiated limits
  }
};
```

## Security Architecture

### 1. **Credential Encryption**

```typescript
// Use Node.js crypto module
import crypto from 'crypto';

// Encryption Configuration
const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.GATEWAY_ENCRYPTION_KEY; // 32-byte key from env
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Encrypt function
function encryptCredentials(credentials: object): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY, 'hex'), iv);
  
  let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Decrypt function
function decryptCredentials(encryptedData: string): object {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}
```

### 2. **API Key Format & Merchant Resolution**

```
Format: npg_{environment}_{random}

Examples:
- npg_live_4a8f3e7c9b2d1f6e8a4b7c9d2e5f8a3b
- npg_test_9d2e5f8a3b4a8f3e7c9b2d1f6e8a4b7c

Prefix breakdown:
- npg: Nisc Payment Gateway
- live/test: Environment indicator
- {random}: 32-character random string

Storage:
- Only hash is stored in database (using bcrypt)
- Full key shown ONCE during creation
- Each key is directly linked to ONE merchant account via merchantId foreign key
```

**Authentication & Merchant Resolution Flow**:

```typescript
// Middleware: apps/server/src/middleware/gateway-auth.ts

async function gatewayAuth(request: Request) {
  // 1. Extract API key from header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing API key');
  }
  
  const apiKey = authHeader.substring(7);
  
  // 2. Validate key format
  if (!apiKey.match(/^npg_(live|test)_[a-f0-9]{32}$/)) {
    throw new UnauthorizedError('Invalid API key format');
  }
  
  // 3. Look up key in database (by hash)
  const keyHash = await bcrypt.hash(apiKey, 10);
  const keyRecord = await db.query.niscGatewayApiKey.findFirst({
    where: eq(niscGatewayApiKey.keyHash, keyHash),
    with: {
      merchant: true  // JOIN with merchant table
    }
  });
  
  if (!keyRecord) {
    throw new UnauthorizedError('Invalid API key');
  }
  
  // 4. Validate key status
  if (!keyRecord.isActive) {
    throw new UnauthorizedError('API key has been revoked');
  }
  
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    throw new UnauthorizedError('API key has expired');
  }
  
  // 5. Check merchant status
  if (keyRecord.merchant.status !== 'ACTIVE') {
    throw new ForbiddenError('Merchant account is not active');
  }
  
  // 6. Check IP restrictions (if configured)
  if (keyRecord.allowedIps && keyRecord.allowedIps.length > 0) {
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip');
    if (!keyRecord.allowedIps.includes(clientIp)) {
      throw new ForbiddenError('IP address not allowed');
    }
  }
  
  // 7. Check rate limits
  const rateLimitKey = `gateway:ratelimit:${keyRecord.id}`;
  const requestCount = await redis.incr(rateLimitKey);
  
  if (requestCount === 1) {
    await redis.expire(rateLimitKey, 60); // 1 minute window
  }
  
  if (requestCount > keyRecord.rateLimit) {
    throw new RateLimitError('Rate limit exceeded');
  }
  
  // 8. Update last used timestamp (async, don't block request)
  db.update(niscGatewayApiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(niscGatewayApiKey.id, keyRecord.id))
    .catch(err => console.error('Failed to update lastUsedAt:', err));
  
  // 9. Attach merchant context to request
  // Now all downstream code can access merchant via request.merchant
  request.merchant = {
    id: keyRecord.merchant.id,
    name: keyRecord.merchant.merchantName,
    email: keyRecord.merchant.merchantEmail,
    settings: keyRecord.merchant.settings,
    apiKeyId: keyRecord.id,
    apiKeyName: keyRecord.name,
    permissions: keyRecord.permissions,
    environment: keyRecord.environment,
    rateLimitRemaining: keyRecord.rateLimit - requestCount
  };
  
  return request;
}
```

**Key Benefits**:
- ✅ Client never sends merchant ID (prevents impersonation)
- ✅ Automatic credential lookup (simpler client code)
- ✅ Built-in access control (permissions per key)
- ✅ IP restrictions per key (enhanced security)
- ✅ Rate limiting per key (prevent abuse)
- ✅ One key can only access one merchant's data

### 3. **Webhook Security**

```typescript
// Client webhook signature generation
function generateWebhookSignature(payload: object, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Client should verify webhook like this:
// const signature = request.headers['x-nisc-signature'];
// const expectedSignature = generateWebhookSignature(request.body, merchantWebhookSecret);
// if (signature !== expectedSignature) throw new Error('Invalid signature');
```

## API Endpoints

### Public Gateway API (for external clients)

#### Base URL: `https://api.nisccloud.com/gateway/v1`

#### 1. **Create Payment**
```
POST /payments

Headers:
- Authorization: Bearer {apiKey}  // THIS IS ALL THAT'S NEEDED - we lookup merchant from key
- Content-Type: application/json
- X-Idempotency-Key: {uuid} (optional, prevents duplicate payments)

Body:
{
  // NO merchantId needed - we get it from API key automatically!
  "provider": "mpesa",  // or "stripe", "paypal" - must be configured for this merchant
  "amount": 1000,
  "currency": "KES",
  "phoneNumber": "254712345678",  // for M-Pesa
  "reference": "ORDER-12345",  // merchant's reference
  "description": "Payment for Order #12345",
  "callbackUrl": "https://merchant.com/webhook", // optional override (uses merchant default if not provided)
  "metadata": {
    // Merchant's custom data - returned in webhooks
    "orderId": "12345",
    "customerId": "678"
  }
}

Response:
{
  "success": true,
  "data": {
    "gatewayTransactionId": "gtx_abc123...",
    "checkoutRequestId": "ws_CO_123...",
    "status": "PROCESSING",
    "message": "Payment initiated successfully",
    "merchantReference": "ORDER-12345"  // echo back their reference
  }
}

// How it works internally:
// 1. Extract API key from Authorization header
// 2. Look up merchant from nisc_gateway_api_key.merchantId
// 3. Load merchant's M-Pesa credentials from nisc_gateway_merchant_credentials
// 4. Decrypt credentials
// 5. Initiate STK Push using merchant's credentials
// 6. Log request to nisc_gateway_request_log
// 7. Create gateway transaction record
// 8. Return response
```

#### 2. **Get Payment Status**
```
GET /payments/{gatewayTransactionId}

Headers:
- Authorization: Bearer {apiKey}

Response:
{
  "success": true,
  "data": {
    "gatewayTransactionId": "gtx_abc123...",
    "reference": "ORDER-12345",
    "status": "SUCCESS",
    "amount": "1000",
    "currency": "KES",
    "provider": "mpesa",
    "providerReference": "MPESA-REF-123",
    "completedAt": "2026-07-22T12:00:00Z",
    "metadata": {
      "orderId": "12345"
    }
  }
}
```

#### 3. **List Payments**
```
GET /payments?limit=50&offset=0&status=SUCCESS

Headers:
- Authorization: Bearer {apiKey}

Response:
{
  "success": true,
  "data": {
    "payments": [...],
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

#### 4. **Webhook Event**
```
POST {merchant.settings.webhookUrl}

Headers:
- X-Nisc-Signature: {signature}
- X-Nisc-Event: payment.success
- Content-Type: application/json

Body:
{
  "event": "payment.success",
  "gatewayTransactionId": "gtx_abc123...",
  "reference": "ORDER-12345",
  "status": "SUCCESS",
  "amount": "1000",
  "currency": "KES",
  "provider": "mpesa",
  "providerReference": "MPESA-REF-123",
  "completedAt": "2026-07-22T12:00:00Z",
  "metadata": {
    "orderId": "12345"
  }
}
```

### Agency Internal API (tRPC)

```typescript
// @npanel/api/routers/nisc-gateway/

// Merchants
- createMerchant
- listMerchants
- getMerchant
- updateMerchant
- suspendMerchant
- activateMerchant

// Credentials
- setProviderCredentials
- verifyProviderCredentials
- removeProviderCredentials
- listProviderCredentials

// API Keys
- createApiKey
- listApiKeys
- revokeApiKey
- getApiKeyUsage

// Transactions
- listGatewayTransactions
- getGatewayTransaction
- retryWebhook

// Analytics
- getMerchantAnalytics
- getUsageMetrics
```

## Implementation Phases

### Phase 1: Core Infrastructure ✅
1. Create database schema and migrations
2. Implement credential encryption system
3. Create tRPC routers for agency management

### Phase 2: Public API 🚀
1. Implement public REST API endpoints
2. Add API key authentication middleware
3. Create payment initiation flow
4. Add transaction status checking

### Phase 3: Webhook System 📡
1. Implement webhook forwarding logic
2. Add retry mechanism with exponential backoff
3. Create webhook delivery logs
4. Add signature verification

### Phase 4: Provider Abstraction 🔌
1. Create payment provider interface
2. Implement M-Pesa adapter
3. Add provider credential validation
4. Test end-to-end flow

### Phase 5: WordPress Integration 📦
1. Create WordPress plugin boilerplate
2. Implement WooCommerce integration
3. Add plugin settings UI
4. Publish documentation

### Phase 6: Dashboard & Monitoring 📊
1. Build agency dashboard for gateway management
2. Add merchant onboarding flow
3. Create usage analytics
4. Add alerting for failed webhooks

## WordPress Plugin Architecture

```php
/**
 * Nisc Payment Gateway for WordPress/WooCommerce
 * 
 * Settings:
 * - API Key
 * - Environment (Sandbox/Production)
 * - Webhook URL (auto-configured)
 */

class Nisc_Payment_Gateway extends WC_Payment_Gateway {
    private $api_key;
    private $api_url = 'https://api.nisccloud.com/gateway/v1';
    
    public function process_payment($order_id) {
        $order = wc_get_order($order_id);
        
        $response = wp_remote_post($this->api_url . '/payments', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json'
            ],
            'body' => json_encode([
                'provider' => 'mpesa',
                'amount' => $order->get_total(),
                'currency' => $order->get_currency(),
                'phoneNumber' => $order->get_billing_phone(),
                'reference' => $order->get_order_number(),
                'description' => 'Order #' . $order->get_order_number(),
                'metadata' => [
                    'orderId' => $order_id
                ]
            ])
        ]);
        
        // Handle response...
    }
    
    public function webhook() {
        // Verify signature
        $signature = $_SERVER['HTTP_X_NISC_SIGNATURE'];
        $payload = file_get_contents('php://input');
        
        // Verify webhook...
        // Update order status...
    }
}
```

## Environment Variables

```env
# Gateway Encryption
GATEWAY_ENCRYPTION_KEY=64_character_hex_string

# Gateway URLs
GATEWAY_PUBLIC_API_URL=https://api.nisccloud.com/gateway/v1
GATEWAY_WEBHOOK_BASE_URL=https://api.nisccloud.com/gateway/webhooks

# Rate Limiting
GATEWAY_RATE_LIMIT_DEFAULT=100
GATEWAY_RATE_LIMIT_WINDOW_MS=60000

# Webhook Retry Configuration
GATEWAY_WEBHOOK_MAX_RETRIES=5
GATEWAY_WEBHOOK_RETRY_BACKOFF_MS=1000
```

## Error Handling

```typescript
// Standard error response format
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "The customer has insufficient funds",
    "retryable": false
  }
}

// Error codes:
- INVALID_API_KEY
- EXPIRED_API_KEY
- RATE_LIMIT_EXCEEDED
- INSUFFICIENT_FUNDS
- INVALID_PHONE_NUMBER
- PROVIDER_ERROR
- WEBHOOK_DELIVERY_FAILED
- TRANSACTION_NOT_FOUND
- MERCHANT_SUSPENDED
```

## Rate Limiting

```typescript
// Implement using Redis
const rateLimit = {
  windowMs: 60000, // 1 minute
  max: 100, // requests per window
  keyGenerator: (apiKey: string) => `gateway:ratelimit:${apiKey}`,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: 60
      }
    });
  }
};
```

## Comprehensive Logging System

### Request Logging Middleware

```typescript
// Middleware: apps/server/src/middleware/gateway-request-logger.ts

async function logGatewayRequest(request: Request, response: Response) {
  const startTime = Date.now();
  const merchant = request.merchant; // From gateway-auth middleware
  
  // Sanitize request body (never log sensitive data)
  const sanitizedBody = sanitizeRequestBody(request.body);
  
  try {
    // Process request...
    const result = await next();
    
    // 1. Log detailed request (for debugging)
    await db.insert(niscGatewayRequestLog).values({
      id: crypto.randomUUID(),
      merchantId: merchant.id,
      apiKeyId: merchant.apiKeyId,
      
      // Request details
      endpoint: request.path,
      method: request.method,
      path: request.url,
      requestHeaders: sanitizeHeaders(request.headers),
      requestBody: sanitizedBody,
      requestSize: JSON.stringify(request.body).length,
      rawRequest: DEBUG_MODE ? request.raw : null,  // Optional: full raw request
      
      // Context
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
      
      // Response details
      statusCode: response.status,
      success: response.status >= 200 && response.status < 300,
      responseBody: sanitize(result),
      responseSize: JSON.stringify(result).length,
      rawResponse: DEBUG_MODE ? JSON.stringify(result) : null,  // Optional: full raw response
      
      // Timing
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
      
      // Related records
      gatewayTransactionId: result.data?.gatewayTransactionId || null,
      
      // Rate limiting
      rateLimitRemaining: merchant.rateLimitRemaining,
      rateLimitHit: false,
      
      // Time-series indexing
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      hour: new Date().getHours(),
    });
    
    // 2. Increment access log (for billing & quotas)
    await incrementAccessLog({
      merchantId: merchant.id,
      apiKeyId: merchant.apiKeyId,
      endpoint: request.path,
      statusCode: response.status,
      success: response.status >= 200 && response.status < 300,
      isBillable: isBillableRequest(request.path, result),
    });
    
    return result;
    
  } catch (error) {
    // Log failed request
    await db.insert(niscGatewayRequestLog).values({
      id: crypto.randomUUID(),
      merchantId: merchant.id,
      apiKeyId: merchant.apiKeyId,
      endpoint: request.path,
      method: request.method,
      path: request.url,
      requestHeaders: sanitizeHeaders(request.headers),
      requestBody: sanitizedBody,
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      
      // Error details
      statusCode: error.statusCode || 500,
      success: false,
      errorCode: error.code,
      errorMessage: error.message,
      
      // Timing
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
      
      // Rate limiting
      rateLimitRemaining: merchant.rateLimitRemaining,
      rateLimitHit: error instanceof RateLimitError,
      
      // Time-series
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      hour: new Date().getHours(),
    });
    
    throw error;
  }
}

// Sanitization helpers
function sanitizeRequestBody(body: any): any {
  if (!body) return null;
  
  const sanitized = { ...body };
  
  // Never log full phone numbers (mask middle digits)
  if (sanitized.phoneNumber) {
    sanitized.phoneNumber = sanitized.phoneNumber.replace(
      /(\d{3})\d{6}(\d{3})/,
      '$1******$2'
    );
  }
  
  // Remove sensitive metadata
  if (sanitized.metadata?.cardNumber) {
    delete sanitized.metadata.cardNumber;
  }
  
  return sanitized;
}

function sanitizeHeaders(headers: Headers): object {
  const sanitized: any = {};
  
  for (const [key, value] of headers.entries()) {
    // Never log authorization tokens
    if (key.toLowerCase() === 'authorization') {
      sanitized[key] = 'Bearer npg_***';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Helper: determine if request is billable
function isBillableRequest(endpoint: string, result: any): boolean {
  // Only successful payment creations are billable
  if (endpoint === '/api/gateway/v1/payments' && result.success) {
    return true;
  }
  
  // Payment queries, webhook deliveries are NOT billable
  return false;
}
```

### 2. Access Log Aggregation (Lightweight)

```typescript
// Function: apps/server/src/lib/gateway-access-log.ts

async function incrementAccessLog(params: {
  merchantId: string;
  apiKeyId: string;
  endpoint: string;
  statusCode: number;
  success: boolean;
  isBillable: boolean;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  
  // Determine endpoint category
  const category = categorizeEndpoint(params.endpoint);
  
  // Upsert (increment if exists, create if not)
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
      
      // Counts (start at 1)
      totalRequests: 1,
      successfulRequests: params.success ? 1 : 0,
      failedRequests: params.success ? 0 : 1,
      
      // By endpoint type
      paymentCreateRequests: category === 'payment_create' ? 1 : 0,
      paymentReadRequests: category === 'payment_read' ? 1 : 0,
      paymentListRequests: category === 'payment_list' ? 1 : 0,
      refundRequests: category === 'refund' ? 1 : 0,
      
      // By status code
      status2xxCount: params.statusCode >= 200 && params.statusCode < 300 ? 1 : 0,
      status4xxCount: params.statusCode >= 400 && params.statusCode < 500 ? 1 : 0,
      status5xxCount: params.statusCode >= 500 && params.statusCode < 600 ? 1 : 0,
      
      // Rate limiting
      rateLimitHits: 0,
      
      // Billing
      billableRequests: params.isBillable ? 1 : 0,
      
      // Period
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
        // Increment counts
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
        
        // Increment by status
        status2xxCount: params.statusCode >= 200 && params.statusCode < 300
          ? sql`${niscGatewayAccessLog.status2xxCount} + 1`
          : sql`${niscGatewayAccessLog.status2xxCount}`,
        // ... similar for 4xx and 5xx
        
        // Billing
        billableRequests: params.isBillable
          ? sql`${niscGatewayAccessLog.billableRequests} + 1`
          : sql`${niscGatewayAccessLog.billableRequests}`,
        
        updatedAt: now,
      },
    });
  
  // Also update merchant's current period quota (async, don't block)
  updateMerchantQuota(params.merchantId, params.isBillable).catch(console.error);
}

function categorizeEndpoint(endpoint: string): string {
  if (endpoint === '/api/gateway/v1/payments' && method === 'POST') {
    return 'payment_create';
  }
  if (endpoint.match(/\/api\/gateway\/v1\/payments\/[^\/]+$/)) {
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

### 3. Quota Enforcement Middleware

```typescript
// Middleware: apps/server/src/middleware/gateway-quota-check.ts

async function checkQuota(request: Request) {
  const merchant = request.merchant; // From auth middleware
  
  // Load merchant quota
  const quota = await db.query.niscGatewayMerchantQuota.findFirst({
    where: eq(niscGatewayMerchantQuota.merchantId, merchant.id),
  });
  
  if (!quota) {
    // No quota configured, allow (or create default FREE tier)
    return;
  }
  
  // Check if hard limit reached
  if (quota.hardLimitEnabled && quota.quotaExceeded) {
    throw new QuotaExceededError(
      `Monthly limit of ${quota.monthlyRequestLimit} requests exceeded. ` +
      `Upgrade your plan or contact support.`
    );
  }
  
  // Check if approaching soft limit (send warning)
  if (quota.softLimitEnabled && !quota.softLimitNotified) {
    const usagePercent = (quota.currentPeriodRequests / quota.monthlyRequestLimit) * 100;
    
    if (usagePercent >= quota.softLimitThreshold) {
      // Send warning email (async, don't block)
      sendQuotaWarningEmail(quota).catch(console.error);
      
      // Mark as notified
      await db.update(niscGatewayMerchantQuota)
        .set({ 
          softLimitNotified: true,
          quotaWarning: true,
        })
        .where(eq(niscGatewayMerchantQuota.id, quota.id));
    }
  }
  
  // Allow request to proceed
}

async function updateMerchantQuota(merchantId: string, isBillable: boolean) {
  await db
    .update(niscGatewayMerchantQuota)
    .set({
      currentPeriodRequests: sql`${niscGatewayMerchantQuota.currentPeriodRequests} + 1`,
      currentPeriodBillable: isBillable
        ? sql`${niscGatewayMerchantQuota.currentPeriodBillable} + 1`
        : sql`${niscGatewayMerchantQuota.currentPeriodBillable}`,
      updatedAt: new Date(),
    })
    .where(eq(niscGatewayMerchantQuota.merchantId, merchantId));
  
  // Check if hard limit reached
  const [updated] = await db
    .select()
    .from(niscGatewayMerchantQuota)
    .where(eq(niscGatewayMerchantQuota.merchantId, merchantId));
  
  if (updated.hardLimitEnabled && 
      updated.currentPeriodRequests >= updated.hardLimitThreshold) {
    await db
      .update(niscGatewayMerchantQuota)
      .set({
        quotaExceeded: true,
        quotaExceededAt: new Date(),
      })
      .where(eq(niscGatewayMerchantQuota.merchantId, merchantId));
    
    // Send alert email
    sendQuotaExceededEmail(updated).catch(console.error);
  }
}
```

### Log Access Control

```typescript
// tRPC endpoint: packages/api/src/routers/nisc-gateway/logs.ts

export const logsRouter = router({
  // Merchants can only see their own logs
  listMyLogs: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      endpoint: z.string().optional(),
      statusCode: z.number().optional(),
      success: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Get merchant account for this user
      const merchant = await getMerchantForUser(ctx.session.user.id);
      
      if (!merchant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No merchant account found',
        });
      }
      
      // Query logs filtered by merchantId
      const logs = await db.query.niscGatewayRequestLog.findMany({
        where: and(
          eq(niscGatewayRequestLog.merchantId, merchant.id),
          input.startDate ? gte(niscGatewayRequestLog.timestamp, input.startDate) : undefined,
          input.endDate ? lte(niscGatewayRequestLog.timestamp, input.endDate) : undefined,
          input.endpoint ? eq(niscGatewayRequestLog.endpoint, input.endpoint) : undefined,
          input.statusCode ? eq(niscGatewayRequestLog.statusCode, input.statusCode) : undefined,
          input.success !== undefined ? eq(niscGatewayRequestLog.success, input.success) : undefined,
        ),
        orderBy: desc(niscGatewayRequestLog.timestamp),
        limit: input.limit,
        offset: input.offset,
      });
      
      return logs;
    }),
  
  // Agency users can see ALL logs with merchant filter
  listAllLogs: protectedProcedure
    .input(z.object({
      merchantId: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check if user is agency admin
      const user = await getAuthenticatedUser(ctx);
      
      if (!isAgencyUser(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only agency users can view all logs',
        });
      }
      
      // Query all logs (optionally filtered by merchant)
      const logs = await db.query.niscGatewayRequestLog.findMany({
        where: and(
          input.merchantId ? eq(niscGatewayRequestLog.merchantId, input.merchantId) : undefined,
          input.startDate ? gte(niscGatewayRequestLog.timestamp, input.startDate) : undefined,
          input.endDate ? lte(niscGatewayRequestLog.timestamp, input.endDate) : undefined,
        ),
        orderBy: desc(niscGatewayRequestLog.timestamp),
        limit: input.limit,
        offset: input.offset,
        with: {
          merchant: true,  // Include merchant details
          apiKey: true,    // Include API key details
        }
      });
      
      return logs;
    }),
  
  // Get log analytics
  getAnalytics: protectedProcedure
    .input(z.object({
      merchantId: z.string().optional(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      
      // Determine merchant filter
      let merchantId = input.merchantId;
      
      if (!isAgencyUser(user.role)) {
        // Non-agency users can only see their own merchant
        const merchant = await getMerchantForUser(user.id);
        if (!merchant) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        merchantId = merchant.id;
      }
      
      // Aggregate analytics
      const analytics = await db
        .select({
          totalRequests: count(),
          successfulRequests: count(sql`CASE WHEN success = true THEN 1 END`),
          failedRequests: count(sql`CASE WHEN success = false THEN 1 END`),
          avgDuration: avg(niscGatewayRequestLog.durationMs),
          p95Duration: sql`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${niscGatewayRequestLog.durationMs})`,
          totalRateLimitHits: count(sql`CASE WHEN rate_limit_hit = true THEN 1 END`),
        })
        .from(niscGatewayRequestLog)
        .where(and(
          merchantId ? eq(niscGatewayRequestLog.merchantId, merchantId) : undefined,
          gte(niscGatewayRequestLog.timestamp, input.startDate),
          lte(niscGatewayRequestLog.timestamp, input.endDate),
        ));
      
      return analytics[0];
    }),
});
```

### What Gets Logged

✅ **Every API Request**:
- Endpoint, method, path
- Request headers (sanitized)
- Request body (sanitized - phone numbers masked)
- IP address, user agent
- Response status, size
- Duration, timestamp
- Associated merchant & API key
- Rate limit status

✅ **Filtered Access**:
- Merchants see only their logs
- Agency sees all logs
- Searchable by date, endpoint, status
- Real-time analytics

✅ **Compliance Ready**:
- 7-year retention for financial logs
- Audit trail for all actions
- Tamper-evident (append-only)
- Export capability

## Billing Calculations

### Monthly Bill Calculation

```typescript
// Calculate merchant's monthly bill
async function calculateMonthlyBill(merchantId: string, year: number, month: number) {
  // 1. Get merchant's billing tier
  const quota = await db.query.niscGatewayMerchantQuota.findFirst({
    where: eq(niscGatewayMerchantQuota.merchantId, merchantId),
  });
  
  const tier = BILLING_TIERS[quota.billingTier];
  
  // 2. Sum billable requests from access logs (FAST!)
  const [usage] = await db
    .select({
      totalBillable: sum(niscGatewayAccessLog.billableRequests),
      totalRequests: sum(niscGatewayAccessLog.totalRequests),
    })
    .from(niscGatewayAccessLog)
    .where(and(
      eq(niscGatewayAccessLog.merchantId, merchantId),
      eq(niscGatewayAccessLog.year, year),
      eq(niscGatewayAccessLog.month, month),
    ));
  
  // 3. Calculate base fee
  let totalFee = tier.monthlyFee;
  
  // 4. Calculate overage (if applicable)
  if (tier.overageEnabled && usage.totalBillable > quota.monthlyBillableLimit) {
    const overage = usage.totalBillable - quota.monthlyBillableLimit;
    const overageFee = overage * tier.overageFeePerRequest;
    totalFee += overageFee;
  }
  
  return {
    merchantId,
    period: `${year}-${month}`,
    billingTier: quota.billingTier,
    
    // Usage
    totalRequests: usage.totalRequests,
    billableRequests: usage.totalBillable,
    includedRequests: quota.monthlyBillableLimit,
    overageRequests: Math.max(0, usage.totalBillable - quota.monthlyBillableLimit),
    
    // Fees
    baseFee: tier.monthlyFee,
    overageFee: tier.overageEnabled 
      ? Math.max(0, usage.totalBillable - quota.monthlyBillableLimit) * tier.overageFeePerRequest
      : 0,
    totalFee,
  };
}

// Example output:
{
  merchantId: "merchant-xyz",
  period: "2026-07",
  billingTier: "STARTER",
  
  totalRequests: 15000,          // All API calls
  billableRequests: 1500,        // Payment creations only
  includedRequests: 1000,        // Tier limit
  overageRequests: 500,          // Over limit
  
  baseFee: 50.00,                // Monthly subscription
  overageFee: 5.00,              // 500 × $0.01
  totalFee: 55.00                // Total bill
}
```

### Real-Time Quota Check (Fast)

```typescript
// Check if merchant can make more requests (called on EVERY request)
async function checkRemainingQuota(merchantId: string): Promise<{
  allowed: boolean;
  remaining: number;
  percentUsed: number;
}> {
  // Get quota config
  const quota = await db.query.niscGatewayMerchantQuota.findFirst({
    where: eq(niscGatewayMerchantQuota.merchantId, merchantId),
  });
  
  if (!quota) {
    return { allowed: true, remaining: Infinity, percentUsed: 0 };
  }
  
  // Current period usage is stored directly in quota table (updated on each request)
  const remaining = quota.monthlyRequestLimit - quota.currentPeriodRequests;
  const percentUsed = (quota.currentPeriodRequests / quota.monthlyRequestLimit) * 100;
  
  // Check hard limit
  if (quota.hardLimitEnabled && remaining <= 0) {
    return { allowed: false, remaining: 0, percentUsed: 100 };
  }
  
  return {
    allowed: true,
    remaining: Math.max(0, remaining),
    percentUsed,
  };
}
```

### Usage Analytics (Fast)

```typescript
// Get merchant usage by day (for charts)
async function getUsageByDay(merchantId: string, year: number, month: number) {
  // Query access logs (aggregated by hour)
  const logs = await db
    .select({
      day: niscGatewayAccessLog.day,
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
      eq(niscGatewayAccessLog.year, year),
      eq(niscGatewayAccessLog.month, month),
    ))
    .groupBy(niscGatewayAccessLog.day)
    .orderBy(niscGatewayAccessLog.day);
  
  return logs;
}

// Example output for charts:
[
  { day: 1, totalRequests: 450, billableRequests: 45, successRate: 98.5 },
  { day: 2, totalRequests: 520, billableRequests: 52, successRate: 99.1 },
  // ... one row per day
]
```

### Monthly Quota Reset

```typescript
// Cron job: Reset quotas on 1st of month
async function resetMonthlyQuotas() {
  const now = new Date();
  const newPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  await db.update(niscGatewayMerchantQuota)
    .set({
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      currentPeriodRequests: 0,
      currentPeriodBillable: 0,
      currentOverageCount: 0,
      currentOverageFee: 0,
      softLimitNotified: false,
      quotaExceeded: false,
      quotaWarning: false,
      lastResetAt: now,
      updatedAt: now,
    })
    .where(eq(niscGatewayMerchantQuota.isActive, true));
}
```

## Monitoring & Alerts

1. **Transaction Success Rate**: Alert if < 95%
2. **Webhook Delivery Success Rate**: Alert if < 98%
3. **API Response Time**: Alert if p95 > 2s
4. **Failed Credentials**: Alert on authentication failures
5. **Suspicious Activity**: Alert on unusual patterns
6. **Rate Limit Abuse**: Alert on excessive rate limit hits
7. **Error Spikes**: Alert on sudden increase in 4xx/5xx errors
8. **Quota Warnings**: Alert merchant at 80% usage (soft limit)
9. **Quota Exceeded**: Alert merchant when hard limit reached
10. **Billing Anomalies**: Alert on unusual usage spikes

## Testing Strategy

1. **Unit Tests**: Encryption, signature generation, validation logic
2. **Integration Tests**: Full payment flow with mock providers
3. **E2E Tests**: Real transactions in sandbox mode
4. **Load Tests**: Handle 1000 concurrent requests
5. **Security Tests**: Penetration testing, credential safety

## Documentation Deliverables

1. **API Reference**: OpenAPI/Swagger documentation
2. **Integration Guide**: Step-by-step for developers
3. **WordPress Plugin Guide**: Installation and configuration
4. **Security Best Practices**: For merchants
5. **Troubleshooting Guide**: Common issues and solutions

---
