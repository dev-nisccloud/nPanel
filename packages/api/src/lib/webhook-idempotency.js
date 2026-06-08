import { getRedisClient } from "./redis";
/**
 * Claim a webhook/event id exactly once. Returns true if this is the first
 * delivery; false if already processed. When Redis is down, returns true
 * (DB-level guards should still apply).
 */
export async function claimWebhookEvent(namespace, eventId, ttlSec = 86_400) {
    const redis = getRedisClient();
    if (!redis)
        return true;
    const key = `npanel:webhook:${namespace}:${eventId}`;
    try {
        const claimed = await redis.set(key, "1", { nx: true, ex: ttlSec });
        return claimed === "OK";
    }
    catch (error) {
        console.error("[webhook-idempotency] claim failed:", namespace, eventId, error);
        return true;
    }
}
