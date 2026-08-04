/**
 * Retail pricing helper for agent-internal tools.
 *
 * Mirrors exactly what the domain search UI does client-side in
 * `apps/web/src/hooks/use-domain-pricing.ts`:
 *   1. Apply the platform TLD margin (per-extension override or default) to the reseller/wholesale price.
 *   2. Convert the result to the user's target currency via cached exchange rates.
 */

import { ceilConvertedPrice, convertPriceWithCeil } from "../convert-price";
import { getRedisClient } from "../redis";
import {
	applyMargin,
	loadMarginMap,
	resolveMarginForExtension,
} from "../tld-margin";

/** In-process cache so we don't hit the DB on every domain entry. */
let _marginMapCache = null;
const MARGIN_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getMarginMapCached() {
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

const RATES_KEY = "exchange_rates:USD";
const RATES_LAST_FETCH_KEY = "exchange_rates_last_fetch:USD";
const RATES_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const RATES_TTL_SEC = 6 * 60 * 60;

async function getUsdRates() {
	const redis = getRedisClient();

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
							? JSON.parse(cached)
							: cached;
					if (r && typeof r === "object") return r;
				}
			}
		} catch {
			/* ignore cache errors */
		}
	}

	try {
		const apiKey = process.env.EXCHANGERATE_API_KEY;
		const url = apiKey
			? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
			: "https://api.exchangerate-api.com/v4/latest/USD";
		const resp = await fetch(url);
		if (!resp.ok) return null;
		const data = await resp.json();
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

function computeRate(rates, from, to) {
	if (from === to) return 1;
	if (from === "USD") return rates[to] ?? 1;
	if (to === "USD") return 1 / (rates[from] ?? 1);
	return (rates[to] ?? 1) / (rates[from] ?? 1);
}

const CURRENCY_SYMBOLS = {
	USD: "$",
	KES: "KSh",
	EUR: "€",
	GBP: "£",
	CAD: "C$",
	AUD: "A$",
	ZAR: "R",
	NGN: "₦",
};

function formatRetailPrice(amount, currency) {
	const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
	const whole = ceilConvertedPrice(amount);
	const formatted = whole.toLocaleString("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
	return `${symbol} ${formatted}`;
}

function finalizeRetailAmount(amount) {
	return ceilConvertedPrice(amount);
}

/**
 * Apply the TLD margin (per-extension override or platform default) to a reseller
 * price, then convert it to `targetCurrency`.
 * Pass `extensionOrDomain` (e.g. `com` or `example.co.ke`) to use overrides.
 */
export async function toRetailPrice(
	resellerAmount,
	resellerCurrency,
	targetCurrency,
	extensionOrDomain,
) {
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

export const DEFAULT_DISPLAY_CURRENCY = "KES";
