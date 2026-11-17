/**
 * Website checkout email confirmation.
 *
 * A 6-digit code is emailed before any account is created. Codes are stored hashed in the
 * Better Auth `verification` table (10 minute expiry, 5 attempts). A correct code returns a
 * short-lived signed proof that `storefront.auth.register` requires for the same email.
 */

import * as crypto from "node:crypto";
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { verification } from "@npanel/db/schema/auth";

export const CHECKOUT_CODE_TTL_MINUTES = 10;
const CODE_MAX_ATTEMPTS = 5;
const PROOF_TTL_MS = 30 * 60 * 1000;
const IDENTIFIER_PREFIX = "storefront-email-code:";

type StoredCode = { hash: string; attempts: number };

function getSecret(): Buffer {
  const secret = process.env.STOREFRONT_JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("STOREFRONT_JWT_SECRET must be set and at least 32 characters long");
  }
  return Buffer.from(secret, "utf8");
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function normalizeCheckoutEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Replaces any earlier code for this email and returns the new one. */
export async function issueCheckoutEmailCode(email: string): Promise<string> {
  const normalized = normalizeCheckoutEmail(email);
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const identifier = IDENTIFIER_PREFIX + normalized;
  const now = new Date();

  await db.delete(verification).where(eq(verification.identifier, identifier));
  await db.insert(verification).values({
    id: crypto.randomUUID(),
    identifier,
    value: JSON.stringify({ hash: hmac(`${normalized}:${code}`), attempts: 0 } satisfies StoredCode),
    expiresAt: new Date(now.getTime() + CHECKOUT_CODE_TTL_MINUTES * 60 * 1000),
    createdAt: now,
    updatedAt: now,
  });
  return code;
}

export type CheckoutCodeResult =
  | { ok: true; proof: string }
  | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" };

export async function verifyCheckoutEmailCode(
  email: string,
  code: string,
): Promise<CheckoutCodeResult> {
  const normalized = normalizeCheckoutEmail(email);
  const identifier = IDENTIFIER_PREFIX + normalized;
  const [row] = await db
    .select()
    .from(verification)
    .where(eq(verification.identifier, identifier))
    .limit(1);

  if (!row || row.expiresAt < new Date()) {
    if (row) await db.delete(verification).where(eq(verification.id, row.id));
    return { ok: false, reason: "expired" };
  }

  let stored: StoredCode;
  try {
    stored = JSON.parse(row.value) as StoredCode;
  } catch {
    await db.delete(verification).where(eq(verification.id, row.id));
    return { ok: false, reason: "expired" };
  }

  if (stored.attempts >= CODE_MAX_ATTEMPTS) {
    await db.delete(verification).where(eq(verification.id, row.id));
    return { ok: false, reason: "too_many_attempts" };
  }

  if (!safeEqual(stored.hash, hmac(`${normalized}:${code.trim()}`))) {
    await db
      .update(verification)
      .set({
        value: JSON.stringify({ ...stored, attempts: stored.attempts + 1 }),
        updatedAt: new Date(),
      })
      .where(eq(verification.id, row.id));
    return { ok: false, reason: "invalid" };
  }

  await db.delete(verification).where(eq(verification.id, row.id));
  const payload = Buffer.from(
    JSON.stringify({ email: normalized, exp: Date.now() + PROOF_TTL_MS }),
  ).toString("base64url");
  return { ok: true, proof: `${payload}.${hmac(`proof:${payload}`)}` };
}

export function isValidCheckoutEmailProof(proof: string, email: string): boolean {
  const [payload, signature] = proof.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(signature, hmac(`proof:${payload}`))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email?: string;
      exp?: number;
    };
    return data.email === normalizeCheckoutEmail(email) && typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}