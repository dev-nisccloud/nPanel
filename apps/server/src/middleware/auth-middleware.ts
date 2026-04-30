import { createHash } from "node:crypto";
import { db, eq } from "@npanel/db";
import { apiKey } from "@npanel/db/schema/auth-extras";
import { user } from "@npanel/db/schema/auth";
import type { Context, Next } from "hono";
import { auth } from "@npanel/auth";

export async function apiKeyAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.substring(7).trim();

  // If it's a standard session token (not an API key starting with npanel_sk_),
  // we can check if there's a session.
  if (!token.startsWith("npanel_sk_")) {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user) {
      return c.json({ error: "Invalid session" }, 401);
    }

    c.set("user", session.user);
    return next();
  }

  // It's an API key
  const keyHash = createHash("sha256").update(token).digest("hex");

  const [keyRecord] = await db
    .select()
    .from(apiKey)
    .where(eq(apiKey.keyHash, keyHash))
    .limit(1);

  if (!keyRecord) {
    return c.json({ error: "Invalid API Key" }, 401);
  }

  if (!keyRecord.isActive) {
    return c.json({ error: "API Key is revoked" }, 401);
  }

  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    return c.json({ error: "API Key has expired" }, 401);
  }

  const [userRecord] = await db
    .select()
    .from(user)
    .where(eq(user.id, keyRecord.userId))
    .limit(1);

  if (!userRecord || userRecord.status !== "ACTIVE") {
    return c.json({ error: "Account associated with this API key is inactive" }, 401);
  }

  // Update lastUsedAt asynchronously
  void db.update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, keyRecord.id))
    .catch(err => console.error("Failed to update api key lastUsedAt:", err));

  c.set("user", userRecord);
  c.set("apiKey", keyRecord);

  return next();
}
