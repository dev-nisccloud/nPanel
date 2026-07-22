# Nisc Payment Gateway - Quick Start

## What is it?

A white-label payment processing gateway that allows external clients (WordPress sites, apps, etc.) to accept payments through your system without handling payment gateway complexity themselves.

## Key Features

✅ **Multi-Provider Support**: Start with M-Pesa, expand to Stripe, PayPal, etc.  
✅ **Encrypted Credentials**: All payment provider credentials encrypted with AES-256  
✅ **API Key Authentication**: Secure token-based access for external clients  
✅ **Webhook Forwarding**: Automatic payment status notifications to clients  
✅ **WordPress Plugin Ready**: Architecture supports future plugin development  
✅ **Agency Control**: Full management via nPanel dashboard  

## How it Works

```
WordPress Site → Nisc Gateway API → M-Pesa → Customer Phone → Webhook → WordPress Site
```

**See**: `nisc-gateway-flow.html` for visual workflow diagram

## Files Created

### Documentation
- `NISC_PAYMENT_GATEWAY_ARCHITECTURE.md` - Complete technical architecture
- `NISC_PAYMENT_GATEWAY_IMPLEMENTATION_GUIDE.md` - Step-by-step implementation
- `NISC_GATEWAY_QUICK_START.md` - This file
- `nisc-gateway-flow.html` - Interactive workflow diagram

### Code (To Be Created)

#### Database Schema
- `packages/db/src/schema/nisc-gateway.ts`

#### API Layer
- `packages/api/src/routers/nisc-gateway/index.ts` (tRPC for agency)
- `packages/api/src/lib/gateway-encryption.ts` (credential encryption)
- `packages/api/src/lib/gateway-api-key.ts` (API key management)
- `packages/api/src/lib/gateway-webhook-forwarder.ts` (webhook delivery)
- `packages/api/src/lib/payment-providers/base.ts` (provider interface)
- `packages/api/src/lib/payment-providers/mpesa.ts` (M-Pesa adapter)

#### Server Routes
- `apps/server/src/api/gateway/payments.ts` (public REST API)
- `apps/server/src/api/gateway/webhooks.ts` (provider callbacks)
- `apps/server/src/middleware/gateway-auth.ts` (API key auth)

#### Dashboard UI
- `apps/web/src/pages/nisc-gateway/*` (management interface)

## Implementation Phases

### Phase 1: Core Foundation (Week 1)
- ✅ Database schema (6 tables)
- ✅ Encryption system (AES-256-GCM)
- ✅ tRPC API for agency management
- ✅ Public REST API endpoints

### Phase 2: Payment Processing (Week 2)
- ✅ Provider abstraction layer
- ✅ M-Pesa integration
- ✅ Webhook forwarding system
- ✅ Rate limiting & security

### Phase 3: Polish (Week 3-4)
- ⏳ Agency dashboard UI
- ⏳ Complete testing
- ⏳ Documentation
- ⏳ WordPress plugin (future)

## API Example

### For External Clients

```javascript
// Client (WordPress) makes payment request
// NOTICE: No merchant ID needed - it's derived from API key!
const response = await fetch('https://api.nisccloud.com/gateway/v1/payments', {
  method: 'POST',
  headers: {
    // THIS IS ALL YOU NEED - API key identifies the merchant
    'Authorization': 'Bearer npg_live_4a8f3e7c9b2d1f6e8a4b7c9d2e5f8a3b',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // NO merchantId field - gateway knows from API key
    provider: 'mpesa',
    amount: 1000,
    currency: 'KES',
    phoneNumber: '254712345678',
    reference: 'ORDER-12345',
    description: 'Payment for Order #12345',
    metadata: {
      orderId: '12345',
      customerId: '678'
    }
  })
});

// What happens on the backend:
// 1. Gateway extracts API key from header
// 2. Looks up merchant: SELECT * FROM api_key JOIN merchant
// 3. Validates merchant is active
// 4. Loads merchant's M-Pesa credentials (encrypted)
// 5. Decrypts credentials
// 6. Initiates STK Push using merchant's credentials
// 7. Logs request with merchant context
// 8. Returns response

// Response
{
  "success": true,
  "data": {
    "gatewayTransactionId": "gtx_abc123...",
    "checkoutRequestId": "ws_CO_123...",
    "status": "PROCESSING",
    "message": "Payment initiated successfully"
  }
}

// Client receives webhook when payment completes
// POST https://client-site.com/webhook
// Headers: X-Nisc-Signature, X-Nisc-Event
{
  "event": "payment.success",
  "gatewayTransactionId": "gtx_abc123...",
  "reference": "ORDER-12345",
  "status": "SUCCESS",
  "amount": "1000",
  "currency": "KES",
  "providerReference": "MPESA-REF-123",
  "completedAt": "2026-07-22T12:00:00Z"
}
```

## Security Features

🔒 **AES-256-GCM Encryption** for all provider credentials  
🔒 **Bcrypt Hashing** for API keys  
🔒 **HMAC-SHA256 Signatures** for webhooks  
🔒 **Rate Limiting** (100 req/min default, per API key)  
🔒 **CORS Validation**  
🔒 **IP Allowlisting** (optional, per API key)  
🔒 **API Key → Merchant Mapping** (prevents impersonation)  
🔒 **Comprehensive Request Logging** (every call logged)  

## Database Tables

### Phase 1 (Implement Now)

1. **nisc_gateway_merchant** - Merchant accounts
2. **nisc_gateway_merchant_credentials** - Encrypted provider credentials
3. **nisc_gateway_api_key** - API keys with direct merchantId mapping
4. **nisc_gateway_transaction** - Transaction records
5. **nisc_gateway_webhook_log** - Webhook delivery logs
6. **nisc_gateway_request_log** - Detailed request/response logs
7. **nisc_gateway_access_log** - **Aggregated usage counts (START NOW!)**

### Phase 2 (Add Later)

8. **nisc_gateway_merchant_quota** - Billing tiers & limits (when pricing ready)

### Key Design: API Key → Merchant Mapping

```
API Key (npg_live_xxx) → merchantId (FK) → Merchant Account → Encrypted Credentials
                                                             ↓
                                            Used to initiate payment (M-Pesa STK)
```

**Benefits**:
- ✅ Client never sends merchant ID (security)
- ✅ Prevents merchant impersonation
- ✅ Simpler client code
- ✅ Automatic credential lookup
- ✅ Per-key permissions and rate limits

## Environment Variables Required

```env
# Encryption (REQUIRED)
GATEWAY_ENCRYPTION_KEY=<64_character_hex_string>

# API Configuration
GATEWAY_PUBLIC_API_URL=https://api.nisccloud.com/gateway/v1
GATEWAY_WEBHOOK_BASE_URL=https://api.nisccloud.com/gateway/webhooks

# Rate Limiting
GATEWAY_RATE_LIMIT_DEFAULT=100
GATEWAY_RATE_LIMIT_WINDOW_MS=60000

# Webhook Retry
GATEWAY_WEBHOOK_MAX_RETRIES=5
GATEWAY_WEBHOOK_RETRY_BACKOFF_MS=1000
```

**Generate encryption key**:
```bash
openssl rand -hex 32
```

## WordPress Plugin (Future)

```php
// Client-side code example
class Nisc_Payment_Gateway extends WC_Payment_Gateway {
    private $api_key = 'npg_live_...';
    private $api_url = 'https://api.nisccloud.com/gateway/v1';
    
    public function process_payment($order_id) {
        // Make payment request to Nisc Gateway
        // Handle response
        // Wait for webhook confirmation
    }
    
    public function webhook() {
        // Verify HMAC signature
        // Update order status
    }
}
```

## Getting Started (For Developers)

1. **Read Phased Plan**: `NISC_GATEWAY_PHASED_IMPLEMENTATION.md` ⭐ START HERE
2. **Read Architecture**: `NISC_PAYMENT_GATEWAY_ARCHITECTURE.md`
3. **View Workflow**: Open `nisc-gateway-flow.html` in browser
4. **Follow Implementation Guide**: `NISC_PAYMENT_GATEWAY_IMPLEMENTATION_GUIDE.md`
5. **Start Phase 1**: Build core gateway + start collecting usage data
6. **Monitor Usage**: 2-3 months of real data
7. **Start Phase 2**: Add billing when pricing finalized

## Questions Before Starting?

- **Merchant Onboarding**: Self-service or agency-assisted?
- **Pricing Model**: Per-transaction fee? Monthly subscription?
- **Provider Priority**: M-Pesa only initially, or Stripe too?
- **Sandbox Environment**: Separate DB or flags in same DB?
- **Multi-currency**: Support from day one?
- **Refunds**: Include in v1?

## Support

For questions or clarifications:
- Review the architecture document
- Check the implementation guide
- View the workflow diagram
- Reach out to the development team

---

**Status**: 📋 Planning Complete - Ready for Implementation

**Next Step**: Review with team → Begin Phase 1 implementation
