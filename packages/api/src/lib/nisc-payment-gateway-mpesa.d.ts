/**
 * Nisc Payment Gateway - M-Pesa Integration
 *
 * Handles M-Pesa STK push for gateway merchants
 * Separate from nPanel's internal M-Pesa
 *
 * DYNAMIC: URLs loaded from env based on merchant's chosen environment
 */
import type { MpesaCredentials } from "./nisc-payment-gateway-encryption";
/**
 * Request a Safaricom OAuth access token using merchant M-Pesa credentials.
 * Used by STK push and the WordPress / nPanel connection test.
 */
export declare function getGatewayMpesaAccessToken(credentials: MpesaCredentials, environment: "SANDBOX" | "PRODUCTION"): Promise<{
    accessToken: string;
    expiresIn?: number;
}>;
/**
 * Get M-Pesa callback URL for gateway merchant
 *
 * Dynamically built based on server URL + merchantId
 * All merchants use same server, different merchantId in path
 *
 * Uses process.env directly for runtime access (avoids startup validation)
 */
export declare function getGatewayMpesaCallbackUrl(merchantId: string): string;
/**
 * Initiate M-Pesa STK Push for gateway merchant
 *
 * @param credentials - Decrypted M-Pesa credentials
 * @param environment - "SANDBOX" (test) or "PRODUCTION" (live)
 * @param merchantId - Merchant ID (for callback URL)
 * @param request - Payment request details
 * @returns M-Pesa response
 */
export declare function initiateGatewayMpesaStkPush(credentials: MpesaCredentials, environment: "SANDBOX" | "PRODUCTION", merchantId: string, request: {
    amount: number;
    phoneNumber: string;
    accountReference: string;
    transactionDesc: string;
}): Promise<unknown>;
