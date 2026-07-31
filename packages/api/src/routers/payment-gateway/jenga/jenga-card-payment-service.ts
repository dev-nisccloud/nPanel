/**
 * Jenga Payment Gateway - Card Payment Service
 * 
 * This is a reference implementation for Jenga card payment integration.
 * Adapt this to your project's structure and requirements.
 */

import crypto from 'crypto';
import fs from 'fs';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface JengaConfig {
  apiKey: string;
  merchantCode: string;
  consumerSecret: string;
  privateKeyPath: string;
  environment: 'test' | 'live';
  defaultCallbackUrl: string;
  ipnUsername?: string;
  ipnPassword?: string;
}

interface JengaAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string; // ISO 8601 date
  issuedAt: string; // ISO 8601 date
  tokenType: 'Bearer';
}

interface PaymentRequest {
  // Transaction details
  orderAmount: number;
  orderReference: string; // Min 8 chars, alphanumeric
  currency: string; // e.g., 'KES', 'USD'
  productType: 'Product' | 'Service';
  productDescription: string; // Max 200 chars
  paymentTimeLimit: string; // e.g., '15mins'
  
  // Customer details
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string; // e.g., '254712345678'
  customerAddress: string;
  customerPostalCodeZip: string;
  countryCode: string; // Alpha-2, e.g., 'KE'
  
  // Optional
  callbackUrl?: string;
  extraData?: string; // JSON string
  secondaryReference?: string;
}

interface PaymentResponse {
  checkoutUrl: string;
  paymentData: Record<string, string>;
}

interface PaymentCallback {
  transactionId: string;
  status: 'paid' | string;
  date: string;
  desc: 'CARD' | 'MPESA' | 'EQUITEL' | 'AIRTEL' | 'PWE' | 'PAYPAL';
  amount: string;
  orderReference: string;
  hash: string;
  extraData?: string;
}

interface IPNPayload {
  callbackType: 'IPN';
  customer: {
    name: string;
    mobileNumber: string;
    reference: string;
  };
  transaction: {
    date: string;
    reference: string;
    paymentMode: 'CARD' | 'MPESA' | 'PWE' | 'EQUITEL' | 'PAYPAL';
    amount: number;
    currency: string;
    billNumber: string;
    servedBy: string;
    additionalInfo: string;
    orderAmount: number;
    serviceCharge: number;
    orderCurrency: string;
    status: 'SUCCESS' | 'FAILED';
    remarks: string;
  };
  bank: {
    reference: string;
    transactionType: string;
    account: string | null;
  };
}

// =============================================================================
// JENGA ERROR CLASS
// =============================================================================

export class JengaError extends Error {
  constructor(
    public code: number,
    public message: string,
    public status: boolean = false
  ) {
    super(message);
    this.name = 'JengaError';
  }
}

// =============================================================================
// JENGA CARD PAYMENT SERVICE
// =============================================================================

export class JengaCardPaymentService {
  private config: JengaConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: JengaConfig) {
    this.config = config;
    this.validateConfig();
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION & SETUP
  // ---------------------------------------------------------------------------

  private validateConfig(): void {
    const required = [
      'apiKey',
      'merchantCode',
      'consumerSecret',
      'privateKeyPath',
      'environment',
      'defaultCallbackUrl',
    ];

    for (const key of required) {
      if (!this.config[key as keyof JengaConfig]) {
        throw new Error(`Missing required config: ${key}`);
      }
    }

    // Verify private key exists
    if (!fs.existsSync(this.config.privateKeyPath)) {
      throw new Error(`Private key not found at: ${this.config.privateKeyPath}`);
    }
  }

  private getBaseUrl(): string {
    return this.config.environment === 'live'
      ? 'https://api.finserve.africa'
      : 'https://uat.finserve.africa';
  }

  private getCheckoutUrl(): string {
    return this.config.environment === 'live'
      ? 'https://v3.jengapgw.io/processPayment'
      : 'https://v3-uat.jengapgw.io/processPayment';
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATION
  // ---------------------------------------------------------------------------

  /**
   * Authenticate with Jenga and get access token.
   * Tokens are cached until expiry.
   */
  async authenticate(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && this.tokenExpiry) {
      const now = new Date();
      const bufferTime = new Date(this.tokenExpiry.getTime() - 5 * 60 * 1000);
      
      if (now < bufferTime) {
        return this.accessToken;
      }
    }

    try {
      const response = await fetch(
        `${this.getBaseUrl()}/authentication/api/v3/authenticate/merchant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': this.config.apiKey,
          },
          body: JSON.stringify({
            merchantCode: this.config.merchantCode,
            consumerSecret: this.config.consumerSecret,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.status === false) {
        throw new JengaError(
          data.code || response.status,
          data.message || 'Authentication failed',
          data.status
        );
      }

      const authData = data as JengaAuthResponse;
      this.accessToken = authData.accessToken;
      this.tokenExpiry = new Date(authData.expiresIn);

      console.log('[Jenga] Authentication successful');
      return this.accessToken;
    } catch (error) {
      console.error('[Jenga] Authentication error:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // SIGNATURE GENERATION
  // ---------------------------------------------------------------------------

  /**
   * Generate signature for payment request.
   * Formula: merchantCode + orderReference + currency + orderAmount + callbackUrl
   */
  private generateSignature(
    orderReference: string,
    currency: string,
    orderAmount: number,
    callbackUrl: string
  ): string {
    try {
      // Concatenate fields in exact order
      const plainText =
        this.config.merchantCode +
        orderReference +
        currency +
        orderAmount.toString() +
        callbackUrl;

      // Load private key
      const privateKey = fs.readFileSync(this.config.privateKeyPath, 'utf8');

      // Create signature
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(plainText);
      sign.end();

      // Sign and encode
      const signature = sign.sign(privateKey, 'base64');

      console.log('[Jenga] Signature generated for order:', orderReference);
      return signature;
    } catch (error) {
      console.error('[Jenga] Signature generation error:', error);
      throw new Error('Failed to generate payment signature');
    }
  }

  // ---------------------------------------------------------------------------
  // PAYMENT INITIATION
  // ---------------------------------------------------------------------------

  /**
   * Initiate card payment.
   * Returns checkout URL and form data for redirect.
   */
  async initiateCardPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Validate request
    this.validatePaymentRequest(request);

    try {
      // Get access token
      const token = await this.authenticate();

      // Use default callback if not provided
      const callbackUrl = request.callbackUrl || this.config.defaultCallbackUrl;

      // Generate signature
      const signature = this.generateSignature(
        request.orderReference,
        request.currency,
        request.orderAmount,
        callbackUrl
      );

      // Prepare payment data
      const paymentData: Record<string, string> = {
        token,
        merchantCode: this.config.merchantCode,
        currency: request.currency,
        orderAmount: request.orderAmount.toFixed(2),
        orderReference: request.orderReference,
        productType: request.productType,
        productDescription: request.productDescription,
        paymentTimeLimit: request.paymentTimeLimit,
        customerFirstName: request.customerFirstName,
        customerLastName: request.customerLastName,
        customerPostalCodeZip: request.customerPostalCodeZip,
        customerAddress: request.customerAddress,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        callbackUrl,
        countryCode: request.countryCode,
        signature,
      };

      // Add optional fields
      if (request.extraData) {
        paymentData.extraData = request.extraData;
      }
      if (request.secondaryReference) {
        paymentData.secondaryReference = request.secondaryReference;
      }

      console.log('[Jenga] Payment initiated:', {
        orderReference: request.orderReference,
        amount: request.orderAmount,
        currency: request.currency,
      });

      return {
        checkoutUrl: this.getCheckoutUrl(),
        paymentData,
      };
    } catch (error) {
      console.error('[Jenga] Payment initiation error:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // VALIDATION
  // ---------------------------------------------------------------------------

  private validatePaymentRequest(request: PaymentRequest): void {
    // Order reference validation
    if (!request.orderReference || request.orderReference.length < 8) {
      throw new Error('Order reference must be at least 8 characters');
    }
    if (!/^[a-zA-Z0-9]+$/.test(request.orderReference)) {
      throw new Error('Order reference must be alphanumeric');
    }

    // Amount validation
    if (request.orderAmount <= 0) {
      throw new Error('Order amount must be positive');
    }

    // Product description validation
    if (request.productDescription.length > 200) {
      throw new Error('Product description must be 200 characters or less');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.customerEmail)) {
      throw new Error('Invalid email address');
    }

    // Phone validation (basic)
    if (request.customerPhone.length < 10) {
      throw new Error('Invalid phone number');
    }

    // Currency validation
    const validCurrencies = ['KES', 'TZS', 'UGX', 'USD', 'EUR', 'GBP'];
    if (!validCurrencies.includes(request.currency)) {
      throw new Error(`Currency must be one of: ${validCurrencies.join(', ')}`);
    }

    // Country code validation (Alpha-2)
    if (request.countryCode.length !== 2) {
      throw new Error('Country code must be 2 characters (Alpha-2)');
    }
  }

  // ---------------------------------------------------------------------------
  // CALLBACK & IPN PROCESSING
  // ---------------------------------------------------------------------------

  /**
   * Process payment callback from Jenga redirect.
   */
  static processCallback(queryParams: Record<string, string>): PaymentCallback {
    return {
      transactionId: queryParams.transactionId,
      status: queryParams.status,
      date: queryParams.date,
      desc: queryParams.desc as PaymentCallback['desc'],
      amount: queryParams.amount,
      orderReference: queryParams.orderReference,
      hash: queryParams.hash,
      extraData: queryParams.extraData,
    };
  }

  /**
   * Validate IPN payload structure.
   */
  static validateIPNPayload(payload: any): payload is IPNPayload {
    return (
      payload &&
      payload.callbackType === 'IPN' &&
      payload.customer &&
      payload.transaction &&
      payload.bank &&
      typeof payload.transaction.status === 'string'
    );
  }

  /**
   * Process IPN notification.
   */
  static processIPN(payload: IPNPayload): {
    success: boolean;
    transactionReference: string;
    amount: number;
    currency: string;
    paymentMode: string;
    status: 'SUCCESS' | 'FAILED';
  } {
    return {
      success: payload.transaction.status === 'SUCCESS',
      transactionReference: payload.transaction.reference,
      amount: payload.transaction.amount,
      currency: payload.transaction.currency,
      paymentMode: payload.transaction.paymentMode,
      status: payload.transaction.status,
    };
  }

  // ---------------------------------------------------------------------------
  // HTML FORM GENERATION
  // ---------------------------------------------------------------------------

  /**
   * Generate HTML form for auto-submit to Jenga.
   */
  static generatePaymentForm(checkoutUrl: string, paymentData: Record<string, string>): string {
    const inputs = Object.entries(paymentData)
      .map(([key, value]) => `    <input type="hidden" name="${key}" value="${this.escapeHtml(value)}" />`)
      .join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting to Payment Gateway...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 400px;
    }
    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 1.5rem;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h1 {
      color: #333;
      font-size: 1.5rem;
      margin: 0 0 0.5rem;
    }
    p {
      color: #666;
      margin: 0;
    }
    .security-note {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #eee;
      font-size: 0.875rem;
      color: #999;
    }
    .lock-icon {
      display: inline-block;
      margin-right: 0.25rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Redirecting to Payment Gateway</h1>
    <p>Please wait while we securely redirect you...</p>
    <div class="security-note">
      <span class="lock-icon">🔒</span>
      Secured by Jenga Payment Gateway
    </div>
  </div>
  <form id="jengaCheckoutForm" action="${this.escapeHtml(checkoutUrl)}" method="POST">
${inputs}
  </form>
  <script>
    // Auto-submit form after a brief delay
    setTimeout(() => {
      document.getElementById('jengaCheckoutForm').submit();
    }, 1000);
  </script>
</body>
</html>
    `.trim();
  }

  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

// =============================================================================
// USAGE EXAMPLE
// =============================================================================

/*
// 1. Initialize service
const jengaService = new JengaCardPaymentService({
  apiKey: process.env.JENGA_API_KEY!,
  merchantCode: process.env.JENGA_MERCHANT_CODE!,
  consumerSecret: process.env.JENGA_CONSUMER_SECRET!,
  privateKeyPath: './keys/jenga-private-key.pem',
  environment: process.env.NODE_ENV === 'production' ? 'live' : 'test',
  defaultCallbackUrl: process.env.JENGA_CALLBACK_URL!,
  ipnUsername: process.env.JENGA_IPN_USERNAME,
  ipnPassword: process.env.JENGA_IPN_PASSWORD,
});

// 2. Initiate payment
app.post('/api/payment/jenga/initiate', async (req, res) => {
  try {
    const { checkoutUrl, paymentData } = await jengaService.initiateCardPayment({
      orderAmount: req.body.amount,
      orderReference: 'ORD' + Date.now(),
      currency: 'KES',
      productType: 'Product',
      productDescription: req.body.description,
      paymentTimeLimit: '15mins',
      customerFirstName: req.body.firstName,
      customerLastName: req.body.lastName,
      customerEmail: req.body.email,
      customerPhone: req.body.phone,
      customerAddress: req.body.address,
      customerPostalCodeZip: req.body.postalCode,
      countryCode: 'KE',
      extraData: JSON.stringify({ userId: req.user.id }),
    });

    // Return HTML form that auto-submits
    const html = JengaCardPaymentService.generatePaymentForm(checkoutUrl, paymentData);
    res.send(html);
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// 3. Handle callback
app.get('/api/payment/jenga/callback', async (req, res) => {
  try {
    const callback = JengaCardPaymentService.processCallback(req.query as Record<string, string>);

    if (callback.status === 'paid') {
      // Update order status in database
      await updateOrderStatus(callback.orderReference, {
        status: 'paid',
        transactionId: callback.transactionId,
        amount: parseFloat(callback.amount),
        paymentDate: new Date(callback.date),
      });

      res.redirect(`/payment/success?ref=${callback.orderReference}`);
    } else {
      res.redirect(`/payment/failed?ref=${callback.orderReference}`);
    }
  } catch (error) {
    console.error('Callback processing error:', error);
    res.redirect('/payment/error');
  }
});

// 4. Handle IPN webhook
import basicAuth from 'express-basic-auth';

const ipnAuth = basicAuth({
  users: {
    [process.env.JENGA_IPN_USERNAME!]: process.env.JENGA_IPN_PASSWORD!,
  },
  challenge: true,
});

app.post('/webhooks/jenga-ipn', ipnAuth, async (req, res) => {
  try {
    if (!JengaCardPaymentService.validateIPNPayload(req.body)) {
      return res.status(400).json({ error: 'Invalid IPN payload' });
    }

    const ipn = JengaCardPaymentService.processIPN(req.body);

    if (ipn.success) {
      // Process successful payment
      await processSuccessfulPayment(ipn);
    } else {
      // Log failed payment
      console.warn('[Jenga] Failed payment:', ipn);
    }

    // Always return 200 to prevent retries
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Jenga] IPN processing error:', error);
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
});
*/

export default JengaCardPaymentService;
