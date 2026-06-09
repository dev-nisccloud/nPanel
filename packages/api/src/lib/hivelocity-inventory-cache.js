import { getRedisClient } from "./redis";
import { hivelocityRequest } from "./hivelocity-client";
import { hivelocityFacilitiesResponseSchema, normalizeHivelocityInventory, } from "../types/hivelocity";
const REDIS_PREFIX = "hivelocity";
const INVENTORY_TTL_SECONDS = 600; // 10 min - inventory changes infrequently
const FACILITIES_TTL_SECONDS = 1800; // 30 min
const MEMORY_TTL_MS = 60_000; // fast L1 for hot paths within a single process
function inventoryCacheKey(query) {
    return JSON.stringify({
        location: query.location ?? "MAIN",
        include_custom: query.include_custom ?? false,
        bonding_support: query.bonding_support ?? null,
    });
}
function facilitiesCacheKey(vpsLocations) {
    return vpsLocations?.trim() || "default";
}
const memoryInventory = new Map();
const memoryFacilities = new Map();
const inflightInventory = new Map();
const inflightFacilities = new Map();
function readMemory(map, key) {
    const entry = map.get(key);
    if (!entry)
        return null;
    if (Date.now() - entry.atMs >= MEMORY_TTL_MS) {
        map.delete(key);
        return null;
    }
    return entry.value;
}
function writeMemory(map, key, value) {
    map.set(key, { atMs: Date.now(), value });
}
async function readRedis(key) {
    const redis = getRedisClient();
    if (!redis)
        return null;
    try {
        const raw = await redis.get(key);
        if (raw === null || raw === undefined)
            return null;
        return (typeof raw === "string" ? JSON.parse(raw) : raw);
    }
    catch {
        return null;
    }
}
async function writeRedis(key, value, ttlSeconds) {
    const redis = getRedisClient();
    if (!redis)
        return;
    try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
    }
    catch (e) {
        console.error("[hivelocity-inventory-cache] redis set error:", e);
    }
}
/**
 * Cached Hivelocity `/inventory/product` with L1 memory, Redis L2, and in-flight deduplication.
 */
export async function getCachedHivelocityInventory(query = {}) {
    const key = inventoryCacheKey(query);
    const redisKey = `${REDIS_PREFIX}:inventory:${key}`;
    const fromMemory = readMemory(memoryInventory, key);
    if (fromMemory)
        return fromMemory;
    const fromRedis = await readRedis(redisKey);
    if (fromRedis) {
        writeMemory(memoryInventory, key, fromRedis);
        return fromRedis;
    }
    const pending = inflightInventory.get(key);
    if (pending)
        return pending;
    const fetchPromise = (async () => {
        const raw = await hivelocityRequest("/inventory/product", {
            query: {
                location: query.location,
                include_custom: query.include_custom,
                bonding_support: query.bonding_support,
                group_by: "facility",
            },
            requireApiKey: true,
        });
        const inventory = normalizeHivelocityInventory(raw);
        writeMemory(memoryInventory, key, inventory);
        void writeRedis(redisKey, inventory, INVENTORY_TTL_SECONDS);
        return inventory;
    })();
    inflightInventory.set(key, fetchPromise);
    try {
        return await fetchPromise;
    }
    finally {
        inflightInventory.delete(key);
    }
}
/**
 * Cached Hivelocity `/inventory/locations`.
 */
export async function getCachedHivelocityFacilities(vpsLocations) {
    const key = facilitiesCacheKey(vpsLocations);
    const redisKey = `${REDIS_PREFIX}:facilities:${key}`;
    const fromMemory = readMemory(memoryFacilities, key);
    if (fromMemory)
        return fromMemory;
    const fromRedis = await readRedis(redisKey);
    if (fromRedis) {
        writeMemory(memoryFacilities, key, fromRedis);
        return fromRedis;
    }
    const pending = inflightFacilities.get(key);
    if (pending)
        return pending;
    const fetchPromise = (async () => {
        const raw = await hivelocityRequest("/inventory/locations", {
            query: { vpsLocations },
            requireApiKey: false,
        });
        const facilities = hivelocityFacilitiesResponseSchema.parse(raw);
        writeMemory(memoryFacilities, key, facilities);
        void writeRedis(redisKey, facilities, FACILITIES_TTL_SECONDS);
        return facilities;
    })();
    inflightFacilities.set(key, fetchPromise);
    try {
        return await fetchPromise;
    }
    finally {
        inflightFacilities.delete(key);
    }
}
