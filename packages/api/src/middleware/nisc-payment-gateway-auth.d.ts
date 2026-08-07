/**
 * Nisc Payment Gateway - Authentication Middleware
 *
 * SECURITY CRITICAL: This middleware handles all authentication for external API calls
 *
 * FLOW:
 * 1. Extract API key from Authorization header
 * 2. Validate key format
 * 3. Query database for key record
 * 4. Verify key hash (constant-time comparison)
 * 5. Check key status (active, expired, revoked)
 * 6. Resolve merchant from API key
 * 7. Check merchant status (active, suspended)
 * 8. Validate IP restrictions (if configured)
 * 9. Check rate limits
 * 10. Attach merchant + key data to request context
 *
 * ISOLATION: Separate from main API auth - no session, no cookies, no user context
 */
import type { Request, Response, NextFunction } from "express";
/**
 * Merchant context attached to request
 */
export type NiscPaymentGatewayMerchantContext = {
    merchantId: string;
    merchantName: string;
    merchantEmail: string;
    merchantStatus: string;
    teamId: string | null;
    userId: string;
    settings: {
        webhookUrl?: string;
        webhookSecret?: string;
        allowedOrigins?: string[];
        ipWhitelist?: string[];
    };
};
/**
 * API key context attached to request
 */
export type NiscPaymentGatewayApiKeyContext = {
    apiKeyId: string;
    keyName: string;
    keyPrefix: string;
    permissions: string[];
    environment: string;
    rateLimit: number;
    allowedIps: string[] | null;
};
/**
 * Extended request type with gateway context
 */
export interface NiscPaymentGatewayRequest extends Request {
    niscGateway?: {
        merchant: NiscPaymentGatewayMerchantContext;
        apiKey: NiscPaymentGatewayApiKeyContext;
        ipAddress: string;
        userAgent: string;
    };
}
/**
 * Authenticate Nisc Payment Gateway requests
 *
 * SECURITY:
 * - Validates API key format and hash
 * - Checks key and merchant status
 * - Enforces IP restrictions
 * - Enforces rate limits
 * - Attaches merchant + key context to request
 *
 * ERROR RESPONSES:
 * - 401: Missing, invalid, or expired API key
 * - 403: IP not allowed, merchant suspended, insufficient permissions
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 *
 * @example
 * app.use("/api/nisc-gateway/v1", niscPaymentGatewayAuthMiddleware);
 */
export declare function niscPaymentGatewayAuthMiddleware(req: NiscPaymentGatewayRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * Check if API key has specific permission
 *
 * @param required - Required permission
 * @returns Middleware function
 *
 * @example
 * app.post("/payments", requirePermission("PAYMENT_CREATE"), handler);
 */
export declare function requirePermission(required: string): (req: NiscPaymentGatewayRequest, res: Response, next: NextFunction) => void;
