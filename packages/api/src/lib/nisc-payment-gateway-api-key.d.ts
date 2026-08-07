/**
 * Nisc Payment Gateway - API Key Management
 *
 * SECURITY CRITICAL: API keys are the primary authentication mechanism
 *
 * KEY FORMAT: npg_{environment}_{random}
 * - npg: Nisc Payment Gateway prefix
 * - environment: "live" or "test"
 * - random: 32-character random hex string
 *
 * STORAGE: Only bcrypt hash stored in database
 * SECURITY: Full key shown ONCE during creation, never retrievable
 *
 * EXAMPLES:
 * - npg_live_4a8f3e7c9b2d1f6e8a4b7c9d2e5f8a3b
 * - npg_test_9d2e5f8a3b4a8f3e7c9b2d1f6e8a4b7c
 */
export type Environment = "live" | "test";
export type ApiKeyGeneration = {
    key: string;
    keyPrefix: string;
    keyHash: string;
    environment: Environment;
};
/**
 * Generate a new API key
 *
 * @param environment - "live" for production, "test" for sandbox
 * @returns Object containing full key (show once) and hash (store in DB)
 *
 * SECURITY:
 * - Uses crypto.randomBytes for cryptographically secure random
 * - Bcrypt hash with 12 rounds (industry standard)
 * - Full key MUST be shown to user immediately (never retrievable)
 *
 * @example
 * const result = await generateApiKey("live");
 * console.log("API Key (show once):", result.key);
 * await db.insert(apiKey).values({ keyHash: result.keyHash });
 */
export declare function generateApiKey(environment: Environment): Promise<ApiKeyGeneration>;
/**
 * Validate API key format (before checking database)
 *
 * @param key - API key to validate
 * @returns true if format is valid
 *
 * FORMAT: npg_{live|test}_{32_hex_chars}
 *
 * @example
 * validateApiKeyFormat("npg_live_abc123...") // true
 * validateApiKeyFormat("invalid_key") // false
 */
export declare function validateApiKeyFormat(key: string): boolean;
/**
 * Extract environment from API key
 *
 * @param key - API key
 * @returns "live" or "test", or null if invalid
 */
export declare function extractEnvironment(key: string): Environment | null;
/**
 * Verify API key against hash (constant-time comparison)
 *
 * @param key - Plain API key from request
 * @param hash - Bcrypt hash from database
 * @returns true if key matches hash
 *
 * SECURITY: Uses bcrypt.compare for constant-time comparison (prevents timing attacks)
 */
export declare function verifyApiKey(key: string, hash: string): Promise<boolean>;
/**
 * Default permissions for new API keys
 */
export declare const DEFAULT_PERMISSIONS: readonly ["PAYMENT_CREATE", "PAYMENT_READ", "PAYMENT_LIST"];
/**
 * All available permissions
 */
export declare const ALL_PERMISSIONS: readonly ["PAYMENT_CREATE", "PAYMENT_READ", "PAYMENT_LIST", "REFUND_CREATE", "REFUND_READ", "WEBHOOK_READ", "WEBHOOK_RETRY"];
export type Permission = (typeof ALL_PERMISSIONS)[number];
/**
 * Check if API key has specific permission
 *
 * @param keyPermissions - Permissions array from database
 * @param required - Required permission
 * @returns true if key has permission
 */
export declare function hasPermission(keyPermissions: string[], required: Permission): boolean;
/**
 * Check if API key has all required permissions
 *
 * @param keyPermissions - Permissions array from database
 * @param required - Array of required permissions
 * @returns true if key has all permissions
 */
export declare function hasAllPermissions(keyPermissions: string[], required: Permission[]): boolean;
/**
 * Get key prefix for environment
 *
 * @param environment - "live" or "test"
 * @returns Prefix string (e.g., "npg_live_")
 */
export declare function getKeyPrefix(environment: Environment): string;
/**
 * Check if key is for production environment
 *
 * @param key - API key
 * @returns true if live key
 */
export declare function isLiveKey(key: string): boolean;
/**
 * Check if key is for sandbox environment
 *
 * @param key - API key
 * @returns true if test key
 */
export declare function isTestKey(key: string): boolean;
/**
 * Mask API key for display (security - never show full key)
 *
 * @param key - Full API key
 * @returns Masked key (e.g., "npg_live_***")
 *
 * @example
 * maskApiKey("npg_live_abc123...") // "npg_live_***"
 */
export declare function maskApiKey(key: string): string;
/**
 * Mask API key showing last 4 characters (for identification)
 *
 * @param key - Full API key
 * @returns Partially masked key (e.g., "npg_live_***8a3b")
 *
 * @example
 * maskApiKeyPartial("npg_live_abc...8a3b") // "npg_live_***8a3b"
 */
export declare function maskApiKeyPartial(key: string): string;
/**
 * Default rate limit (requests per minute)
 */
export declare const DEFAULT_RATE_LIMIT = 100;
/**
 * Generate Redis key for rate limiting
 *
 * @param apiKeyId - API key ID from database
 * @returns Redis key string
 */
export declare function getRateLimitKey(apiKeyId: string): string;
/**
 * Generate Redis key for quota tracking (future use)
 *
 * @param merchantId - Merchant ID
 * @returns Redis key string
 */
export declare function getQuotaKey(merchantId: string): string;
/**
 * API key validation error types
 */
export declare class ApiKeyError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
/**
 * Validate API key and throw appropriate error
 *
 * @param key - API key to validate
 * @throws ApiKeyError with specific code
 */
export declare function validateOrThrow(key: string): void;
/**
 * Generate a test API key (for development/testing only)
 *
 * WARNING: DO NOT USE IN PRODUCTION
 * - Uses fixed random value (not secure)
 * - For testing only
 */
export declare function generateTestApiKey(): string;
/**
 * Check if key is a test/development key (fixed pattern)
 *
 * @param key - API key
 * @returns true if test key
 */
export declare function isDevelopmentKey(key: string): boolean;
