/**
 * Token encryption/decryption service
 * Uses AES-256-GCM for encrypting OAuth tokens at rest
 */

import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 * Falls back to a default key in development (NOT FOR PRODUCTION)
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.CUSTOMER_OAUTH_ENCRYPTION_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CUSTOMER_OAUTH_ENCRYPTION_KEY environment variable is required in production"
      );
    }

    // Development fallback (NEVER use in production)
    console.warn(
      "WARNING: Using default encryption key. Set CUSTOMER_OAUTH_ENCRYPTION_KEY in production!"
    );
    return Buffer.alloc(KEY_LENGTH, "dev-key-not-secure");
  }

  if (secret.length < KEY_LENGTH) {
    throw new Error(
      `CUSTOMER_OAUTH_ENCRYPTION_KEY must be at least ${KEY_LENGTH} characters long`
    );
  }

  // Derive key using scrypt for consistent key size
  return crypto.scryptSync(secret, "oauth-salt", KEY_LENGTH);
}

/**
 * Encrypt a token string
 * Returns format: {iv}:{authTag}:{encrypted}
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty token");
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Return concatenated: iv:authTag:encrypted
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Token encryption failed:", error);
    throw new Error("Failed to encrypt token");
  }
}

/**
 * Decrypt an encrypted token
 * Expects format: {iv}:{authTag}:{encrypted}
 */
export function decryptToken(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error("Cannot decrypt empty ciphertext");
  }

  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted token format");
    }

    const [ivHex, authTagHex, encrypted] = parts;

    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error("Invalid encrypted token format");
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Token decryption failed:", error);
    throw new Error("Failed to decrypt token");
  }
}

/**
 * Check if a string appears to be an encrypted token
 */
export function isEncryptedToken(value: string): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  const parts = value.split(":");
  return parts.length === 3 && parts.every((part) => /^[0-9a-f]+$/.test(part));
}

/**
 * Securely compare two strings (constant-time to prevent timing attacks)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Generate a cryptographically secure random state token
 */
export function generateStateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a PKCE code verifier
 */
export function generateCodeVerifier(): string {
  return crypto
    .randomBytes(32)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 128);
}

/**
 * Generate PKCE code challenge from verifier
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
}

/**
 * Rotate encryption key (for key rotation strategy)
 * This would decrypt all tokens with old key and re-encrypt with new key
 * Should be run as a maintenance script, not during normal operations
 */
export async function rotateEncryptionKey(
  oldKey: string,
  newKey: string,
  encryptedTokens: string[]
): Promise<string[]> {
  // Temporarily override the key for decryption
  const originalKey = process.env.CUSTOMER_OAUTH_ENCRYPTION_KEY;

  try {
    const rotatedTokens: string[] = [];

    for (const encryptedToken of encryptedTokens) {
      // Decrypt with old key
      process.env.CUSTOMER_OAUTH_ENCRYPTION_KEY = oldKey;
      const plaintext = decryptToken(encryptedToken);

      // Encrypt with new key
      process.env.CUSTOMER_OAUTH_ENCRYPTION_KEY = newKey;
      const newEncrypted = encryptToken(plaintext);

      rotatedTokens.push(newEncrypted);
    }

    return rotatedTokens;
  } finally {
    // Restore original key
    process.env.CUSTOMER_OAUTH_ENCRYPTION_KEY = originalKey;
  }
}
