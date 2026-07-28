# Jenga Payment Gateway - Card Payments

Complete integration package for Jenga Payment Gateway card payment processing.

## 📚 Documentation Overview

This folder contains everything you need to integrate Jenga Payment Gateway for card payments:

### 1. 📖 [Full Documentation](../JENGA-CARDS.md)
**Comprehensive integration guide covering:**
- Authentication & authorization
- Security signatures
- Card payment integration
- IPN webhooks
- Error handling
- Production deployment

**Start here for:** Complete understanding of the integration

### 2. 🚀 [Quick Start Guide](./QUICK-START.md)
**Condensed reference with:**
- Setup steps
- Code snippets
- Required fields
- Common errors

**Start here for:** Fast implementation reference

### 3. 🎯 [Implementation Guide](./IMPLEMENTATION-GUIDE.md)
**Decision matrix and planning guide:**
- "Will Jenga work for my use case?"
- Complexity assessment
- Time estimates
- Comparison with other gateways
- Implementation checklist
- Risk assessment

**Start here for:** Evaluating Jenga vs alternatives

### 4. 💻 [Service Implementation](./jenga-card-payment-service.ts)
**Ready-to-use TypeScript service:**
- Complete working implementation
- Type definitions
- Error handling
- HTML form generation
- Usage examples

**Start here for:** Copy-paste starting point

### 5. ⚙️ [Environment Variables](./.env.jenga.example)
**Configuration template:**
- All required environment variables
- Setup instructions
- Security notes
- Example values

**Start here for:** Setting up your environment

---

## 🏁 Quick Start (5 Minutes)

### 1. Create Jenga Account
- Go to https://jengahq.io
- Sign up for test account
- Get your API keys from Settings → API Keys

### 2. Generate Key Pair
```bash
# Generate private key
openssl genrsa -out keys/jenga-private-key.pem 2048

# Generate public key
openssl rsa -in keys/jenga-private-key.pem -outform PEM -pubout -out keys/jenga-public-key.pem

# Set permissions (Linux/Mac)
chmod 400 keys/jenga-private-key.pem
```

### 3. Configure Environment
```bash
# Copy example env file
cp .env.jenga.example .env

# Edit .env and fill in your credentials
nano .env
```

### 4. Install Dependencies
```bash
npm install
# No additional dependencies needed - uses Node.js crypto module
```

### 5. Use the Service
```typescript
import { JengaCardPaymentService } from './jenga-card-payment-service';

const jenga = new JengaCardPaymentService({
  apiKey: process.env.JENGA_API_KEY!,
  merchantCode: process.env.JENGA_MERCHANT_CODE!,
  consumerSecret: process.env.JENGA_CONSUMER_SECRET!,
  privateKeyPath: process.env.JENGA_PRIVATE_KEY_PATH!,
  environment: 'test',
  defaultCallbackUrl: process.env.JENGA_CALLBACK_URL!,
});

// Initiate payment
const { checkoutUrl, paymentData } = await jenga.initiateCardPayment({
  orderAmount: 1000.00,
  orderReference: 'ORD' + Date.now(),
  currency: 'KES',
  productType: 'Product',
  productDescription: 'Test Product',
  paymentTimeLimit: '15mins',
  customerFirstName: 'John',
  customerLastName: 'Doe',
  customerEmail: 'john@example.com',
  customerPhone: '254712345678',
  customerAddress: '123 Main St',
  customerPostalCodeZip: '00100',
  countryCode: 'KE',
});

// Generate and send HTML form
const html = JengaCardPaymentService.generatePaymentForm(checkoutUrl, paymentData);
res.send(html);
```

---

## 📋 Features

### ✅ Supported Card Schemes
- Visa
- Mastercard
- American Express
- Union Pay
- JCB
- Diners Club

### ✅ Supported Currencies
- KES (Kenyan Shilling)
- TZS (Tanzanian Shilling)
- UGX (Ugandan Shilling)
- USD (United States Dollar)
- EUR (Euro)
- GBP (Pound Sterling)

### ✅ Security Features
- 3D Secure authentication
- RSA-SHA256 signatures
- Token-based API authentication
- IPN webhook with Basic Auth
- HTTPS callbacks (production)

### ✅ Integration Features
- Hosted payment pages (redirect flow)
- Instant Payment Notifications (IPN)
- Real-time callbacks
- Transaction metadata support
- Multi-currency support

---

## 🛠️ Implementation Checklist

### Phase 1: Setup
- [ ] Create Jenga account (test mode)
- [ ] Get API credentials
- [ ] Generate key pair
- [ ] Upload public key to Jenga
- [ ] Configure IPN webhook
- [ ] Set up environment variables

### Phase 2: Backend
- [ ] Implement authentication
- [ ] Implement signature generation
- [ ] Create payment initiation endpoint
- [ ] Create callback handler
- [ ] Create IPN webhook handler
- [ ] Add error handling & logging

### Phase 3: Frontend
- [ ] Add "Pay with Card" button
- [ ] Create payment form
- [ ] Handle form submission
- [ ] Create success/failure pages

### Phase 4: Testing
- [ ] Test authentication
- [ ] Test signature generation
- [ ] Test payment flow (end-to-end)
- [ ] Test failed payments
- [ ] Test IPN webhook
- [ ] Test edge cases

### Phase 5: Production
- [ ] Get live credentials
- [ ] Generate production keys
- [ ] Deploy with HTTPS
- [ ] Test with real transaction
- [ ] Monitor & alert setup

**See [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) for detailed checklist.**

---

## ⏱️ Time Estimate

**Total: 17-24 hours** (for experienced developer)

- Setup: 2-3 hours
- Backend: 6-8 hours
- Frontend: 3-4 hours
- Testing: 4-6 hours
- Production: 2-3 hours

*Add 50% if new to payment integrations.*

---

## 🎯 Use Cases

### ✅ Jenga is Great For:
- E-commerce websites in East Africa
- Multi-channel payment acceptance (cards + mobile)
- Businesses needing hosted payment pages
- Regional/international businesses (multi-currency)

### ⚠️ Consider Alternatives If:
- Need embedded payment forms (use Stripe)
- Need global coverage (use Stripe/PayPal)
- Need advanced features (subscriptions, splits)
- Native mobile app payments (use Stripe/Braintree)

**See [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) for detailed comparison.**

---

## 🔒 Security Best Practices

1. ✅ **Never commit credentials to git**
   - Use `.env` file for credentials
   - Add `.env` and `keys/` to `.gitignore`

2. ✅ **Secure private key**
   - Store outside web root
   - Set restrictive permissions (chmod 400)
   - Never expose in client-side code

3. ✅ **Use HTTPS in production**
   - Required for callback URLs
   - Required for IPN webhook

4. ✅ **Validate all inputs**
   - Sanitize user inputs
   - Validate amounts, emails, phone numbers
   - Use unique order references

5. ✅ **Secure IPN webhook**
   - Use Basic Auth
   - Validate payload structure
   - Always return 200 OK

**See [JENGA-CARDS.md](../JENGA-CARDS.md) for complete security guide.**

---

## 🐛 Troubleshooting

### Common Issues

**"Invalid signature"**
- Verify concatenation order
- Check private key path
- Ensure public key uploaded correctly

**"Authentication failed"**
- Verify API key, merchant code, consumer secret
- Check correct environment (test vs live)

**"Callback not received"**
- Verify callback URL is accessible
- Check HTTPS in production
- Test URL manually

**"IPN not working"**
- Verify Basic Auth credentials
- Check IPN configured in JengaHQ
- Test with curl/Postman

**See [JENGA-CARDS.md](../JENGA-CARDS.md) for detailed troubleshooting.**

---

## 📞 Support

### Jenga Support
- **Email**: support@finserve.africa
- **Portal**: https://jengahq.io
- **API Docs**: https://developer.jengaapi.io

### Internal Documentation
- Full Docs: [JENGA-CARDS.md](../JENGA-CARDS.md)
- Quick Start: [QUICK-START.md](./QUICK-START.md)
- Implementation Guide: [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md)

---

## 📦 File Structure

```
jenga/
├── README.md                           # This file
├── QUICK-START.md                      # Quick reference guide
├── IMPLEMENTATION-GUIDE.md             # Decision matrix & planning
├── jenga-card-payment-service.ts      # TypeScript implementation
└── .env.jenga.example                  # Environment variable template

../
└── JENGA-CARDS.md                      # Comprehensive documentation
```

---

## 🚀 Next Steps

1. **Read** [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) to evaluate if Jenga is right for you
2. **Follow** [QUICK-START.md](./QUICK-START.md) to get started quickly
3. **Reference** [JENGA-CARDS.md](../JENGA-CARDS.md) for detailed implementation
4. **Copy** [jenga-card-payment-service.ts](./jenga-card-payment-service.ts) as starting point
5. **Configure** using [.env.jenga.example](./.env.jenga.example)

---

## 📄 License

This documentation and implementation code is for internal use. Jenga API is a product of Finserve Africa Limited.

---

**Happy coding! 🎉**
