import { getRedisClient } from "./redis";
import { hivelocityRequest } from "./hivelocity-client";
import {
	hivelocityFacilitiesResponseSchema,
	normalizeHivelocityInventory,
	type HivelocityFacility,
	type HivelocityInventoryResponse,
} from "../types/hivelocity";

const REDIS_PREFIX = "hivelocity";
const INVENTORY_TTL_SECONDS = 600; // 10 min — inventory changes infrequently
const FACILITIES_TTL_SECONDS = 1800; // 30 min
const MEMORY_TTL_MS = 60_000; // fast L1 for hot paths within a single process

export type HivelocityInventoryQuery = {
	location?: string;
	include_custom?: boolean;
	bonding_support?: string | null;
};

function inventoryCacheKey(query: HivelocityInventoryQuery): string {
	return JSON.stringify({
		location: query.location ?? "MAIN",
		include_custom: query.include_custom ?? false,
		bonding_support: query.bonding_support ?? null,
	});
}

function facilitiesCacheKey(vpsLocations?: string): string {
	return vpsLocations?.trim() || "default";
}

type MemoryEntry<T> = { atMs: number; value: T };

const memoryInventory = new Map<string, MemoryEntry<HivelocityInventoryResponse>>();
const memoryFacilities = new Map<string, MemoryEntry<HivelocityFacility[]>>();
const inflightInventory = new Map<string, Promise<HivelocityInventoryResponse>>();
const inflightFacilities = new Map<string, Promise<HivelocityFacility[]>>();

function readMemory<T>(map: Map<string, MemoryEntry<T>>, key: string): T | null {
	const entry = map.get(key);
	if (!entry) return null;
	if (Date.now() - entry.atMs >= MEMORY_TTL_MS) {
		map.delete(key);
		return null;
	}
	return entry.value;
}

function writeMemory<T>(map: Map<string, MemoryEntry<T>>, key: string, value: T) {
	map.set(key, { atMs: Date.now(), value });
}

async function readRedis<T>(key: string): Promise<T | null> {
	const redis = getRedisClient();
	if (!redis) return null;
	try {
		const raw = await redis.get(key);
		if (raw === null || raw === undefined) return null;
		return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
	} catch {
		return null;
	}
}

async function writeRedis(key: string, value: unknown, ttlSeconds: number): Promise<void> {
	const redis = getRedisClient();
	if (!redis) return;
	try {
		await redis.setex(key, ttlSeconds, JSON.stringify(value));
	} catch (e) {
		console.error("[hivelocity-inventory-cache] redis set error:", e);
	}
}

/**
 * Cached Hivelocity `/inventory/product` with L1 memory, Redis L2, and in-flight deduplication.
 */
export async function getCachedHivelocityInventory(
	query: HivelocityInventoryQuery = {},
): Promise<HivelocityInventoryResponse> {
	const key = inventoryCacheKey(query);
	const redisKey = `${REDIS_PREFIX}:inventory:${key}`;

	const fromMemory = readMemory(memoryInventory, key);
	if (fromMemory) return fromMemory;

	const fromRedis = await readRedis<HivelocityInventoryResponse>(redisKey);
	if (fromRedis) {
		writeMemory(memoryInventory, key, fromRedis);
		return fromRedis;
	}

	const pending = inflightInventory.get(key);
	if (pending) return pending;

	const fetchPromise = (async () => {
		const raw = await hivelocityRequest<unknown>("/inventory/product", {
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
	} finally {
		inflightInventory.delete(key);
	}
}

/**
 * Cached Hivelocity `/inventory/locations`.
 */
export async function getCachedHivelocityFacilities(vpsLocations?: string): Promise<HivelocityFacility[]> {
	const key = facilitiesCacheKey(vpsLocations);
	const redisKey = `${REDIS_PREFIX}:facilities:${key}`;

	const fromMemory = readMemory(memoryFacilities, key);
	if (fromMemory) return fromMemory;

	const fromRedis = await readRedis<HivelocityFacility[]>(redisKey);
	if (fromRedis) {
		writeMemory(memoryFacilities, key, fromRedis);
		return fromRedis;
	}

	const pending = inflightFacilities.get(key);
	if (pending) return pending;

	const fetchPromise = (async () => {
		const raw = await hivelocityRequest<unknown>("/inventory/locations", {
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
	} finally {
		inflightFacilities.delete(key);
	}
}
