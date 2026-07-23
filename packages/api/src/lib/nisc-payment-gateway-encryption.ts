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

import crypto from "node:crypto";
import { env } from "@npanel/env/server";

// =============================================================================
// CONSTANTS
// =============================================================================

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

// =============================================================================
// TYPES
// =============================================================================

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
  encrypted: string; // Format: iv:authTag:encrypted
  version: string; // e.g., "v1"
};

// =============================================================================
// KEY MANAGEMENT
// =============================================================================

/**
 * Get encryption key for a specific version
 * 
 * SECURITY: Keys must be:
 * - Exactly 32 bytes (64 hex characters)
 * - Stored securely (environment variable or secrets manager)
 * - Never logged or exposed in errors
 * - Rotated periodically (add new version, decrypt with old, re-encrypt with new)
 */
function getEncryptionKey(version: string = "v1"): Buffer {
  let keyHex: string;

  switch (version) {
    case "v1":
      keyHex = env.NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY ?? "";
      if (!keyHex) {
        throw new Error(
          "NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY environment variable not set. " +
          "Generate with: openssl rand -hex 32"
        );
      }
      break;

    case "v2":
      // Future key rotation support
      keyHex = process.env.NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY_V2 || "";
      if (!keyHex) {
        throw new Error("NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY_V2 not available for key rotation");
      }
      break;

    default:
      throw new Error(`Unknown encryption key version: ${version}`);
  }

  // Validate key format
  if (!/^[0-9a-f]{64}$/i.test(keyHex)) {
    throw new Error(
      `Invalid encryption key format for ${version}. ` +
      "Must be 64 hex characters (32 bytes). " +
      "Generate with: openssl rand -hex 32"
    );
  }

  return Buffer.from(keyHex, "hex");
}

// =============================================================================
// ENCRYPTION
// =============================================================================

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
export function encryptCredentials(
  credentials: ProviderCredentials,
  version: string = "v1"
): EncryptionResult {
  try {
    // Get encryption key
    const key = getEncryptionKey(version);

    // Generate random IV (must be unique for each encryption)
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt credentials (JSON stringified)
    const plaintext = JSON.stringify(credentials);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get authentication tag (prevents tampering)
    const authTag = cipher.getAuthTag();

    // Return formatted string: iv:authTag:encrypted
    return {
      encrypted: `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`,
      version,
    };
  } catch (error) {
    // SECURITY: Don't expose credentials in error messages
    throw new Error(
      `Failed to encrypt credentials: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// =============================================================================
// DECRYPTION
// =============================================================================

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
export function decryptCredentials<T extends ProviderCredentials = ProviderCredentials>(
  encryptedData: string,
  version: string = "v1"
): T {
  try {
    // Parse encrypted data: iv:authTag:encrypted
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format. Expected: iv:authTag:encrypted");
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Validate hex strings
    if (!/^[0-9a-f]+$/i.test(ivHex) || !/^[0-9a-f]+$/i.test(authTagHex) || !/^[0-9a-f]+$/i.test(encrypted)) {
      throw new Error("Invalid encrypted data format. Contains non-hex characters.");
    }

    // Convert from hex
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    // Validate lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length. Expected ${IV_LENGTH} bytes, got ${iv.length}`);
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length. Expected ${AUTH_TAG_LENGTH} bytes, got ${authTag.length}`);
    }

    // Get encryption key
    const key = getEncryptionKey(version);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    // Parse JSON
    return JSON.parse(decrypted) as T;
  } catch (error) {
    // SECURITY: Don't expose encryption details in error messages
    if (error instanceof Error) {
      if (error.message.includes("Unsupported state or unable to authenticate data")) {
        throw new Error("Decryption failed: Invalid key or tampered data");
      }
      if (error.message.includes("Invalid encrypted data format")) {
        throw error; // Re-throw format errors as-is
      }
    }
    throw new Error("Failed to decrypt credentials. Key may be incorrect or data may be corrupted.");
  }
}

// =============================================================================
// KEY ROTATION SUPPORT
// =============================================================================

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
export function rotateEncryptionKey(
  encryptedData: string,
  oldVersion: string,
  newVersion: string
): EncryptionResult {
  // Decrypt with old key
  const credentials = decryptCredentials(encryptedData, oldVersion);

  // Re-encrypt with new key
  return encryptCredentials(credentials, newVersion);
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate credentials structure (type-safe)
 * 
 * @param credentials - Credentials object to validate
 * @param provider - Provider type (for specific validation)
 * @returns true if valid, throws error if invalid
 */
export function validateCredentials(
  credentials: ProviderCredentials,
  provider: "MPESA" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE"
): boolean {
  if (!credentials || typeof credentials !== "object") {
    throw new Error("Credentials must be an object");
  }

  switch (provider) {
    case "MPESA":
      const mpesa = credentials as Partial<MpesaCredentials>;
      if (!mpesa.consumerKey || typeof mpesa.consumerKey !== "string") {
        throw new Error("M-Pesa credentials missing or invalid: consumerKey");
      }
      if (!mpesa.consumerSecret || typeof mpesa.consumerSecret !== "string") {
        throw new Error("M-Pesa credentials missing or invalid: consumerSecret");
      }
      if (!mpesa.shortCode || typeof mpesa.shortCode !== "string") {
        throw new Error("M-Pesa credentials missing or invalid: shortCode");
      }
      if (!mpesa.passkey || typeof mpesa.passkey !== "string") {
        throw new Error("M-Pesa credentials missing or invalid: passkey");
      }
      break;

    case "STRIPE":
      const stripe = credentials as Partial<StripeCredentials>;
      if (!stripe.secretKey || typeof stripe.secretKey !== "string") {
        throw new Error("Stripe credentials missing or invalid: secretKey");
      }
      if (!stripe.publishableKey || typeof stripe.publishableKey !== "string") {
        throw new Error("Stripe credentials missing or invalid: publishableKey");
      }
      break;

    default:
      // Generic validation for other providers
      if (Object.keys(credentials).length === 0) {
        throw new Error(`${provider} credentials cannot be empty`);
      }
  }

  return true;
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Generate a secure encryption key (for setup)
 * 
 * @returns 32-byte key as hex string (64 characters)
 * 
 * @example
 * const key = generateEncryptionKey();
 * console.log(`NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY=${key}`);
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}

/**
 * Test encryption/decryption (for setup validation)
 * 
 * @returns true if encryption is working correctly
 */
export function testEncryption(): boolean {
  try {
    const testData = {
      test: "value",
      number: 123,
      nested: { key: "data" },
    };

    const { encrypted, version } = encryptCredentials(testData);
    const decrypted = decryptCredentials(encrypted, version);

    return JSON.stringify(testData) === JSON.stringify(decrypted);
  } catch {
    return false;
  }
}
