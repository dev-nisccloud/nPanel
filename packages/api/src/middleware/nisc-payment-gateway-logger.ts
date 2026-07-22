/**
 * Nisc Payment Gateway - Request Logging Middleware
 * 
 * PURPOSE: Log ALL requests to gateway API for:
 * - Debugging and troubleshooting
 * - Audit trails
 * - Security monitoring
 * - Billing data collection (via access logs)
 * 
 * DUAL LOGGING SYSTEM:
 * 1. Request Log (detailed): Full request/response for debugging
 * 2. Access Log (aggregated): Hourly counts for billing
 * 
 * SECURITY: Sanitize sensitive data before logging
 */

import type { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";

import { db } from "@npanel/db";
import {
  niscPaymentGatewayRequestLog,
} from "@npanel/db/schema/nisc-payment-gateway";
import type { NiscPaymentGatewayRequest } from "./nisc-payment-gateway-auth";
import { incrementAccessLog } from "../lib/nisc-payment-gateway-access-log";

// =============================================================================
// TYPES
// =============================================================================

type LogContext = {
  requestId: string;
  merchantId: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  path: string;
  ipAddress: string;
  userAgent: string;
  startTime: number;
  requestHeaders: Record<string, unknown>;
  requestBody: unknown;
  requestSize: number;
};

// =============================================================================
// SANITIZATION
// =============================================================================

/**
 * Sanitize headers (remove sensitive data)
 * 
 * REDACTED: Authorization, API keys, tokens
 * 
 * @param headers - Request headers
 * @returns Sanitized headers
 */
function sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...headers };

  // Redact authorization
  if (sanitized.authorization) {
    sanitized.authorization = "Bearer npg_***";
  }

  // Redact any other sensitive headers
  const sensitiveHeaders = [
    "cookie",
    "x-api-key",
    "api-key",
    "authorization",
    "proxy-authorization",
  ];

  for (const key of sensitiveHeaders) {
    if (sanitized[key]) {
      sanitized[key] = "[REDACTED]";
    }
  }

  return sanitized;
}

/**
 * Mask phone numbers in text
 * 
 * FORMAT: 254712345678 -> 2547*****678
 * 
 * @param text - Text to mask
 * @returns Masked text
 */
function maskPhoneNumbers(text: string): string {
  // Kenyan phone numbers: 254XXXXXXXXX (12 digits)
  return text.replace(/\b(254)(\d{5})(\d{3})\b/g, "$1*****$3");
}

/**
 * Sanitize request body (mask sensitive data)
 * 
 * MASKED: Phone numbers, account numbers, PINs
 * REDACTED: Passwords, secrets, tokens
 * 
 * @param body - Request body
 * @returns Sanitized body
 */
function sanitizeRequestBody(body: unknown): unknown {
  if (!body || typeof body !== "object") {
    return body;
  }

  const sanitized = JSON.parse(JSON.stringify(body)); // Deep clone

  // Recursive sanitization
  function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Redact completely
      if (
        lowerKey.includes("password") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("token") ||
        lowerKey.includes("pin")
      ) {
        obj[key] = "[REDACTED]";
        continue;
      }

      // Mask phone numbers
      if (
        lowerKey.includes("phone") ||
        lowerKey.includes("mobile") ||
        lowerKey.includes("msisdn")
      ) {
        if (typeof value === "string") {
          obj[key] = maskPhoneNumbers(value);
        }
        continue;
      }

      // Mask account numbers (show last 4 digits)
      if (lowerKey.includes("account") && typeof value === "string" && value.length > 4) {
        obj[key] = `***${value.slice(-4)}`;
        continue;
      }

      // Recursive for nested objects
      if (value && typeof value === "object" && !Array.isArray(value)) {
        obj[key] = sanitizeObject(value as Record<string, unknown>);
      }

      // Recursive for arrays
      if (Array.isArray(value)) {
        obj[key] = value.map((item) =>
          item && typeof item === "object" ? sanitizeObject(item) : item
        );
      }
    }

    return obj;
  }

  return sanitizeObject(sanitized as Record<string, unknown>);
}

/**
 * Sanitize response body (same rules as request)
 * 
 * @param body - Response body
 * @returns Sanitized body
 */
function sanitizeResponseBody(body: unknown): unknown {
  return sanitizeRequestBody(body); // Same rules
}

// =============================================================================
// SIZE CALCULATION
// =============================================================================

/**
 * Calculate approximate size of object in bytes
 * 
 * @param obj - Object to measure
 * @returns Size in bytes
 */
function calculateSize(obj: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(obj), "utf8");
  } catch {
    return 0;
  }
}

// =============================================================================
// LOGGING MIDDLEWARE
// =============================================================================

/**
 * Log requests to Nisc Payment Gateway
 * 
 * LOGS:
 * 1. Request Log: Detailed request/response for debugging
 * 2. Access Log: Aggregated hourly counts for billing
 * 
 * MUST RUN AFTER: niscPaymentGatewayAuthMiddleware
 * 
 * @example
 * app.use("/api/nisc-gateway/v1", 
 *   niscPaymentGatewayAuthMiddleware,
 *   niscPaymentGatewayLoggerMiddleware
 * );
 */
export function niscPaymentGatewayLoggerMiddleware(
  req: NiscPaymentGatewayRequest,
  res: Response,
  next: NextFunction
): void {
  // Skip if not authenticated (auth middleware should have rejected)
  if (!req.niscGateway) {
    next();
    return;
  }

  const requestId = nanoid();
  const startTime = Date.now();

  // Capture request details
  const logContext: LogContext = {
    requestId,
    merchantId: req.niscGateway.merchant.merchantId,
    apiKeyId: req.niscGateway.apiKey.apiKeyId,
    endpoint: req.baseUrl + req.path,
    method: req.method,
    path: req.path,
    ipAddress: req.niscGateway.ipAddress,
    userAgent: req.niscGateway.userAgent,
    startTime,
    requestHeaders: sanitizeHeaders(req.headers as Record<string, unknown>),
    requestBody: sanitizeRequestBody(req.body),
    requestSize: calculateSize(req.body),
  };

  // Capture original res.json to intercept response
  const originalJson = res.json.bind(res);
  let responseBody: unknown = null;
  let responseSize = 0;

  res.json = function (body: unknown) {
    responseBody = body;
    responseSize = calculateSize(body);
    return originalJson(body);
  };

  // Log after response is sent
  res.on("finish", async () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const success = statusCode >= 200 && statusCode < 400;

    // Extract time components
    const timestamp = new Date();
    const year = timestamp.getUTCFullYear();
    const month = timestamp.getUTCMonth() + 1;
    const day = timestamp.getUTCDate();
    const hour = timestamp.getUTCHours();

    // Determine if rate limit was hit (check for 429 status)
    const rateLimitHit = statusCode === 429;

    try {
      // 1. Write detailed request log (for debugging)
      await db.insert(niscPaymentGatewayRequestLog).values({
        id: requestId,
        merchantId: logContext.merchantId,
        apiKeyId: logContext.apiKeyId,
        endpoint: logContext.endpoint,
        method: logContext.method,
        path: logContext.path,
        requestHeaders: logContext.requestHeaders,
        requestBody: logContext.requestBody,
        requestSize: logContext.requestSize,
        ipAddress: logContext.ipAddress,
        userAgent: logContext.userAgent,
        statusCode,
        success,
        responseBody: sanitizeResponseBody(responseBody),
        responseSize,
        timestamp,
        durationMs,
        year,
        month,
        day,
        hour,
        rateLimitHit,
        // rawRequest and rawResponse are optional (for deep debugging)
        // Uncomment if needed:
        // rawRequest: JSON.stringify({ headers: req.headers, body: req.body }),
        // rawResponse: JSON.stringify(responseBody),
      });

      // 2. Increment aggregated access log (for billing)
      await incrementAccessLog(db, {
        merchantId: logContext.merchantId,
        apiKeyId: logContext.apiKeyId,
        endpoint: logContext.endpoint,
        method: logContext.method,
        statusCode,
        success,
        rateLimitHit,
      });

      console.log(
        `[Nisc Gateway Log] ${logContext.method} ${logContext.endpoint} - ` +
        `${statusCode} - ${durationMs}ms - Merchant: ${logContext.merchantId}`
      );
    } catch (error) {
      console.error("[Nisc Gateway Log] Failed to write logs:", error);
      // Don't throw - logging failure shouldn't break the request
    }
  });

  next();
}

// =============================================================================
// ERROR LOGGING
// =============================================================================

/**
 * Log errors for Nisc Payment Gateway requests
 * 
 * MUST RUN AFTER: niscPaymentGatewayLoggerMiddleware
 * 
 * @example
 * app.use("/api/nisc-gateway/v1", niscPaymentGatewayErrorLogger);
 */
export function niscPaymentGatewayErrorLogger(
  err: Error,
  req: NiscPaymentGatewayRequest,
  res: Response,
  next: NextFunction
): void {
  console.error("[Nisc Gateway Error]", {
    error: err.message,
    stack: err.stack,
    merchant: req.niscGateway?.merchant.merchantId,
    apiKey: req.niscGateway?.apiKey.apiKeyId,
    endpoint: req.baseUrl + req.path,
    method: req.method,
  });

  // Send error response
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Test sanitization functions
 * 
 * @returns true if all tests pass
 */
export function testSanitization(): boolean {
  // Test phone masking
  const phoneText = "Call 254712345678 or 254700123456";
  const masked = maskPhoneNumbers(phoneText);
  if (!masked.includes("2547*****678") || !masked.includes("2547*****456")) {
    return false;
  }

  // Test body sanitization
  const body = {
    phone: "254712345678",
    password: "secret123",
    account: "1234567890",
    nested: {
      pin: "1234",
      amount: 1000,
    },
  };
  const sanitized = sanitizeRequestBody(body) as Record<string, unknown>;
  
  if (sanitized.password !== "[REDACTED]") return false;
  if (sanitized.account !== "***7890") return false;
  if (!(sanitized.nested as Record<string, unknown>).pin || (sanitized.nested as Record<string, unknown>).pin !== "[REDACTED]") return false;

  return true;
}
