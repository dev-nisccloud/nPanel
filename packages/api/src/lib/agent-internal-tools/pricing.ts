/**
 * Retail pricing helper for agent-internal tools.
 *
 * Mirrors exactly what the domain search UI does client-side in
 * `apps/web/src/hooks/use-domain-pricing.ts`:
 *   1. Apply the platform TLD margin (per-extension override or default) to the reseller/wholesale price.
 *   2. Convert the result to the user's target currency via cached exchange rates.
 *
 * Both the DB lookup and the exchange-rate HTTP fetch are memoised at the
 * process level with short TTLs so the agent can call this per-domain without
 * hammering external services.
 */

import { ceilConvertedPrice, convertPriceWithCeil } from "../convert-price";
import { getRedisClient } from "../redis";
import {
	applyMargin,
	loadMarginMap,
	resolveMarginForExtension,
	type MarginMap,
} from "../tld-margin";

// ---------------------------------------------------------------------------
// Margin config (platform default + per-TLD overrides)
// ---------------------------------------------------------------------------

/** In-process cache so we don't hit the DB on every domain entry. */
let _marginMapCache: { data: MarginMap; expiresAt: number } | null = null;
const MARGIN_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getMarginMapCached(): Promise<MarginMap> {
	if (_marginMapCache && _marginMapCache.expiresAt > Date.now()) {
		return _marginMapCache.data;
	}
	try {
		const map = await loadMarginMap();
		_marginMapCache = { data: map, expiresAt: Date.now() + MARGIN_TTL_MS };
		return map;
	} catch {
		return { default: null, overrides: {} };
	}
}

// ---------------------------------------------------------------------------
// Exchange rates (read from the same Upstash Redis cache written by
// currency-conversion.ts; fall back to a direct ExchangeRate-API fetch)
// ---------------------------------------------------------------------------

const RATES_KEY = "exchange_rates:USD";
const RATES_LAST_FETCH_KEY = "exchange_rates_last_fetch:USD";
const RATES_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours (matches currency-conversion.ts)
const RATES_TTL_SEC = 6 * 60 * 60;

async function getUsdRates(): Promise<Record<string, number> | null> {
	const redis = getRedisClient();

	// Try the shared Redis cache first.
	if (redis) {
		try {
			const [cached, lastFetch] = await Promise.all([
				redis.get(RATES_KEY),
				redis.get(RATES_LAST_FETCH_KEY),
			]);
			if (cached && lastFetch) {
				const age = Date.now() - parseInt(String(lastFetch));
				if (age < RATES_MAX_AGE_MS) {
					const r =
						typeof cached === "string"
							? (JSON.parse(cached) as Record<string, number>)
							: (cached as Record<string, number>);
					if (r && typeof r === "object") return r;
				}
			}
		} catch {
			/* ignore cache errors - fall through to fresh fetch */
		}
	}

	// Fresh fetch from ExchangeRate-API (same logic as currency-conversion.ts).
	try {
		const apiKey = process.env.EXCHANGERATE_API_KEY;
		const url = apiKey
			? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
			: "https://api.exchangerate-api.com/v4/latest/USD";
		const resp = await fetch(url);
		if (!resp.ok) return null;
		const data = (await resp.json()) as { rates?: Record<string, number> };
		if (!data.rates) return null;

		if (redis) {
			const json = JSON.stringify(data.rates);
			await Promise.all([
				redis.setex(RATES_KEY, RATES_TTL_SEC, json).catch(() => {}),
				redis
					.setex(RATES_LAST_FETCH_KEY, RATES_TTL_SEC, Date.now().toString())
					.catch(() => {}),
			]);
		}
		return data.rates;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Currency conversion - same cross-rate math as currency-conversion.ts
// ---------------------------------------------------------------------------

function computeRate(
	rates: Record<string, number>,
	from: string,
	to: string,
): number {
	if (from === to) return 1;
	if (from === "USD") return rates[to] ?? 1;
	if (to === "USD") return 1 / (rates[from] ?? 1);
	return (rates[to] ?? 1) / (rates[from] ?? 1);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RetailPrice {
	/** Final display amount, rounded up to a whole number (matches agency /domains). */
	amount: number;
	/** ISO 4217 code for the display currency. */
	currency: string;
	/** Human-readable formatted string, e.g. "KSh 1,450" or "$ 13". */
	formatted: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
	USD: "$",
	KES: "KSh",
	EUR: "€",
	GBP: "£",
	CAD: "C$",
	AUD: "A$",
	ZAR: "R",
	NGN: "₦",
};

/** Whole-number display - same policy as agency domains + buy-now dialog. */
function formatRetailPrice(amount: number, currency: string): string {
	const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
	const whole = ceilConvertedPrice(amount);
	const formatted = whole.toLocaleString("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
	return `${symbol} ${formatted}`;
}

function finalizeRetailAmount(amount: number): number {
	return ceilConvertedPrice(amount);
}

/**
 * Apply the TLD margin (per-extension override or platform default) to a reseller
 * price, then convert it to `targetCurrency`.
 * Pass `extensionOrDomain` (e.g. `com` or `example.co.ke`) to use overrides.
 */
export async function toRetailPrice(
	resellerAmount: number,
	resellerCurrency: string,
	targetCurrency: string,
	extensionOrDomain?: string,
): Promise<RetailPrice | null> {
	const [marginMap, rates] = await Promise.all([
		getMarginMapCached(),
		getUsdRates(),
	]);

	const margin = resolveMarginForExtension(marginMap, extensionOrDomain);
	const afterMargin = applyMargin(resellerAmount, margin);

	const finalCurrency = targetCurrency.toUpperCase();
	const fromCurrency = resellerCurrency.toUpperCase();

	if (fromCurrency === finalCurrency) {
		const amount = finalizeRetailAmount(afterMargin);
		return {
			amount,
			currency: finalCurrency,
			formatted: formatRetailPrice(amount, finalCurrency),
		};
	}

	if (!rates) {
		// Can't convert - return in original currency rather than nothing.
		const amount = finalizeRetailAmount(afterMargin);
		return {
			amount,
			currency: fromCurrency,
			formatted: formatRetailPrice(amount, fromCurrency),
		};
	}

	const rate = computeRate(rates, fromCurrency, finalCurrency);
	const amount = finalizeRetailAmount(
		convertPriceWithCeil(afterMargin, fromCurrency, finalCurrency, rate),
	);
	return {
		amount,
		currency: finalCurrency,
		formatted: formatRetailPrice(amount, finalCurrency),
	};
}

/** Fallback display currency when team has no baseCurrency set. */
export const DEFAULT_DISPLAY_CURRENCY = "KES";
