# Nisc Payment Gateway - Security & Isolation

This document outlines the **security measures** and **isolation strategy** for the Nisc Payment Gateway to ensure the **highest level of protection** and prevent any breach from affecting other services.

---

## 🔒 Security Architecture

### 1. **Defense in Depth**

The gateway implements multiple layers of security:

1. **Network Layer**: Rate limiting, IP restrictions
2. **Authentication Layer**: API key validation (bcrypt hashing)
3. **Authorization Layer**: Permission-based access control
4. **Encryption Layer**: AES-256-GCM for credentials at rest
5. **Logging Layer**: Comprehensive audit trails

---

## 🛡️ Isolation Strategy

### **Principle: A breach in the payment gateway MUST NOT affect other services**

### 1. **Database Isolation**

#### **Separate Schema Namespace**
- All tables prefixed with `nisc_payment_gateway_`
- Clear separation from other business logic
- No foreign keys to non-gateway tables (except `user` and `team` for ownership)

#### **Row-Level Access Control**
- Every query filtered by `merchantId`
- Users can only access their own merchants or team merchants
- No cross-merchant data leakage

#### **Example:**
```sql
-- GOOD: Filtered by merchantId
SELECT * FROM nisc_payment_gateway_transaction 
WHERE merchant_id = 'mch_123';

-- BAD: No filtering (prevented by code)
SELECT * FROM nisc_payment_gateway_transaction;
```

---

### 2. **API Isolation**

#### **Separate API Endpoints**
- **Internal API (tRPC)**: `/api/trpc/niscPaymentGateway.*`
  - Requires user session authentication
  - For agency management only
  
- **External API (REST)**: `/api/nisc-gateway/v1/*`
  - Requires API key authentication
  - No session, no cookies, no user context
  - Completely isolated middleware stack

#### **No Shared Authentication**
- External API does NOT use session authentication
- Internal API does NOT accept API keys
- Zero overlap between authentication mechanisms

#### **Example Middleware Stack:**
```typescript
// External API (isolated)
app.use("/api/nisc-gateway/v1", [
  niscPaymentGatewayAuthMiddleware,  // API key only
  niscPaymentGatewayLoggerMiddleware,
  niscPaymentGatewayApiRouter
]);

// Internal API (separate)
app.use("/api/trpc", [
  requireUserSession,  // Session only
  trpcMiddleware
]);
```

---

### 3. **Credential Encryption**

#### **AES-256-GCM Encryption**
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Length**: 256 bits (32 bytes)
- **IV Length**: 128 bits (16 bytes, random per encryption)
- **Auth Tag**: 128 bits (16 bytes, prevents tampering)

#### **Key Storage**
- Stored in environment variable: `NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY`
- **NEVER** committed to Git
- Rotatable via versioning (v1, v2, etc.)

#### **Generate Key:**
```bash
openssl rand -hex 32
```

#### **Storage Format:**
```
<iv_hex>:<auth_tag_hex>:<encrypted_hex>

Example:
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6:e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0:i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4...
```

#### **Security Properties:**
- **Confidentiality**: Credentials encrypted at rest
- **Integrity**: Auth tag prevents tampering
- **Authenticity**: Only valid key can decrypt
- **Forward Secrecy**: Random IV per encryption

---

### 4. **API Key Security**

#### **Hashing (bcrypt)**
- **Algorithm**: bcrypt with 12 rounds
- **Storage**: Only hash stored in database
- **Verification**: Constant-time comparison (prevents timing attacks)

#### **Key Format:**
```
npg_{environment}_{random}

Examples:
- npg_live_4a8f3e7c9b2d1f6e8a4b7c9d2e5f8a3b
- npg_test_9d2e5f8a3b4a8f3e7c9b2d1f6e8a4b7c
```

#### **Lifecycle:**
1. **Generation**: Cryptographically secure random (crypto.randomBytes)
2. **Display**: Shown ONCE during creation
3. **Storage**: bcrypt hash only (12 rounds)
4. **Verification**: Constant-time comparison
5. **Revocation**: Mark as inactive (never delete for audit trail)

#### **Security Properties:**
- **Non-Retrievable**: Full key never stored
- **Brute-Force Resistant**: bcrypt with 12 rounds
- **Timing Attack Resistant**: Constant-time comparison
- **Audit Trail**: All key usage logged

---

### 5. **Rate Limiting**

#### **Per-Key Rate Limiting**
- Default: 100 requests per minute per API key
- Configurable per key
- Sliding window algorithm (minute-based)

#### **Future: Redis-Based (Distributed)**
```typescript
// Current: In-memory (for development)
const rateLimitStore = new Map<string, { count, resetAt }>();

// Future: Redis (for production)
const rateLimitKey = `nisc_gateway:ratelimit:${apiKeyId}`;
await redis.incr(rateLimitKey);
await redis.expire(rateLimitKey, 60); // 1 minute
```

#### **Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

### 6. **IP Restrictions**

#### **Per-Key IP Whitelist**
- Optional: API keys can be restricted to specific IPs
- Exact match or CIDR ranges (future)
- Enforced before authentication

#### **Per-Merchant IP Whitelist**
- Optional: Merchant-wide IP restrictions
- Applies to ALL API keys for that merchant

#### **Example:**
```json
{
  "allowedIps": [
    "203.0.113.0",      // Exact match
    "198.51.100.0/24"   // CIDR range (future)
  ]
}
```

---

### 7. **Logging & Audit Trails**

#### **Dual Logging System**

**1. Request Logs (Detailed)**
- Purpose: Debugging, troubleshooting, audit
- Contents: Full request/response (sanitized)
- Retention: 7 years for financial, 90 days for non-financial
- Index: `merchantId`, `apiKeyId`, `timestamp`, `statusCode`

**2. Access Logs (Aggregated)**
- Purpose: Billing, analytics, quota enforcement
- Contents: Hourly counts by endpoint type
- Retention: Indefinite (for billing)
- Index: `merchantId`, `year`, `month`, `day`, `hour`

#### **Data Sanitization**
```typescript
// Masked Fields
phoneNumber: "254712345678" → "2547*****678"
account: "1234567890" → "***7890"

// Redacted Fields
password: "secret123" → "[REDACTED]"
apiKey: "npg_live_abc..." → "Bearer npg_***"
```

---

### 8. **Permission-Based Access Control**

#### **Granular Permissions**
```typescript
const ALL_PERMISSIONS = [
  "PAYMENT_CREATE",   // Create payment requests
  "PAYMENT_READ",     // Query payment status
  "PAYMENT_LIST",     // List merchant's payments
  "REFUND_CREATE",    // Initiate refunds
  "REFUND_READ",      // Query refund status
  "WEBHOOK_READ",     // View webhook logs
  "WEBHOOK_RETRY",    // Retry failed webhooks
];
```

#### **Middleware Enforcement**
```typescript
app.post("/payments", 
  requirePermission("PAYMENT_CREATE"), 
  handler
);
```

#### **Error Response:**
```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "This API key does not have the 'PAYMENT_CREATE' permission"
  }
}
```

---

## 🚨 Breach Containment

### **If Payment Gateway is Compromised:**

#### **What is Protected:**
✅ Main nPanel services (hosting, domains, etc.)  
✅ User sessions and authentication  
✅ Other merchant data (isolated by merchantId)  
✅ Agency business logic  
✅ Database credentials (not exposed)  

#### **What is Exposed:**
⚠️ Compromised merchant's payment credentials (encrypted)  
⚠️ Compromised merchant's transaction logs  
⚠️ API keys for that merchant (hashed)  

#### **Why Isolation Works:**
1. **Separate API Endpoints**: `/api/nisc-gateway/*` vs `/api/trpc/*`
2. **Different Authentication**: API keys vs sessions
3. **Row-Level Filtering**: All queries filtered by `merchantId`
4. **No Shared State**: Zero overlap in middleware/context
5. **Dedicated Logging**: Separate audit trails

---

## 🔐 Environment Variables

### **Required for Production:**

```bash
# Encryption Key (32 bytes hex, 64 characters)
NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY="<generate with: openssl rand -hex 32>"

# Database URL (if separate database)
# DATABASE_URL="postgresql://..."

# Optional: Redis for rate limiting
# REDIS_URL="redis://..."
```

### **Optional for Key Rotation:**
```bash
NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY_V2="<new_key>"
```

---

## 🧪 Security Testing

### **1. Test Encryption**
```typescript
import { testEncryption } from "@npanel/api/src/lib/nisc-payment-gateway-encryption";

console.log(testEncryption()); // Should return true
```

### **2. Test Sanitization**
```typescript
import { testSanitization } from "@npanel/api/src/middleware/nisc-payment-gateway-logger";

console.log(testSanitization()); // Should return true
```

### **3. Test API Key Format**
```typescript
import { validateApiKeyFormat } from "@npanel/api/src/lib/nisc-payment-gateway-api-key";

validateApiKeyFormat("npg_live_4a8f3e7c9b2d1f6e8a4b7c9d2e5f8a3b"); // true
validateApiKeyFormat("invalid_key"); // false
```

---

## 📋 Security Checklist

### **Before Production:**

- [ ] Generate encryption key: `openssl rand -hex 32`
- [ ] Set `NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY` in environment
- [ ] Test encryption: `testEncryption()` returns true
- [ ] Test sanitization: `testSanitization()` returns true
- [ ] Verify database indexes are created (see schema)
- [ ] Set up log retention policies (7 years financial, 90 days other)
- [ ] Configure rate limiting (Redis for production)
- [ ] Set up IP restrictions for production API keys
- [ ] Enable HTTPS for all gateway endpoints
- [ ] Set up monitoring/alerts for suspicious activity
- [ ] Document key rotation procedure
- [ ] Set up backup encryption keys (offline)
- [ ] Enable audit logging for credential access
- [ ] Test breach scenario (revoke keys, suspend merchant)

---

## 🚀 Deployment Isolation

### **Recommended Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                     Load Balancer                       │
└─────────────────────────────────────────────────────────┘
                 │                          │
                 │                          │
┌────────────────▼──────────┐  ┌────────────▼──────────────┐
│   Main nPanel API         │  │  Nisc Payment Gateway     │
│   (User Sessions)         │  │  (API Keys Only)          │
│   /api/trpc/*             │  │  /api/nisc-gateway/*      │
└───────────────────────────┘  └───────────────────────────┘
                 │                          │
                 │                          │
┌────────────────▼──────────────────────────▼──────────────┐
│              Shared Database (Isolated Tables)           │
│  - Main tables (hosting, domains, etc.)                  │
│  - Gateway tables (nisc_payment_gateway_*)               │
└──────────────────────────────────────────────────────────┘
```

### **Optional: Separate Gateway Instance (Maximum Isolation)**
- Deploy gateway API on separate server/container
- Use separate database instance
- Share only merchant/user ownership tables

---

## 📞 Security Contacts

### **Report Security Issues:**
- Email: security@nisccloud.com
- Encrypt with PGP key: [link]
- Expected response: 24 hours

### **Security Updates:**
- Follow: [@nisccloud_security](https://twitter.com/nisccloud)
- Subscribe: security-updates@nisccloud.com

---

## ✅ Compliance

### **Standards:**
- **PCI DSS**: Level 3/4 (future Level 1 certification)
- **GDPR**: EU data protection compliance
- **SOC 2**: Type II audit (planned)
- **ISO 27001**: Information security management

### **Certifications:**
- [ ] PCI DSS Self-Assessment Questionnaire (SAQ D)
- [ ] Annual penetration testing
- [ ] Quarterly vulnerability scans
- [ ] Annual security audit

---

## 🔄 Incident Response

### **Suspected Breach:**

1. **Immediate Actions** (< 5 minutes)
   - Revoke all API keys for affected merchant
   - Suspend merchant account
   - Enable IP restrictions (whitelist only known IPs)

2. **Investigation** (< 1 hour)
   - Review request logs for suspicious activity
   - Check access logs for unusual patterns
   - Verify credential encryption integrity

3. **Containment** (< 4 hours)
   - Rotate merchant credentials
   - Issue new API keys
   - Reset webhook secrets

4. **Recovery** (< 24 hours)
   - Re-enable merchant with new credentials
   - Monitor for 72 hours
   - Document lessons learned

5. **Post-Incident** (< 1 week)
   - Conduct security review
   - Update security policies
   - Implement additional controls if needed
   - Notify affected parties (if required by law)

---

## 📚 Additional Resources

- [NISC_PAYMENT_GATEWAY_ARCHITECTURE.md](./NISC_PAYMENT_GATEWAY_ARCHITECTURE.md)
- [NISC_PAYMENT_GATEWAY_IMPLEMENTATION_GUIDE.md](./NISC_PAYMENT_GATEWAY_IMPLEMENTATION_GUIDE.md)
- [NISC_GATEWAY_AUTH_AND_LOGGING.md](./NISC_GATEWAY_AUTH_AND_LOGGING.md)
- [NISC_GATEWAY_BILLING_AND_LOGGING.md](./NISC_GATEWAY_BILLING_AND_LOGGING.md)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [PCI DSS v4.0](https://www.pcisecuritystandards.org/)

---

**Last Updated**: July 22, 2026  
**Version**: 1.0.0  
**Maintained by**: Nisc Cloud Security Team
