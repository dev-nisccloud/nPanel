import crypto from "node:crypto";
import fs from "node:fs";
import { request } from "undici";
import { getJengaErrorInfo } from "./error-codes";
export class JengaApiError extends Error {
    code;
    description;
    originalError;
    errorInfo;
    retryable;
    constructor(code, description, originalError, errorInfo) {
        super(`Jenga API Error ${code}: ${description}`);
        this.code = code;
        this.description = description;
        this.originalError = originalError;
        this.name = "JengaApiError";
        this.errorInfo = errorInfo ?? getJengaErrorInfo(code);
        this.retryable = this.errorInfo.retryable;
    }
}
export class JengaCardPaymentClient {
    config;
    accessToken = null;
    tokenExpiry = null;
    constructor(config) {
        this.config = config;
        this.validateConfig();
    }
    validateConfig() {
        const required = [
            "apiKey",
            "merchantCode",
            "consumerSecret",
            "privateKeyPath",
            "environment",
            "defaultCallbackUrl",
        ];
        for (const key of required) {
            if (!this.config[key]) {
                throw new Error(`Missing required Jenga config: ${key}`);
            }
        }
        if (!fs.existsSync(this.config.privateKeyPath)) {
            throw new Error(`Jenga private key not found at: ${this.config.privateKeyPath}`);
        }
    }
    getBaseUrl() {
        return this.config.environment === "live"
            ? "https://api.finserve.africa"
            : "https://uat.finserve.africa";
    }
    getCheckoutUrl() {
        return this.config.environment === "live"
            ? "https://v3.jengapgw.io/processPayment"
            : "https://v3-uat.jengapgw.io/processPayment";
    }
    getDefaultCallbackUrl() {
        return this.config.defaultCallbackUrl;
    }
    getMerchantCode() {
        return this.config.merchantCode;
    }
    /**
     * Authenticate with Jenga and cache the Bearer token until near expiry.
     */
    async authenticate() {
        if (this.accessToken && this.tokenExpiry) {
            const bufferTime = new Date(this.tokenExpiry.getTime() - 5 * 60 * 1000);
            if (new Date() < bufferTime) {
                return this.accessToken;
            }
        }
        try {
            const response = await request(`${this.getBaseUrl()}/authentication/api/v3/authenticate/merchant`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Api-Key": this.config.apiKey,
                },
                body: JSON.stringify({
                    merchantCode: this.config.merchantCode,
                    consumerSecret: this.config.consumerSecret,
                }),
            });
            const data = (await response.body.json());
            if (response.statusCode !== 200 || data.status === false) {
                throw new JengaApiError(data.code || response.statusCode, data.message || "Authentication failed");
            }
            if (!data.accessToken) {
                throw new JengaApiError("NO_TOKEN", "Access token not found in response");
            }
            this.accessToken = data.accessToken;
            this.tokenExpiry = new Date(data.expiresIn);
            return this.accessToken;
        }
        catch (error) {
            if (error instanceof JengaApiError)
                throw error;
            throw new JengaApiError("TOKEN_ERROR", `Failed to get access token: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error : undefined);
        }
    }
    /**
     * Signature formula (docs): merchantCode + orderReference + currency + orderAmount + callbackUrl
     * Note: orderAmount is signed as the numeric string used in concatenation (not necessarily toFixed).
     */
    generateSignature(orderReference, currency, orderAmount, callbackUrl) {
        const plainText = this.config.merchantCode +
            orderReference +
            currency +
            orderAmount.toString() +
            callbackUrl;
        const privateKey = fs.readFileSync(this.config.privateKeyPath, "utf8");
        const sign = crypto.createSign("RSA-SHA256");
        sign.update(plainText);
        sign.end();
        return sign.sign(privateKey, "base64");
    }
    validatePaymentRequest(request) {
        if (!request.orderReference || request.orderReference.length < 8) {
            throw new JengaApiError("VALIDATION", "Order reference must be at least 8 characters");
        }
        if (!/^[a-zA-Z0-9]+$/.test(request.orderReference)) {
            throw new JengaApiError("VALIDATION", "Order reference must be alphanumeric");
        }
        if (request.orderAmount <= 0) {
            throw new JengaApiError("VALIDATION", "Order amount must be positive");
        }
        if (request.productDescription.length > 200) {
            throw new JengaApiError("VALIDATION", "Product description must be 200 characters or less");
        }
    }
    async initiateCardPayment(request) {
        this.validatePaymentRequest(request);
        const token = await this.authenticate();
        const callbackUrl = request.callbackUrl || this.config.defaultCallbackUrl;
        const signature = this.generateSignature(request.orderReference, request.currency, request.orderAmount, callbackUrl);
        const paymentData = {
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
        if (request.extraData) {
            paymentData.extraData = request.extraData;
        }
        if (request.secondaryReference) {
            paymentData.secondaryReference = request.secondaryReference;
        }
        return {
            checkoutUrl: this.getCheckoutUrl(),
            paymentData,
        };
    }
}
/**
 * Create Jenga client from environment variables (see .env.jenga.example).
 */
export function createJengaClientFromEnv() {
    const environment = (process.env.JENGA_ENVIRONMENT || "test");
    if (environment !== "test" && environment !== "live") {
        throw new Error(`Invalid JENGA_ENVIRONMENT: ${environment}. Must be "test" or "live".`);
    }
    const requiredEnvVars = [
        "JENGA_API_KEY",
        "JENGA_MERCHANT_CODE",
        "JENGA_CONSUMER_SECRET",
        "JENGA_PRIVATE_KEY_PATH",
        "JENGA_CALLBACK_URL",
    ];
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required Jenga environment variables: ${missingVars.join(", ")}`);
    }
    return new JengaCardPaymentClient({
        apiKey: process.env.JENGA_API_KEY,
        merchantCode: process.env.JENGA_MERCHANT_CODE,
        consumerSecret: process.env.JENGA_CONSUMER_SECRET,
        privateKeyPath: process.env.JENGA_PRIVATE_KEY_PATH,
        environment,
        defaultCallbackUrl: process.env.JENGA_CALLBACK_URL,
        ipnUsername: process.env.JENGA_IPN_USERNAME,
        ipnPassword: process.env.JENGA_IPN_PASSWORD,
        paymentTimeLimit: process.env.JENGA_PAYMENT_TIME_LIMIT || "15mins",
        defaultCountryCode: process.env.JENGA_DEFAULT_COUNTRY_CODE || "KE",
        defaultCurrency: process.env.JENGA_DEFAULT_CURRENCY || "KES",
    });
}
/** Normalize phone to digits starting with country code when possible (Kenya default). */
export function formatJengaPhone(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("254") && digits.length >= 12)
        return digits;
    if (digits.startsWith("0") && digits.length >= 10)
        return `254${digits.slice(1)}`;
    if (digits.length === 9)
        return `254${digits}`;
    return digits;
}
export function generateJengaOrderReference() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `NP${ts}${rand}`.slice(0, 32);
}
