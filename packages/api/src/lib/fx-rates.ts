import { getRedisClient } from "./redis";

const RATE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const REFRESH_AHEAD_MS = 15 * 60 * 1000;
const CACHE_TTL_SECONDS = 7 * 60 * 60;
const CACHE_KEY = "npanel:fx-rates:USD:v2";

type CachedRateSet = {
	base: "USD";
	rates: Record<string, number>;
	provider: "ExchangeRate-API";
	retrievedAt: number;
};

export type FxRateSnapshot = {
	sourceCurrency: string;
	targetCurrency: string;
	rate: number;
	provider: "ExchangeRate-API" | "IDENTITY";
	retrievedAt: number;
	expiresAt: number;
};

let refreshPromise: Promise<CachedRateSet> | null = null;

function normalizeCurrency(currency: string): string {
	const normalized = currency.trim().toUpperCase();
	if (!/^[A-Z]{3}$/.test(normalized)) {
		throw new Error(`Unsupported currency code: ${currency}`);
	}
	return normalized;
}

function parseCachedRateSet(raw: unknown): CachedRateSet | null {
	let value = raw;
	if (typeof value === "string") {
		try {
			value = JSON.parse(value);
		} catch {
			return null;
		}
	}
	if (!value || typeof value !== "object") return null;
	const candidate = value as Partial<CachedRateSet>;
	if (
		candidate.base !== "USD" ||
		candidate.provider !== "ExchangeRate-API" ||
		typeof candidate.retrievedAt !== "number" ||
		!candidate.rates ||
		typeof candidate.rates !== "object"
	) {
		return null;
	}
	return candidate as CachedRateSet;
}

async function fetchFreshRates(): Promise<CachedRateSet> {
	const apiKey = process.env.EXCHANGERATE_API_KEY?.trim();
	const url = apiKey
		? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
		: "https://api.exchangerate-api.com/v4/latest/USD";
	const response = await fetch(url, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(8_000),
	});
	if (!response.ok) {
		throw new Error(`FX provider returned HTTP ${response.status}`);
	}
	const raw = (await response.json()) as Record<string, unknown>;
	const ratesRaw = raw.conversion_rates ?? raw.rates;
	if (!ratesRaw || typeof ratesRaw !== "object") {
		throw new Error("FX provider response did not contain rates");
	}
	const rates: Record<string, number> = {};
	for (const [code, value] of Object.entries(ratesRaw)) {
		const rate = Number(value);
		if (Number.isFinite(rate) && rate > 0) rates[code.toUpperCase()] = rate;
	}
	if (!rates.KES || !rates.USD) {
		throw new Error("FX provider response is missing KES or USD");
	}
	const result: CachedRateSet = {
		base: "USD",
		rates,
		provider: "ExchangeRate-API",
		retrievedAt: Date.now(),
	};
	const redis = getRedisClient();
	if (redis) {
		await redis.set(CACHE_KEY, JSON.stringify(result), { ex: CACHE_TTL_SECONDS });
	}
	return result;
}

function refreshRates(): Promise<CachedRateSet> {
	if (!refreshPromise) {
		refreshPromise = fetchFreshRates().finally(() => {
			refreshPromise = null;
		});
	}
	return refreshPromise;
}

async function getRateSet(): Promise<CachedRateSet> {
	const redis = getRedisClient();
	if (redis) {
		const cached = parseCachedRateSet(await redis.get(CACHE_KEY));
		if (cached) {
			const age = Date.now() - cached.retrievedAt;
			if (age <= RATE_MAX_AGE_MS) {
				if (RATE_MAX_AGE_MS - age <= REFRESH_AHEAD_MS) {
					void refreshRates().catch((error) => {
						console.error("[fx-rates] asynchronous refresh failed", error);
					});
				}
				return cached;
			}
		}
	}
	return refreshRates();
}

export async function getAuthoritativeFxRate(
	sourceCurrency: string,
	targetCurrency: string,
): Promise<FxRateSnapshot> {
	const source = normalizeCurrency(sourceCurrency);
	const target = normalizeCurrency(targetCurrency);
	const now = Date.now();
	if (source === target) {
		return {
			sourceCurrency: source,
			targetCurrency: target,
			rate: 1,
			provider: "IDENTITY",
			retrievedAt: now,
			expiresAt: now + RATE_MAX_AGE_MS,
		};
	}

	const set = await getRateSet();
	const usdToSource = set.rates[source];
	const usdToTarget = set.rates[target];
	if (
		!Number.isFinite(usdToSource) ||
		usdToSource <= 0 ||
		!Number.isFinite(usdToTarget) ||
		usdToTarget <= 0
	) {
		throw new Error(`Authoritative FX rate unavailable for ${source}/${target}`);
	}
	const rate = usdToTarget / usdToSource;
	if (!Number.isFinite(rate) || rate <= 0) {
		throw new Error(`Invalid authoritative FX rate for ${source}/${target}`);
	}
	return {
		sourceCurrency: source,
		targetCurrency: target,
		rate,
		provider: set.provider,
		retrievedAt: set.retrievedAt,
		expiresAt: set.retrievedAt + RATE_MAX_AGE_MS,
	};
}

export function convertWithFxSnapshot(
	amount: number,
	snapshot: FxRateSnapshot,
): number {
	if (!Number.isFinite(amount) || amount < 0) {
		throw new Error("Invalid amount for FX conversion");
	}
	return Math.round(amount * snapshot.rate * 100) / 100;
}
