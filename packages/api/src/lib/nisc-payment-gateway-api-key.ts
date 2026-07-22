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

import crypto from "node:crypto";
import bcrypt from "bcryptjs";

// =============================================================================
// CONSTANTS
// =============================================================================

const KEY_PREFIX = "npg";
const RANDOM_LENGTH = 32; // 32 hex characters = 16 bytes
const BCRYPT_ROUNDS = 12; // More rounds = more secure but slower

// =============================================================================
// TYPES
// =============================================================================

export type Environment = "live" | "test";

export type ApiKeyGeneration = {
  key: string; // Full key (shown once)
  keyPrefix: string; // e.g., "npg_live_"
  keyHash: string; // bcrypt hash (stored in DB)
  environment: Environment;
};

// =============================================================================
// KEY GENERATION
// =============================================================================

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
export async function generateApiKey(
  environment: Environment
): Promise<ApiKeyGeneration> {
  // Generate random component (32 hex characters)
  const random = crypto.randomBytes(RANDOM_LENGTH / 2).toString("hex");

  // Build full key
  const keyPrefix = `${KEY_PREFIX}_${environment}_`;
  const key = `${keyPrefix}${random}`;

  // Hash for storage (NEVER store plaintext)
  const keyHash = await bcrypt.hash(key, BCRYPT_ROUNDS);

  return {
    key,
    keyPrefix,
    keyHash,
    environment,
  };
}

// =============================================================================
// KEY VALIDATION
// =============================================================================

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
export function validateApiKeyFormat(key: string): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }

  // Regex: npg_(live|test)_[0-9a-f]{32}
  const pattern = /^npg_(live|test)_[0-9a-f]{32}$/;
  return pattern.test(key);
}

/**
 * Extract environment from API key
 * 
 * @param key - API key
 * @returns "live" or "test", or null if invalid
 */
export function extractEnvironment(key: string): Environment | null {
  if (!validateApiKeyFormat(key)) {
    return null;
  }

  const parts = key.split("_");
  return (parts[1] as Environment) || null;
}

/**
 * Verify API key against hash (constant-time comparison)
 * 
 * @param key - Plain API key from request
 * @param hash - Bcrypt hash from database
 * @returns true if key matches hash
 * 
 * SECURITY: Uses bcrypt.compare for constant-time comparison (prevents timing attacks)
 */
export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(key, hash);
  } catch {
    // Invalid hash format or other error
    return false;
  }
}

// =============================================================================
// KEY PERMISSIONS
// =============================================================================

/**
 * Default permissions for new API keys
 */
export const DEFAULT_PERMISSIONS = [
  "PAYMENT_CREATE",
  "PAYMENT_READ",
  "PAYMENT_LIST",
] as const;

/**
 * All available permissions
 */
export const ALL_PERMISSIONS = [
  "PAYMENT_CREATE", // Create payment requests
  "PAYMENT_READ", // Query payment status
  "PAYMENT_LIST", // List merchant's payments
  "REFUND_CREATE", // Initiate refunds
  "REFUND_READ", // Query refund status
  "WEBHOOK_READ", // View webhook logs
  "WEBHOOK_RETRY", // Retry failed webhooks
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

/**
 * Check if API key has specific permission
 * 
 * @param keyPermissions - Permissions array from database
 * @param required - Required permission
 * @returns true if key has permission
 */
export function hasPermission(
  keyPermissions: string[],
  required: Permission
): boolean {
  return keyPermissions.includes(required);
}

/**
 * Check if API key has all required permissions
 * 
 * @param keyPermissions - Permissions array from database
 * @param required - Array of required permissions
 * @returns true if key has all permissions
 */
export function hasAllPermissions(
  keyPermissions: string[],
  required: Permission[]
): boolean {
  return required.every((perm) => keyPermissions.includes(perm));
}

// =============================================================================
// KEY PREFIX HELPERS
// =============================================================================

/**
 * Get key prefix for environment
 * 
 * @param environment - "live" or "test"
 * @returns Prefix string (e.g., "npg_live_")
 */
export function getKeyPrefix(environment: Environment): string {
  return `${KEY_PREFIX}_${environment}_`;
}

/**
 * Check if key is for production environment
 * 
 * @param key - API key
 * @returns true if live key
 */
export function isLiveKey(key: string): boolean {
  return extractEnvironment(key) === "live";
}

/**
 * Check if key is for sandbox environment
 * 
 * @param key - API key
 * @returns true if test key
 */
export function isTestKey(key: string): boolean {
  return extractEnvironment(key) === "test";
}

// =============================================================================
// KEY MASKING (FOR DISPLAY)
// =============================================================================

/**
 * Mask API key for display (security - never show full key)
 * 
 * @param key - Full API key
 * @returns Masked key (e.g., "npg_live_***")
 * 
 * @example
 * maskApiKey("npg_live_abc123...") // "npg_live_***"
 */
export function maskApiKey(key: string): string {
  if (!key || !validateApiKeyFormat(key)) {
    return "***";
  }

  const env = extractEnvironment(key);
  return `${KEY_PREFIX}_${env}_***`;
}

/**
 * Mask API key showing last 4 characters (for identification)
 * 
 * @param key - Full API key
 * @returns Partially masked key (e.g., "npg_live_***8a3b")
 * 
 * @example
 * maskApiKeyPartial("npg_live_abc...8a3b") // "npg_live_***8a3b"
 */
export function maskApiKeyPartial(key: string): string {
  if (!key || !validateApiKeyFormat(key)) {
    return "***";
  }

  const env = extractEnvironment(key);
  const lastFour = key.slice(-4);
  return `${KEY_PREFIX}_${env}_***${lastFour}`;
}

// =============================================================================
// RATE LIMIT HELPERS
// =============================================================================

/**
 * Default rate limit (requests per minute)
 */
export const DEFAULT_RATE_LIMIT = 100;

/**
 * Generate Redis key for rate limiting
 * 
 * @param apiKeyId - API key ID from database
 * @returns Redis key string
 */
export function getRateLimitKey(apiKeyId: string): string {
  return `nisc_payment_gateway:ratelimit:${apiKeyId}`;
}

/**
 * Generate Redis key for quota tracking (future use)
 * 
 * @param merchantId - Merchant ID
 * @returns Redis key string
 */
export function getQuotaKey(merchantId: string): string {
  return `nisc_payment_gateway:quota:${merchantId}`;
}

// =============================================================================
// VALIDATION ERRORS
// =============================================================================

/**
 * API key validation error types
 */
export class ApiKeyError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "ApiKeyError";
  }
}

/**
 * Validate API key and throw appropriate error
 * 
 * @param key - API key to validate
 * @throws ApiKeyError with specific code
 */
export function validateOrThrow(key: string): void {
  if (!key) {
    throw new ApiKeyError(
      "API key is required",
      "MISSING_API_KEY",
      401
    );
  }

  if (!validateApiKeyFormat(key)) {
    throw new ApiKeyError(
      "Invalid API key format. Expected: npg_{live|test}_{32_hex}",
      "INVALID_API_KEY_FORMAT",
      401
    );
  }
}

// =============================================================================
// TESTING UTILITIES
// =============================================================================

/**
 * Generate a test API key (for development/testing only)
 * 
 * WARNING: DO NOT USE IN PRODUCTION
 * - Uses fixed random value (not secure)
 * - For testing only
 */
export function generateTestApiKey(): string {
  const random = "0".repeat(RANDOM_LENGTH); // Fixed value
  return `${KEY_PREFIX}_test_${random}`;
}

/**
 * Check if key is a test/development key (fixed pattern)
 * 
 * @param key - API key
 * @returns true if test key
 */
export function isDevelopmentKey(key: string): boolean {
  return key === generateTestApiKey();
}
