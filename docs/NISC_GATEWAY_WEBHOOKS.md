# Nisc Payment Gateway - Webhooks Guide

## 🔐 **Complete Isolation from nPanel M-Pesa**

### **Two Separate Webhook Systems:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXISTING NPANEL M-PESA                       │
│  Webhook: /api/webhooks/mpesa                                   │
│  Used by: nPanel internal payment processing                    │
│  Env Var: MPESA_CALLBACK_URL                                    │
│  Database: payment_transaction table                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              NISC PAYMENT GATEWAY (NEW - ISOLATED)              │
│  Webhook: /api/nisc-gateway/webhooks/mpesa/:merchantId          │
│  Used by: External merchants using the gateway                  │
│  Callback: Configured per merchant (in credentials)             │
│  Database: nisc_payment_gateway_transaction table               │
└─────────────────────────────────────────────────────────────────┘
```

**✅ NO INTERFERENCE - Completely separate routes, databases, and logic**

---

## 📋 Webhook Flow

### **Step 1: M-Pesa → Gateway Webhook**
```
M-Pesa STK Push Response
    ↓
POST /api/nisc-gateway/webhooks/mpesa/:merchantId
    ↓
Gateway processes callback
    ↓
Updates nisc_payment_gateway_transaction
    ↓
Triggers merchant webhook delivery
```

### **Step 2: Gateway → Merchant Webhook**
```
Gateway webhook handler
    ↓
POST to merchant's webhookUrl (from settings)
    ↓
Signed with merchant's webhookSecret
    ↓
Logs delivery attempt
    ↓
Retries if failed (max 3 attempts)
```

---

## 🔧 Webhook URLs

### **Gateway M-Pesa Callback (From M-Pesa):**
```
https://your-domain.com/api/nisc-gateway/webhooks/mpesa/{merchantId}

Example:
https://api.nisccloud.com/api/nisc-gateway/webhooks/mpesa/mch_abc123
```

### **Merchant Webhook (To Merchant's App):**
```
Configured in merchant settings:
- webhookUrl: "https://merchant.com/webhooks/payments"
- webhookSecret: "secret_for_signing"
```

---

## ⚙️ Merchant Credential Configuration

### **When Adding M-Pesa Credentials:**

```typescript
// In Add Credentials form, include:
{
  provider: "MPESA",
  environment: "SANDBOX" | "PRODUCTION",
  credentials: {
    consumerKey: "...",
    consumerSecret: "...",
    shortCode: "174379",
    passkey: "...",
    // CRITICAL: Gateway-specific callback URL
    callbackUrl: `https://api.nisccloud.com/api/nisc-gateway/webhooks/mpesa/${merchantId}`
  }
}
```

**This callback URL is DIFFERENT from your nPanel M-Pesa (`MPESA_CALLBACK_URL`)**

---

## 📝 Merchant Webhook Payload

When gateway delivers webhook to merchant:

```json
{
  "event": "payment.completed",
  "merchantId": "mch_abc123",
  "transactionId": "gtx_xyz789",
  "referenceId": "merchant_ref_123",
  "metadata": {
    "order_id": "12345"
  },
  "payment": {
    "status": "SUCCESS",
    "receiptNumber": "QAB2C3D4E5",
    "amount": 1000,
    "transactionDate": "20260722143000",
    "phoneNumber": "2547*****678"
  },
  "timestamp": "2026-07-22T14:30:00.000Z"
}
```

### **Headers:**
```
Content-Type: application/json
User-Agent: Nisc-Payment-Gateway/1.0
X-Nisc-Gateway-Event: payment.completed
X-Nisc-Gateway-Merchant: mch_abc123
X-Nisc-Gateway-Signature: <hmac-sha256-signature>
```

---

## 🔐 Webhook Signature Verification

Merchants should verify webhook signature:

```javascript
// Merchant's webhook handler (example)
const crypto = require('crypto');

function verifyWebhook(req) {
  const signature = req.headers['x-nisc-gateway-signature'];
  const webhookSecret = 'your_webhook_secret'; // From merchant settings
  
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

// In webhook handler
app.post('/webhooks/payments', (req, res) => {
  if (!verifyWebhook(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process payment notification
  const { transactionId, payment } = req.body;
  console.log(`Payment ${transactionId}: ${payment.status}`);
  
  res.json({ received: true });
});
```

---

## 🔄 Webhook Retry Logic

### **Automatic Retries:**
- **Max Attempts**: 3
- **Retry Delays**: 1 min, 5 min, 15 min
- **Timeout**: 10 seconds per attempt

### **Delivery States:**
```
PENDING → First attempt queued
DELIVERED → Successfully delivered (2xx response)
FAILED → All retries exhausted
NOT_CONFIGURED → No webhook URL set
```

---

## 🛠️ M-Pesa Credential Setup Example

### **Sandbox (Testing):**
```typescript
{
  provider: "MPESA",
  environment: "SANDBOX",
  credentials: {
    consumerKey: "cAAxRGh4R9EuGHW5AGYRAJNv...",
    consumerSecret: "fl3kYPG2xifadNYngclNCNs...",
    shortCode: "174379",
    passkey: "bfb279f9aa9bdbcf158e97dd...",
    callbackUrl: "https://api.nisccloud.com/api/nisc-gateway/webhooks/mpesa/mch_abc123"
  }
}
```

### **Production:**
```typescript
{
  provider: "MPESA",
  environment: "PRODUCTION",
  credentials: {
    consumerKey: "production_key...",
    consumerSecret: "production_secret...",
    shortCode: "600123", // Production paybill
    passkey: "production_passkey...",
    callbackUrl: "https://api.nisccloud.com/api/nisc-gateway/webhooks/mpesa/mch_abc123"
  }
}
```

---

## 📊 Webhook Logs

All webhook deliveries logged in `nisc_payment_gateway_webhook_log`:

```sql
SELECT 
  id,
  webhook_url,
  response_status,
  success,
  attempt_number,
  duration_ms,
  sent_at
FROM nisc_payment_gateway_webhook_log
WHERE merchant_id = 'mch_abc123'
ORDER BY sent_at DESC
LIMIT 10;
```

---

## 🧪 Testing Webhooks

### **1. Use ngrok for local testing:**
```bash
# Start ngrok
ngrok http 8050

# Update merchant webhook URL
{
  "webhookUrl": "https://your-ngrok-url.ngrok.io/webhooks/payments",
  "webhookSecret": "test_secret_123"
}
```

### **2. Test M-Pesa callback manually:**
```bash
curl -X POST http://localhost:8050/api/nisc-gateway/webhooks/mpesa/mch_abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "CheckoutRequestID": "ws_CO_123456",
        "ResultCode": 0,
        "ResultDesc": "The service request is processed successfully.",
        "CallbackMetadata": {
          "Item": [
            {"Name": "Amount", "Value": 1000},
            {"Name": "MpesaReceiptNumber", "Value": "QAB2C3D4E5"},
            {"Name": "TransactionDate", "Value": 20260722143000},
            {"Name": "PhoneNumber", "Value": 254712345678}
          ]
        }
      }
    }
  }'
```

---

## 🔒 Security Best Practices

### **1. Validate Signatures**
Always verify `X-Nisc-Gateway-Signature` header

### **2. Use HTTPS**
Merchant webhook URLs must use HTTPS in production

### **3. IP Whitelist (Optional)**
Whitelist gateway server IPs in merchant firewall

### **4. Idempotency**
Handle duplicate webhooks gracefully (same transactionId)

### **5. Timeout Responses**
Respond within 10 seconds to avoid retries

---

## 📋 Integration Checklist

### **Agency Side (You):**
- [x] Gateway webhook endpoint created
- [x] Isolated from nPanel M-Pesa
- [x] Webhook delivery logic implemented
- [x] Retry mechanism configured
- [ ] Add credentials UI with callback URL
- [ ] Test with sandbox M-Pesa

### **Merchant Side (External Clients):**
- [ ] Set webhook URL in merchant settings
- [ ] Set webhook secret for signing
- [ ] Implement webhook handler endpoint
- [ ] Verify signatures
- [ ] Handle payment.completed events
- [ ] Test with test transactions

---

## 🎯 Key Differences from nPanel M-Pesa

| Feature | nPanel M-Pesa | Nisc Gateway M-Pesa |
|---------|---------------|---------------------|
| **Webhook URL** | `/api/webhooks/mpesa` | `/api/nisc-gateway/webhooks/mpesa/:merchantId` |
| **Callback URL** | `MPESA_CALLBACK_URL` env var | Per-merchant (in credentials) |
| **Database** | `payment_transaction` | `nisc_payment_gateway_transaction` |
| **Purpose** | Internal nPanel payments | External merchant payments |
| **Webhook Forwarding** | No | Yes (to merchant's URL) |
| **Signature** | No | Yes (HMAC-SHA256) |
| **Retry Logic** | No | Yes (3 attempts) |

---

## 📞 Webhook Events (Future)

Current: `payment.completed`

Future Events:
- `payment.failed`
- `payment.cancelled`
- `refund.completed`
- `refund.failed`

---

## 🚀 Next Steps

1. **Build "Add Credentials" UI** with callback URL field
2. **Build "Webhook Settings" section** in merchant details
3. **Add webhook delivery dashboard** (view logs, retry failed)
4. **Test end-to-end flow** with sandbox M-Pesa

---

**Summary**: Your Nisc Payment Gateway now has **completely isolated webhooks** that don't interfere with nPanel's existing M-Pesa integration. Each merchant gets their own callback URL, and the gateway forwards payment notifications to merchant's configured webhook endpoints! 🎉
