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
 * Get M-Pesa URLs based on environment
 * Merchant chooses "SANDBOX" or "PRODUCTION", we handle the URLs
 * 
 * Uses process.env directly for runtime access (avoids startup validation)
 */
function getMpesaUrls(environment: "SANDBOX" | "PRODUCTION") {
  if (environment === "PRODUCTION") {
    return {
      tokenUrl: process.env.NISC_GATEWAY_MPESA_PRODUCTION_TOKEN_URL || 
        "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      stkUrl: process.env.NISC_GATEWAY_MPESA_PRODUCTION_STK_URL || 
        "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      baseUrl: process.env.NISC_GATEWAY_MPESA_PRODUCTION_BASE_URL || 
        "https://api.safaricom.co.ke",
    };
  }

  // Sandbox (default)
  return {
    tokenUrl: process.env.NISC_GATEWAY_MPESA_SANDBOX_TOKEN_URL || 
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    stkUrl: process.env.NISC_GATEWAY_MPESA_SANDBOX_STK_URL || 
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    baseUrl: process.env.NISC_GATEWAY_MPESA_SANDBOX_BASE_URL || 
      "https://sandbox.safaricom.co.ke",
  };
}

/**
 * Request a Safaricom OAuth access token using merchant M-Pesa credentials.
 * Used by STK push and the WordPress / nPanel connection test.
 */
export async function getGatewayMpesaAccessToken(
  credentials: MpesaCredentials,
  environment: "SANDBOX" | "PRODUCTION"
): Promise<{ accessToken: string; expiresIn?: number }> {
  const mpesaUrls = getMpesaUrls(environment);
  const auth = Buffer.from(
    `${credentials.consumerKey}:${credentials.consumerSecret}`
  ).toString("base64");

  const tokenResponse = await fetch(mpesaUrls.tokenUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text().catch(() => "");
    throw new Error(
      `M-Pesa token request failed (${tokenResponse.status}${body ? `: ${body.slice(0, 160)}` : ""})`
    );
  }

  const data = (await tokenResponse.json()) as {
    access_token?: string;
    expires_in?: string | number;
  };

  if (!data.access_token) {
    throw new Error("Failed to get M-Pesa access token");
  }

  return {
    accessToken: data.access_token,
    expiresIn:
      data.expires_in !== undefined ? Number(data.expires_in) : undefined,
  };
}

/**
 * Get M-Pesa callback URL for gateway merchant
 * 
 * Dynamically built based on server URL + merchantId
 * All merchants use same server, different merchantId in path
 * 
 * Uses process.env directly for runtime access (avoids startup validation)
 */
export function getGatewayMpesaCallbackUrl(merchantId: string): string {
  const baseUrl = process.env.NISC_GATEWAY_BASE_URL || process.env.BETTER_AUTH_URL || "";
  if (!baseUrl) {
    throw new Error("NISC_GATEWAY_BASE_URL or BETTER_AUTH_URL must be set");
  }
  return `${baseUrl}/api/nisc-gateway/webhooks/mpesa/${merchantId}`;
}

/**
 * Initiate M-Pesa STK Push for gateway merchant
 * 
 * @param credentials - Decrypted M-Pesa credentials
 * @param environment - "SANDBOX" (test) or "PRODUCTION" (live)
 * @param merchantId - Merchant ID (for callback URL)
 * @param request - Payment request details
 * @returns M-Pesa response
 */
export async function initiateGatewayMpesaStkPush(
  credentials: MpesaCredentials,
  environment: "SANDBOX" | "PRODUCTION",
  merchantId: string,
  request: {
    amount: number;
    phoneNumber: string;
    accountReference: string;
    transactionDesc: string;
  }
) {
  // Get URLs based on merchant's chosen environment
  const mpesaUrls = getMpesaUrls(environment);
  const callbackUrl = getGatewayMpesaCallbackUrl(merchantId);
  const { accessToken } = await getGatewayMpesaAccessToken(
    credentials,
    environment
  );
  
  // Generate password for STK push
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  
  const password = Buffer.from(
    `${credentials.shortCode}${credentials.passkey}${timestamp}`
  ).toString("base64");
  
  // Initiate STK push
  const stkResponse = await fetch(mpesaUrls.stkUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: credentials.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: request.amount,
      PartyA: request.phoneNumber,
      PartyB: credentials.shortCode,
      PhoneNumber: request.phoneNumber,
      CallBackURL: callbackUrl, // Dynamic callback per merchant
      AccountReference: request.accountReference,
      TransactionDesc: request.transactionDesc,
    }),
  });
  
  if (!stkResponse.ok) {
    throw new Error(`M-Pesa STK push failed: ${stkResponse.statusText}`);
  }
  
  return stkResponse.json();
}
