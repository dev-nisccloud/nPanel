# Jenga Card Payment - Quick Start Guide

Quick reference for implementing Jenga card payments in your payment dialogs.

## 1. Setup (One-Time)

### Generate Key Pair
```bash
# Generate private key
openssl genrsa -out jenga-private-key.pem 2048

# Generate public key
openssl rsa -in jenga-private-key.pem -outform PEM -pubout -out jenga-public-key.pem
```

### Upload Public Key
1. Login to https://jengahq.io
2. Go to Settings → API Keys
3. Copy the public key content (without BEGIN/END lines)
4. Paste in JengaHQ portal

### Environment Variables
```env
JENGA_ENVIRONMENT=test
JENGA_API_KEY=your_api_key
JENGA_MERCHANT_CODE=your_merchant_code
JENGA_CONSUMER_SECRET=your_consumer_secret
JENGA_PRIVATE_KEY_PATH=./keys/jenga-private-key.pem
JENGA_CALLBACK_URL=https://yourdomain.com/api/payment/callback
JENGA_IPN_URL=https://yourdomain.com/webhooks/jenga-ipn
JENGA_IPN_USERNAME=your_ipn_username
JENGA_IPN_PASSWORD=your_ipn_password
```

## 2. URLs

### Test Environment
- **Auth**: `https://uat.finserve.africa/authentication/api/v3/authenticate/merchant`
- **Checkout**: `https://v3-uat.jengapgw.io/processPayment`

### Live Environment
- **Auth**: `https://api.finserve.africa/authentication/api/v3/authenticate/merchant`
- **Checkout**: `https://v3.jengapgw.io/processPayment`

## 3. Implementation Flow

```
User clicks "Pay with Card"
    ↓
Your backend authenticates with Jenga (get token)
    ↓
Your backend generates signature
    ↓
Your backend creates payment form with hidden fields
    ↓
Form auto-submits to Jenga (user redirected)
    ↓
User enters card details on Jenga page
    ↓
Jenga processes payment (3D Secure if needed)
    ↓
User redirected back to your callback URL
    ↓
You receive IPN webhook notification
    ↓
You update order status
```

## 4. Code Snippets

### Get Access Token
```typescript
async function getJengaToken() {
  const response = await fetch(
    'https://uat.finserve.africa/authentication/api/v3/authenticate/merchant',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': process.env.JENGA_API_KEY,
      },
      body: JSON.stringify({
        merchantCode: process.env.JENGA_MERCHANT_CODE,
        consumerSecret: process.env.JENGA_CONSUMER_SECRET,
      }),
    }
  );
  
  const data = await response.json();
  return data.accessToken;
}
```

### Generate Signature
```typescript
import crypto from 'crypto';
import fs from 'fs';

function generateSignature(
  merchantCode: string,
  orderReference: string,
  currency: string,
  orderAmount: number,
  callbackUrl: string,
  privateKeyPath: string
): string {
  // Concatenate fields in exact order
  const plainText = merchantCode + orderReference + currency + orderAmount.toString() + callbackUrl;
  
  // Load private key
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  
  // Create signature
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(plainText);
  sign.end();
  
  return sign.sign(privateKey, 'base64');
}
```

### Create Payment Form
```typescript
async function initiatePayment(paymentData: PaymentRequest) {
  // 1. Get token
  const token = await getJengaToken();
  
  // 2. Generate signature
  const signature = generateSignature(
    process.env.JENGA_MERCHANT_CODE,
    paymentData.orderReference,
    paymentData.currency,
    paymentData.orderAmount,
    process.env.JENGA_CALLBACK_URL,
    process.env.JENGA_PRIVATE_KEY_PATH
  );
  
  // 3. Create form data
  const formData = {
    token,
    merchantCode: process.env.JENGA_MERCHANT_CODE,
    currency: paymentData.currency,
    orderAmount: paymentData.orderAmount.toFixed(2),
    orderReference: paymentData.orderReference,
    productType: 'Product', // or 'Service'
    productDescription: paymentData.description,
    paymentTimeLimit: '15mins',
    customerFirstName: paymentData.firstName,
    customerLastName: paymentData.lastName,
    customerEmail: paymentData.email,
    customerPhone: paymentData.phone,
    customerAddress: paymentData.address,
    customerPostalCodeZip: paymentData.postalCode,
    countryCode: 'KE',
    callbackUrl: process.env.JENGA_CALLBACK_URL,
    signature,
    extraData: JSON.stringify({ orderId: paymentData.orderId }),
  };
  
  return formData;
}
```

### Auto-Submit Form (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <title>Redirecting to Payment...</title>
</head>
<body>
  <p>Redirecting to secure payment gateway...</p>
  <form id="jengaForm" action="https://v3-uat.jengapgw.io/processPayment" method="POST">
    <input type="hidden" name="token" value="${token}" />
    <input type="hidden" name="merchantCode" value="${merchantCode}" />
    <input type="hidden" name="currency" value="${currency}" />
    <input type="hidden" name="orderAmount" value="${orderAmount}" />
    <input type="hidden" name="orderReference" value="${orderReference}" />
    <input type="hidden" name="productType" value="${productType}" />
    <input type="hidden" name="productDescription" value="${productDescription}" />
    <input type="hidden" name="paymentTimeLimit" value="${paymentTimeLimit}" />
    <input type="hidden" name="customerFirstName" value="${customerFirstName}" />
    <input type="hidden" name="customerLastName" value="${customerLastName}" />
    <input type="hidden" name="customerEmail" value="${customerEmail}" />
    <input type="hidden" name="customerPhone" value="${customerPhone}" />
    <input type="hidden" name="customerAddress" value="${customerAddress}" />
    <input type="hidden" name="customerPostalCodeZip" value="${customerPostalCodeZip}" />
    <input type="hidden" name="countryCode" value="${countryCode}" />
    <input type="hidden" name="callbackUrl" value="${callbackUrl}" />
    <input type="hidden" name="signature" value="${signature}" />
    <input type="hidden" name="extraData" value="${extraData}" />
  </form>
  <script>
    document.getElementById('jengaForm').submit();
  </script>
</body>
</html>
```

### Handle Callback
```typescript
app.get('/api/payment/callback', async (req, res) => {
  const {
    transactionId,
    status,
    date,
    desc, // Payment channel: CARD
    amount,
    orderReference,
    hash,
    extraData,
  } = req.query;
  
  if (status === 'paid') {
    // Payment successful
    await updateOrder(orderReference, {
      status: 'paid',
      transactionId,
      paymentChannel: desc,
      amount: parseFloat(amount),
      paymentDate: new Date(date),
    });
    
    res.redirect(`/payment/success?ref=${orderReference}`);
  } else {
    // Payment failed
    res.redirect(`/payment/failed?ref=${orderReference}`);
  }
});
```

### Handle IPN Webhook
```typescript
import basicAuth from 'express-basic-auth';

const ipnAuth = basicAuth({
  users: {
    [process.env.JENGA_IPN_USERNAME]: process.env.JENGA_IPN_PASSWORD,
  },
  challenge: true,
});

app.post('/webhooks/jenga-ipn', ipnAuth, async (req, res) => {
  const { customer, transaction, bank } = req.body;
  
  if (transaction.status === 'SUCCESS') {
    await processPayment({
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      customerName: customer.name,
      paymentMode: transaction.paymentMode, // 'CARD'
    });
  }
  
  // Always return 200 to prevent retries
  res.status(200).json({ received: true });
});
```

## 5. Required Fields

### Mandatory
- `token` - From authentication
- `merchantCode` - From environment
- `currency` - e.g., 'KES', 'USD'
- `orderAmount` - Decimal number
- `orderReference` - Unique, min 8 chars, alphanumeric
- `productType` - 'Product' or 'Service'
- `productDescription` - Max 200 chars
- `paymentTimeLimit` - e.g., '15mins'
- `customerFirstName`
- `customerLastName`
- `customerEmail`
- `customerPhone` - e.g., '254712345678'
- `customerAddress`
- `customerPostalCodeZip`
- `countryCode` - Alpha-2, e.g., 'KE'
- `signature` - Generated signature

### Optional
- `callbackUrl` - Defaults to env variable
- `extraData` - JSON string with metadata
- `secondaryReference` - Additional reference

## 6. Supported Currencies

- KES (Kenyan Shilling)
- TZS (Tanzanian Shilling)
- UGX (Ugandan Shilling)
- USD (United States Dollar)
- EUR (Euro)
- GBP (Pound Sterling)

## 7. Response Parameters (Callback)

| Parameter | Description |
|-----------|-------------|
| `transactionId` | Jenga transaction ID |
| `status` | `paid` = success |
| `date` | Transaction date (ISO format) |
| `desc` | Payment channel (will be `CARD`) |
| `amount` | Transaction amount |
| `orderReference` | Your original reference |
| `hash` | Security hash |
| `extraData` | Your metadata |

## 8. Testing

### Test Credentials
Get test credentials from https://uat.jengahq.io

### Test Cards
Check Jenga documentation for test card numbers.

### Test Flow
1. Use test environment URLs
2. Use test credentials
3. Process test payment with test card
4. Verify callback received
5. Verify IPN received

## 9. Common Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 401 | Invalid credentials | Check merchant code, consumer secret, API key |
| 900100 | Signature required | Generate and include signature |
| 900101 | Invalid signature | Check signature generation logic |
| 400101 | Duplicate reference | Use unique order reference |
| 401101 | Not authorized | Contact Jenga to activate API access |

## 10. Security Checklist

- [ ] Store credentials in environment variables (not in code)
- [ ] Keep private key secure (chmod 400)
- [ ] Never commit private key to git
- [ ] Use HTTPS for callback URLs (production)
- [ ] Validate callback responses
- [ ] Use Basic Auth for IPN webhook
- [ ] Log all transactions
- [ ] Implement rate limiting
- [ ] Use unique order references
- [ ] Cache access tokens (don't fetch for every request)

## 11. Payment Dialog Integration Points

### On "Pay with Card" Button Click
```typescript
// 1. Validate user input
// 2. Create order in your database
// 3. Call your backend endpoint
const response = await fetch('/api/payment/initiate', {
  method: 'POST',
  body: JSON.stringify({
    amount: orderTotal,
    currency: 'KES',
    customerDetails: { /* ... */ },
  }),
});

// 4. Backend returns HTML form that auto-submits
const html = await response.text();

// 5. Open in new window or replace current page
document.body.innerHTML = html;
```

### On Callback Return
```typescript
// User lands on: /payment/callback?status=paid&orderReference=ABC123...

// 1. Show loading state
// 2. Backend validates and updates order
// 3. Redirect to success/failure page
```

### On IPN Received
```typescript
// Background webhook (async)
// 1. Validate Basic Auth
// 2. Update order status
// 3. Send email/SMS notification
// 4. Update UI if user is still on success page (via polling/websocket)
```

## 12. Full Example Implementation

See the main documentation file `JENGA-CARDS.md` for complete implementation examples with full TypeScript/Node.js code.

## Support

- **Full Docs**: [JENGA-CARDS.md](./JENGA-CARDS.md)
- **Jenga Support**: support@finserve.africa
- **Jenga Portal**: https://jengahq.io
- **API Docs**: https://developer.jengaapi.io
