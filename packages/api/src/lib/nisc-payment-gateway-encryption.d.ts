/**
 * Nisc Payment Gateway - Credential Encryption
 *
 * SECURITY CRITICAL: This module handles encryption/decryption of payment provider credentials
 *
 * ALGORITHM: AES-256-GCM
 * - 256-bit key (from environment variable)
 * - Galois/Counter Mode for authenticated encryption
 * - 16-byte initialization vector (random per encryption)
 * - 16-byte authentication tag (prevents tampering)
 *
 * FORMAT: iv:authTag:encrypted
 * - All parts hex-encoded for storage
 * - Example: "a1b2c3d4...":  "e5f6g7h8...":"i9j0k1l2..."
 *
 * KEY ROTATION: Supported via encryptionVersion field
 * - v1: Current key from NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY
 * - v2: Future key rotation (add NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY_V2)
 */
/**
 * M-Pesa credentials structure (for type safety)
 * Note: callbackUrl is auto-generated based on server URL + merchantId
 */
export type MpesaCredentials = {
    consumerKey: string;
    consumerSecret: string;
    shortCode: string;
    passkey: string;
};
/**
 * Stripe credentials structure (for future use)
 */
export type StripeCredentials = {
    secretKey: string;
    publishableKey: string;
    webhookSecret?: string;
};
/**
 * Generic credentials type
 */
export type ProviderCredentials = MpesaCredentials | StripeCredentials | Record<string, unknown>;
/**
 * Encryption result
 */
export type EncryptionResult = {
    encrypted: string;
    version: string;
};
/**
 * Encrypt credentials
 *
 * @param credentials - Payment provider credentials (will be JSON stringified)
 * @param version - Encryption key version (default: "v1")
 * @returns Encrypted string in format: iv:authTag:encrypted
 *
 * @example
 * const result = encryptCredentials({
 *   consumerKey: "abc",
 *   consumerSecret: "xyz",
 *   shortCode: "12345",
 *   passkey: "secret"
 * });
 * // result.encrypted = "a1b2c3...":  "e5f6g7...":"i9j0k1..."
 * // result.version = "v1"
 */
export declare function encryptCredentials(credentials: ProviderCredentials, version?: string): EncryptionResult;
/**
 * Decrypt credentials
 *
 * @param encryptedData - Encrypted string in format: iv:authTag:encrypted
 * @param version - Encryption key version (default: "v1")
 * @returns Decrypted credentials object
 *
 * @throws Error if decryption fails (wrong key, tampered data, invalid format)
 *
 * @example
 * const credentials = decryptCredentials("a1b2c3...":  "e5f6g7...":"i9j0k1...");
 * // credentials = { consumerKey: "abc", ... }
 */
export declare function decryptCredentials<T extends ProviderCredentials = ProviderCredentials>(encryptedData: string, version?: string): T;
/**
 * Re-encrypt credentials with a new key version
 *
 * Use this for key rotation:
 * 1. Add new key to environment (NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY_V2)
 * 2. Decrypt with old version
 * 3. Re-encrypt with new version
 * 4. Update database record
 *
 * @param encryptedData - Data encrypted with old version
 * @param oldVersion - Old encryption version (e.g., "v1")
 * @param newVersion - New encryption version (e.g., "v2")
 * @returns New encrypted data with new version
 */
export declare function rotateEncryptionKey(encryptedData: string, oldVersion: string, newVersion: string): EncryptionResult;
/**
 * Validate credentials structure (type-safe)
 *
 * @param credentials - Credentials object to validate
 * @param provider - Provider type (for specific validation)
 * @returns true if valid, throws error if invalid
 */
export declare function validateCredentials(credentials: ProviderCredentials, provider: "MPESA" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE"): boolean;
/**
 * Generate a secure encryption key (for setup)
 *
 * @returns 32-byte key as hex string (64 characters)
 *
 * @example
 * const key = generateEncryptionKey();
 * console.log(`NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY=${key}`);
 */
export declare function generateEncryptionKey(): string;
/**
 * Test encryption/decryption (for setup validation)
 *
 * @returns true if encryption is working correctly
 */
export declare function testEncryption(): boolean;
