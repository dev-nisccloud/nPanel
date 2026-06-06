/**
 * Shared Hivelocity display pricing: normalize upstream billing, apply agency margins,
 * and convert to KES. Used for customer-facing recurring charges and agency parity.
 */
import { and, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { hivelocityPricingSettings } from "@npanel/db/schema/hivelocity-pricing-settings";
import { ceilConvertedPrice } from "./convert-price";
import { hivelocityRequest } from "./hivelocity-client";
import { getRedisClient } from "./redis";

export type HivelocityMarginRow = {
	marginType: string | null;
	percentageMargin: string | null;
	fixedMargin: string | null;
	roundOff: string | null;
};

export type HivelocityProductTypeKey = "VPS" | "VDS" | "DEDICATED_SERVERS";

const EXCLUDED_SERVICE_STATUSES = new Set(["CANCELLED", "CANCELED", "TERMINATED"]);

function readNumericField(row: Record<string, unknown>, keys: string[]): number {
	for (const key of keys) {
		const raw = row[key];
		if (raw == null || raw === "") continue;
		const n = typeof raw === "string" ? Number.parseFloat(raw) : Number(raw);
		if (Number.isFinite(n) && n > 0) return n;
	}
	return 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

/** Flatten Hivelocity `/device/{id}/services` payloads (array, grouped object, or wrapped). */
export function normalizeHivelocityDeviceServices(raw: unknown): Array<Record<string, unknown>> {
	if (!raw) return [];

	if (Array.isArray(raw)) {
		return raw.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>>;
	}

	const root = asRecord(raw);
	if (!root) return [];

	if (Array.isArray(root.services)) {
		return root.services.filter((item) => item && typeof item === "object") as Array<
			Record<string, unknown>
		>;
	}
	if (Array.isArray(root.data)) {
		return root.data.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>>;
	}

	const flattened: Array<Record<string, unknown>> = [];
	for (const value of Object.values(root)) {
		if (Array.isArray(value)) {
			for (const item of value) {
				const row = asRecord(item);
				if (row) flattened.push(row);
			}
			continue;
		}
		const row = asRecord(value);
		if (row) flattened.push(row);
	}
	return flattened;
}

export function readHivelocityServiceBilledUsd(service: Record<string, unknown>): number {
	return readNumericField(service, [
		"billedPrice",
		"billed_price",
		"price",
		"monthlyPrice",
		"monthly_price",
	]);
}

export function readHivelocityDeviceBillingUsd(device: Record<string, unknown>): {
	priceUsd: number;
	period: string | null;
} {
	const billing = asRecord(device.billingInfo ?? device.billing_info);
	const priceUsd = readNumericField(device, ["nextBillingValue", "next_billing_value"]);
	const billingPrice = billing ? readNumericField(billing, ["price"]) : 0;

	return {
		priceUsd: billingPrice > 0 ? billingPrice : priceUsd,
		period: billing?.period != null ? String(billing.period) : null,
	};
}

export function applyHivelocityMarginUsd(
	row: HivelocityMarginRow | null,
	priceUsd: number,
): number {
	if (!row || !Number.isFinite(priceUsd)) return priceUsd;

	let marginAmount = 0;
	let final = priceUsd;

	if (row.marginType === "PERCENTAGE" && row.percentageMargin) {
		const p = Number.parseFloat(row.percentageMargin);
		if (Number.isFinite(p)) {
			marginAmount = (priceUsd * p) / 100;
			final = priceUsd + marginAmount;
		}
	} else if (row.marginType === "FIXED" && row.fixedMargin) {
		const f = Number.parseFloat(row.fixedMargin);
		if (Number.isFinite(f)) {
			marginAmount = f;
			final = priceUsd + marginAmount;
		}
	}

	if (row.roundOff) {
		const ro = Number.parseFloat(row.roundOff);
		if (Number.isFinite(ro) && ro > 0) {
			final = Math.ceil(final / ro) * ro;
		}
	}

	return final;
}

export async function getDefaultHivelocityMarginSettings(
	productType: HivelocityProductTypeKey = "VPS",
): Promise<HivelocityMarginRow | null> {
	const [row] = await db
		.select({
			marginType: hivelocityPricingSettings.marginType,
			percentageMargin: hivelocityPricingSettings.percentageMargin,
			fixedMargin: hivelocityPricingSettings.fixedMargin,
			roundOff: hivelocityPricingSettings.roundOff,
		})
		.from(hivelocityPricingSettings)
		.where(
			and(
				eq(hivelocityPricingSettings.productType, productType),
				eq(hivelocityPricingSettings.isDefault, true),
			),
		)
		.orderBy(desc(hivelocityPricingSettings.updatedAt))
		.limit(1);

	return row ?? null;
}

async function fetchExchangeRatesFromApi(baseCurrency: string): Promise<Record<string, number> | null> {
	try {
		const apiKey = process.env.EXCHANGERATE_API_KEY;
		const baseUrl = apiKey
			? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
			: `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
		const response = await fetch(baseUrl, {
			method: "GET",
			headers: { Accept: "application/json" },
		});
		if (!response.ok) return null;
		const data = (await response.json()) as { rates?: Record<string, number> };
		return data.rates && typeof data.rates === "object" ? data.rates : null;
	} catch {
		return null;
	}
}

/** USD → KES from Redis cache, with live API fallback when cache is empty. */
export async function resolveUsdToKesExchangeRate(): Promise<number | null> {
	const redis = getRedisClient();
	const cacheKey = "exchange_rates:USD";

	if (redis) {
		try {
			const cached = await redis.get(cacheKey);
			let rates: Record<string, number> | null = null;
			if (typeof cached === "string") {
				rates = JSON.parse(cached) as Record<string, number>;
			} else if (cached && typeof cached === "object") {
				rates = cached as Record<string, number>;
			}
			const kes = rates?.KES;
			if (typeof kes === "number" && Number.isFinite(kes) && kes > 0) return kes;
		} catch {
			// fall through to live fetch
		}
	}

	const freshRates = await fetchExchangeRatesFromApi("USD");
	const kes = freshRates?.KES;
	if (typeof kes !== "number" || !Number.isFinite(kes) || kes <= 0) return null;

	if (redis) {
		try {
			await redis.setex(cacheKey, 6 * 60 * 60, JSON.stringify(freshRates));
		} catch {
			// non-fatal
		}
	}

	return kes;
}

export function mapHivelocityPeriodToBillingCycle(period: string | null | undefined): string | null {
	const p = (period ?? "").toLowerCase();
	if (!p) return null;
	if (p === "monthly") return "MONTHLY";
	if (p === "annually" || p === "annual") return "YEARLY";
	if (p === "biennial" || p === "biennially") return "BIENNIALLY";
	if (p === "quarterly" || p === "semi-annually" || p === "hourly") return "CUSTOM";
	return "MONTHLY";
}

export function parsePositiveAgreedPrice(
	agreedPrice: string | number | null | undefined,
): number | null {
	if (agreedPrice == null) return null;
	const trimmed = String(agreedPrice).trim();
	if (!trimmed) return null;
	const parsed = Number.parseFloat(trimmed);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function fetchHivelocityDeviceRecurringLinesUsd(deviceId: number): Promise<{
	linesUsd: number[];
	period: string | null;
}> {
	const raw = await hivelocityRequest<unknown>(`/device/${deviceId}/services`, {
		query: { group_by: "flat" },
		requireApiKey: true,
	});

	const services = normalizeHivelocityDeviceServices(raw);
	const linesUsd: number[] = [];
	let period: string | null = null;

	for (const service of services) {
		const status = String(service.status ?? service.Status ?? "").toUpperCase();
		if (status && EXCLUDED_SERVICE_STATUSES.has(status)) continue;

		const billed = readHivelocityServiceBilledUsd(service);
		if (billed > 0) linesUsd.push(billed);

		if (!period && service.period != null) period = String(service.period);
		if (!period && service.Period != null) period = String(service.Period);
	}

	if (linesUsd.length === 0) {
		const device = await hivelocityRequest<Record<string, unknown>>(`/device/${deviceId}`, {
			requireApiKey: true,
		});
		const billing = readHivelocityDeviceBillingUsd(device);
		if (billing.priceUsd > 0) linesUsd.push(billing.priceUsd);
		if (!period && billing.period) period = billing.period;
	}

	return { linesUsd, period };
}

export function computeMarginedRecurringTotal(params: {
	linesUsd: number[];
	marginSettings: HivelocityMarginRow | null;
	kesRate: number | null;
	preferredCurrency?: string | null;
}): { amount: number; currency: string } {
	const { linesUsd, marginSettings, kesRate, preferredCurrency } = params;
	if (linesUsd.length === 0) {
		return { amount: 0, currency: preferredCurrency ?? "KES" };
	}

	const currency = kesRate != null ? "KES" : "USD";
	let amount = 0;
	for (const line of linesUsd) {
		const marginedUsd = applyHivelocityMarginUsd(marginSettings, line);
		amount += kesRate != null ? ceilConvertedPrice(marginedUsd * kesRate) : marginedUsd;
	}

	return { amount, currency };
}

export async function resolveMarginedVpsRecurringCharge(params: {
	deviceId: number;
	agreedPrice: string | null;
	agreedCurrency: string | null;
	billingCycle: string | null;
}): Promise<{ amount: number; currency: string; billingCycle: string | null }> {
	const agreed = parsePositiveAgreedPrice(params.agreedPrice);
	if (agreed != null) {
		return {
			amount: agreed,
			currency: params.agreedCurrency ?? "KES",
			billingCycle: params.billingCycle,
		};
	}

	const [marginSettings, kesRate, billing] = await Promise.all([
		getDefaultHivelocityMarginSettings("VPS"),
		resolveUsdToKesExchangeRate(),
		fetchHivelocityDeviceRecurringLinesUsd(params.deviceId),
	]);

	const { amount, currency } = computeMarginedRecurringTotal({
		linesUsd: billing.linesUsd,
		marginSettings,
		kesRate,
		preferredCurrency: params.agreedCurrency,
	});

	return {
		amount,
		currency,
		billingCycle:
			mapHivelocityPeriodToBillingCycle(billing.period) ?? params.billingCycle ?? "MONTHLY",
	};
}
