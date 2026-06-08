import { getAuthRedisClient } from "./redis";
const CACHE_PREFIX = "npanel:auth:user-enrich:";
const CACHE_TTL_SEC = 60;
function cacheKey(userId) {
    return `${CACHE_PREFIX}${userId}`;
}
export async function readCachedUserEnrichment(userId) {
    const redis = getAuthRedisClient();
    if (!redis)
        return null;
    try {
        const cached = await redis.get(cacheKey(userId));
        if (!cached || typeof cached.status !== "string" || typeof cached.role !== "string") {
            return null;
        }
        return cached;
    }
    catch (error) {
        console.error("[auth][user-enrich-cache] read failed:", error);
        return null;
    }
}
export async function writeCachedUserEnrichment(userId, row) {
    const redis = getAuthRedisClient();
    if (!redis)
        return;
    try {
        await redis.set(cacheKey(userId), {
            status: row.status,
            role: row.role,
            lastAccessedTeamId: row.lastAccessedTeamId,
            createdAt: row.createdAt.toISOString(),
            image: row.image,
        }, { ex: CACHE_TTL_SEC });
    }
    catch (error) {
        console.error("[auth][user-enrich-cache] write failed:", error);
    }
}
export async function invalidateUserEnrichmentCache(userId) {
    const redis = getAuthRedisClient();
    if (!redis)
        return;
    try {
        await redis.del(cacheKey(userId));
    }
    catch (error) {
        console.error("[auth][user-enrich-cache] invalidate failed:", error);
    }
}
