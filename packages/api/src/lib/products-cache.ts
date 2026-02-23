import { getRedisClient } from "./redis";

const PREFIX = "products";
const VERSION_KEY = `${PREFIX}:version`;
const TTL_SECONDS = 300; // 5 min

function cacheKey(parts: string[]): string {
  return [PREFIX, ...parts].join(":");
}

/**
 * Get current cache version (bump this on any product/plan mutation to invalidate all).
 */
async function getVersion(redis: NonNullable<ReturnType<typeof getRedisClient>>): Promise<number> {
  const v = await redis.get(VERSION_KEY);
  return typeof v === "string" ? parseInt(v, 10) : v === null ? 0 : Number(v);
}

/**
 * Bump version to invalidate all product caches. Call after create/update/delete product or plan.
 */
export async function invalidateProductsCache(): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    const v = await getVersion(redis);
    await redis.set(VERSION_KEY, String(v + 1));
  } catch (e) {
    console.error("[products-cache] invalidate error:", e);
  }
}

/**
 * Get from cache. Returns null on miss or if Redis unavailable.
 */
export async function getCached<T>(keyParts: string[]): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const v = await getVersion(redis);
    const key = cacheKey([...keyParts, String(v)]);
    const raw = await redis.get(key);
    if (raw === null || raw === undefined) return null;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Set cache with TTL. Uses STALE_TTL so we can serve stale while revalidating later if needed.
 */
export async function setCached(keyParts: string[], value: unknown): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    const v = await getVersion(redis);
    const key = cacheKey([...keyParts, String(v)]);
    const json = JSON.stringify(value);
    await redis.setex(key, TTL_SECONDS, json);
  } catch (e) {
    console.error("[products-cache] set error:", e);
  }
}

/** Cache key for getAll (optional filter). */
export function listKey(input?: { category?: string; serviceType?: string; isActive?: boolean }): string[] {
  if (!input) return ["list", "all"];
  const parts = ["list", input.category ?? "", input.serviceType ?? "", input.isActive === undefined ? "" : String(input.isActive)];
  return parts;
}

/** Cache key for getById. */
export function idKey(id: string, includePlans: boolean): string[] {
  return ["id", id, includePlans ? "plans" : "base"];
}

/** Cache key for getAddOnsForProduct. */
export function addonsKey(baseProductId: string): string[] {
  return ["addons", baseProductId];
}

/** Cache key for getHostingProductsForUpsell. */
export function hostingUpsellKey(): string[] {
  return ["hosting-upsell"];
}
