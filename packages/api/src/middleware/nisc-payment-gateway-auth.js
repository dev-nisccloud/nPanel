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
import { db, eq, and } from "@npanel/db";
import { niscPaymentGatewayApiKey, niscPaymentGatewayMerchant, } from "@npanel/db/schema/nisc-payment-gateway";
import { validateApiKeyFormat, verifyApiKey, ApiKeyError, maskApiKeyPartial, } from "../lib/nisc-payment-gateway-api-key";
// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
/**
 * Extract API key from Authorization header
 *
 * FORMAT: Authorization: Bearer npg_live_...
 *
 * @param req - Express request
 * @returns API key or null
 */
function extractApiKey(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return null;
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer")
        return null;
    return parts[1];
}
/**
 * Extract client IP address (handles proxies)
 *
 * @param req - Express request
 * @returns IP address
 */
function extractIpAddress(req) {
    // Check X-Forwarded-For header (proxy)
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
        const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        return ips.split(",")[0].trim();
    }
    // Check X-Real-IP header (nginx)
    const realIp = req.headers["x-real-ip"];
    if (realIp) {
        return Array.isArray(realIp) ? realIp[0] : realIp;
    }
    // Fallback to direct connection
    return req.socket.remoteAddress || "unknown";
}
/**
 * Check if IP is allowed
 *
 * @param ipAddress - Client IP address
 * @param allowedIps - List of allowed IPs (CIDR or exact match)
 * @returns true if allowed
 */
function isIpAllowed(ipAddress, allowedIps) {
    if (!allowedIps || allowedIps.length === 0) {
        // No restrictions
        return true;
    }
    // Exact match
    if (allowedIps.includes(ipAddress)) {
        return true;
    }
    // TODO: Add CIDR range matching for production
    // For now, only exact match supported
    return false;
}
// =============================================================================
// RATE LIMITING (IN-MEMORY - TODO: MOVE TO REDIS)
// =============================================================================
/**
 * Simple in-memory rate limiter (for development)
 * TODO: Move to Redis for production (distributed rate limiting)
 */
const rateLimitStore = new Map();
/**
 * Check rate limit for API key
 *
 * @param apiKeyId - API key ID
 * @param limit - Requests per minute
 * @returns true if under limit
 */
function checkRateLimit(apiKeyId, limit) {
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000; // Start of current minute
    const key = `${apiKeyId}:${windowStart}`;
    const record = rateLimitStore.get(key);
    if (!record) {
        rateLimitStore.set(key, { count: 1, resetAt: windowStart + 60000 });
        return true;
    }
    if (record.count >= limit) {
        return false;
    }
    record.count++;
    return true;
}
/**
 * Cleanup old rate limit records (called periodically)
 */
function cleanupRateLimitStore() {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (record.resetAt < now) {
            rateLimitStore.delete(key);
        }
    }
}
// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================
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
export async function niscPaymentGatewayAuthMiddleware(req, res, next) {
    try {
        // Extract API key
        const apiKey = extractApiKey(req);
        if (!apiKey) {
            res.status(401).json({
                error: {
                    code: "MISSING_API_KEY",
                    message: "API key is required. Provide in Authorization header: Bearer npg_...",
                },
            });
            return;
        }
        // Validate format
        if (!validateApiKeyFormat(apiKey)) {
            res.status(401).json({
                error: {
                    code: "INVALID_API_KEY_FORMAT",
                    message: "Invalid API key format. Expected: npg_{live|test}_{32_hex}",
                },
            });
            return;
        }
        // Query database for API key (by keyHash)
        // Note: We need to query all potential matches and verify hash (no index on hash)
        // For production: Consider adding keyPrefix index for faster lookup
        const apiKeyRecords = await db
            .select()
            .from(niscPaymentGatewayApiKey)
            .where(eq(niscPaymentGatewayApiKey.isActive, true));
        // Find matching key (constant-time comparison)
        let matchedKey = null;
        for (const record of apiKeyRecords) {
            if (await verifyApiKey(apiKey, record.keyHash)) {
                matchedKey = record;
                break;
            }
        }
        if (!matchedKey) {
            res.status(401).json({
                error: {
                    code: "INVALID_API_KEY",
                    message: "API key is invalid or has been revoked",
                },
            });
            return;
        }
        // Check expiration
        if (matchedKey.expiresAt && matchedKey.expiresAt < new Date()) {
            res.status(401).json({
                error: {
                    code: "API_KEY_EXPIRED",
                    message: "API key has expired",
                },
            });
            return;
        }
        // Query merchant
        const merchant = await db
            .select()
            .from(niscPaymentGatewayMerchant)
            .where(eq(niscPaymentGatewayMerchant.id, matchedKey.merchantId))
            .limit(1);
        if (!merchant[0]) {
            res.status(403).json({
                error: {
                    code: "MERCHANT_NOT_FOUND",
                    message: "Merchant account not found",
                },
            });
            return;
        }
        // Check merchant status
        if (merchant[0].status === "SUSPENDED") {
            res.status(403).json({
                error: {
                    code: "MERCHANT_SUSPENDED",
                    message: "Merchant account is suspended. Contact support.",
                },
            });
            return;
        }
        if (merchant[0].status === "CLOSED") {
            res.status(403).json({
                error: {
                    code: "MERCHANT_CLOSED",
                    message: "Merchant account is closed",
                },
            });
            return;
        }
        if (merchant[0].status !== "ACTIVE") {
            res.status(403).json({
                error: {
                    code: "MERCHANT_NOT_ACTIVE",
                    message: "Merchant account is not active",
                },
            });
            return;
        }
        // Extract IP address
        const ipAddress = extractIpAddress(req);
        // Check IP restrictions (from API key)
        if (matchedKey.allowedIps && !isIpAllowed(ipAddress, matchedKey.allowedIps)) {
            res.status(403).json({
                error: {
                    code: "IP_NOT_ALLOWED",
                    message: "Request from unauthorized IP address",
                },
            });
            return;
        }
        // Check IP restrictions (from merchant settings)
        const merchantSettings = merchant[0].settings;
        if (merchantSettings.ipWhitelist && !isIpAllowed(ipAddress, merchantSettings.ipWhitelist)) {
            res.status(403).json({
                error: {
                    code: "IP_NOT_ALLOWED",
                    message: "Request from unauthorized IP address",
                },
            });
            return;
        }
        // Check rate limit
        if (!checkRateLimit(matchedKey.id, matchedKey.rateLimit)) {
            res.status(429).json({
                error: {
                    code: "RATE_LIMIT_EXCEEDED",
                    message: `Rate limit exceeded. Maximum ${matchedKey.rateLimit} requests per minute.`,
                },
            });
            return;
        }
        // Update last used timestamp (async, don't await)
        db.update(niscPaymentGatewayApiKey)
            .set({ lastUsedAt: new Date() })
            .where(eq(niscPaymentGatewayApiKey.id, matchedKey.id))
            .catch((err) => {
            console.error("Failed to update API key lastUsedAt:", err);
        });
        // Attach context to request
        req.niscGateway = {
            merchant: {
                merchantId: merchant[0].id,
                merchantName: merchant[0].merchantName,
                merchantEmail: merchant[0].merchantEmail,
                merchantStatus: merchant[0].status,
                teamId: merchant[0].teamId,
                userId: merchant[0].userId,
                settings: merchantSettings,
            },
            apiKey: {
                apiKeyId: matchedKey.id,
                keyName: matchedKey.name,
                keyPrefix: matchedKey.keyPrefix,
                permissions: matchedKey.permissions || [],
                environment: matchedKey.environment,
                rateLimit: matchedKey.rateLimit,
                allowedIps: matchedKey.allowedIps || null,
            },
            ipAddress,
            userAgent: req.headers["user-agent"] || "unknown",
        };
        // Log successful authentication (for audit)
        console.log(`[Nisc Gateway Auth] Merchant: ${merchant[0].merchantName}, ` +
            `Key: ${maskApiKeyPartial(apiKey)}, IP: ${ipAddress}`);
        next();
    }
    catch (error) {
        console.error("[Nisc Gateway Auth] Error:", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Internal server error during authentication",
            },
        });
    }
}
// =============================================================================
// PERMISSION CHECKING MIDDLEWARE
// =============================================================================
/**
 * Check if API key has specific permission
 *
 * @param required - Required permission
 * @returns Middleware function
 *
 * @example
 * app.post("/payments", requirePermission("PAYMENT_CREATE"), handler);
 */
export function requirePermission(required) {
    return (req, res, next) => {
        if (!req.niscGateway) {
            res.status(401).json({
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication required",
                },
            });
            return;
        }
        const permissions = req.niscGateway.apiKey.permissions;
        if (!permissions.includes(required)) {
            res.status(403).json({
                error: {
                    code: "INSUFFICIENT_PERMISSIONS",
                    message: `This API key does not have the '${required}' permission`,
                },
            });
            return;
        }
        next();
    };
}
