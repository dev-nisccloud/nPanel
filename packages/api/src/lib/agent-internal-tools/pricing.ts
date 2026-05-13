/**
 * Retail pricing helper for agent-internal tools.
 *
 * Mirrors exactly what the domain search UI does client-side in
 * `apps/web/src/hooks/use-domain-pricing.ts`:
 *   1. Apply the platform-default TLD margin (from DB) to the reseller/wholesale price.
 *   2. Convert the result to the user's target currency via cached exchange rates.
 *
 * Both the DB lookup and the exchange-rate HTTP fetch are memoised at the
 * process level with short TTLs so the agent can call this per-domain without
 * hammering external services.
 */

import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { tldSettings } from "@npanel/db/schema/nameservers";
import { getRedisClient } from "../redis";

// ---------------------------------------------------------------------------
// Margin config (platform default TLD setting row, same used by UI)
// ---------------------------------------------------------------------------

interface MarginConfig {
	marginType: "PERCENTAGE" | "FIXED" | null;
	percentageMargin: string | null;
	fixedMargin: string | null;
	roundOff: string | null;
}

/** In-process cache so we don't hit the DB on every domain entry. */
let _marginCache: { data: MarginConfig; expiresAt: number } | null = null;
const MARGIN_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getDefaultMargin(): Promise<MarginConfig> {
	if (_marginCache && _marginCache.expiresAt > Date.now()) {
		return _marginCache.data;
	}
	try {
		const [row] = await db
			.select({
				marginType: tldSettings.marginType,
				percentageMargin: tldSettings.percentageMargin,
				fixedMargin: tldSettings.fixedMargin,
				roundOff: tldSettings.roundOff,
			})
			.from(tldSettings)
			.where(eq(tldSettings.isDefault, true))
			.limit(1);

		const config: MarginConfig = row
			? {
					marginType: row.marginType as "PERCENTAGE" | "FIXED" | null,
					percentageMargin: row.percentageMargin,
					fixedMargin: row.fixedMargin,
					roundOff: row.roundOff,
				}
			: {
					marginType: null,
					percentageMargin: null,
					fixedMargin: null,
					roundOff: null,
				};

		_marginCache = { data: config, expiresAt: Date.now() + MARGIN_TTL_MS };
		return config;
	} catch {
		// Fallback: no margin (pass-through)
		return { marginType: null, percentageMargin: null, fixedMargin: null, roundOff: null };
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
			/* ignore cache errors — fall through to fresh fetch */
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
// Margin application — mirrors use-domain-pricing.ts exactly
// ---------------------------------------------------------------------------

function applyMargin(price: number, margin: MarginConfig): number {
	let finalPrice = price;

	if (margin.marginType === "PERCENTAGE" && margin.percentageMargin) {
		const pct = parseFloat(margin.percentageMargin);
		if (!isNaN(pct)) finalPrice = price + (price * pct) / 100;
	} else if (margin.marginType === "FIXED" && margin.fixedMargin) {
		const fixed = parseFloat(margin.fixedMargin);
		if (!isNaN(fixed)) finalPrice = price + fixed;
	}

	if (margin.roundOff) {
		const step = parseFloat(margin.roundOff);
		if (!isNaN(step) && step > 0) {
			finalPrice = Math.ceil(finalPrice / step) * step;
		}
	}

	return finalPrice;
}

// ---------------------------------------------------------------------------
// Currency conversion — same cross-rate math as currency-conversion.ts
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
	/** Final display amount, rounded to 2 dp. */
	amount: number;
	/** ISO 4217 code for the display currency. */
	currency: string;
	/** Human-readable formatted string, e.g. "KES 1,450.00" or "$12.99". */
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

function formatRetailPrice(amount: number, currency: string): string {
	const symbol = CURRENCY_SYMBOLS[currency] ?? currency + " ";
	// Format with commas for readability
	const formatted = amount.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
	return `${symbol}${formatted}`;
}

/**
 * Apply the platform-default TLD margin to a reseller price, then convert
 * it to `targetCurrency`. Returns null only when conversion is impossible
 * (no rates available and currencies differ).
 */
export async function toRetailPrice(
	resellerAmount: number,
	resellerCurrency: string,
	targetCurrency: string,
): Promise<RetailPrice | null> {
	const [margin, rates] = await Promise.all([
		getDefaultMargin(),
		getUsdRates(),
	]);

	const afterMargin = applyMargin(resellerAmount, margin);

	const finalCurrency = targetCurrency.toUpperCase();
	const fromCurrency = resellerCurrency.toUpperCase();

	if (fromCurrency === finalCurrency) {
		const amount = Math.round(afterMargin * 100) / 100;
		return { amount, currency: finalCurrency, formatted: formatRetailPrice(amount, finalCurrency) };
	}

	if (!rates) {
		// Can't convert — return in original currency rather than nothing.
		const amount = Math.round(afterMargin * 100) / 100;
		return { amount, currency: fromCurrency, formatted: formatRetailPrice(amount, fromCurrency) };
	}

	const rate = computeRate(rates, fromCurrency, finalCurrency);
	const amount = Math.round(afterMargin * rate * 100) / 100;
	return { amount, currency: finalCurrency, formatted: formatRetailPrice(amount, finalCurrency) };
}

/** Fallback display currency when team has no baseCurrency set. */
export const DEFAULT_DISPLAY_CURRENCY = "KES";
