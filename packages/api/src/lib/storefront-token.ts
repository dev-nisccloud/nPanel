/**
 * Storefront checkout token helpers.
 *
 * Issues and verifies short-lived HMAC-signed tokens scoped to a single
 * checkout session on the public landing page. These tokens carry just enough
 * identity (userId + teamId + teamSlug) to allow the storefront router to act
 * on behalf of the newly-registered customer without creating a full browser
 * session. They are NOT session tokens and grant no dashboard access.
 *
 * Signing uses HMAC-SHA256 with STOREFRONT_JWT_SECRET (must be set in env).
 * Token format (URL-safe base64):  <header>.<payload>.<signature>
 * TTL is 20 minutes from issuance.
 */

import * as crypto from "node:crypto";

const ALGORITHM = "sha256";
const TOKEN_TTL_MS = 20 * 60 * 1000; // 20 minutes

export interface StorefrontTokenPayload {
  /** better-auth user id */
  userId: string;
  /** team id created for this user */
  teamId: string;
  /** team slug for post-checkout redirect in nPanel */
  teamSlug: string;
  /** issued-at unix ms */
  iat: number;
  /** expiry unix ms */
  exp: number;
}

function getSecret(): Buffer {
  const secret = process.env.STOREFRONT_JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "STOREFRONT_JWT_SECRET must be set and at least 32 characters long",
    );
  }
  return Buffer.from(secret, "utf8");
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(data: string, secret: Buffer): string {
  return b64url(
    crypto.createHmac(ALGORITHM, secret).update(data).digest(),
  );
}

/**
 * Issue a short-lived storefront checkout token.
 */
export function signStorefrontToken(
  userId: string,
  teamId: string,
  teamSlug: string,
): string {
  const now = Date.now();
  const payload: StorefrontTokenPayload = {
    userId,
    teamId,
    teamSlug,
    iat: now,
    exp: now + TOKEN_TTL_MS,
  };

  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "SFCO" }), "utf8"));
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = sign(`${header}.${body}`, getSecret());
  return `${header}.${body}.${sig}`;
}

export type VerifyStorefrontTokenResult =
  | { ok: true; payload: StorefrontTokenPayload }
  | { ok: false; reason: "invalid" | "expired" | "malformed" };

/**
 * Verify a storefront checkout token.
 * Returns the payload if valid, or a typed error if not.
 */
export function verifyStorefrontToken(token: string): VerifyStorefrontTokenResult {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { ok: false, reason: "malformed" };

    const [header, body, sig] = parts as [string, string, string];
    const secret = getSecret();
    const expected = sign(`${header}.${body}`, secret);

    // Constant-time comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expected, "utf8");
    const actualBuf = Buffer.from(sig, "utf8");
    if (
      expectedBuf.length !== actualBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, actualBuf)
    ) {
      return { ok: false, reason: "invalid" };
    }

    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as StorefrontTokenPayload;

    if (Date.now() > payload.exp) {
      return { ok: false, reason: "expired" };
    }

    if (!payload.userId || !payload.teamId || !payload.teamSlug) {
      return { ok: false, reason: "malformed" };
    }

    return { ok: true, payload };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

/**
 * Verify a storefront token and throw a typed TRPCError on failure.
 * Use inside storefront procedures.
 */
export function verifyStorefrontTokenOrThrow(token: string): StorefrontTokenPayload {
  const result = verifyStorefrontToken(token);
  if (result.ok) return result.payload;

  // Intentionally vague  don't reveal whether the token existed or expired
  const { TRPCError } = require("@trpc/server") as typeof import("@trpc/server");
  throw new TRPCError({
    code: "UNAUTHORIZED",
    message:
      result.reason === "expired"
        ? "Your checkout session has expired. Please start again."
        : "Invalid checkout session.",
  });
}
