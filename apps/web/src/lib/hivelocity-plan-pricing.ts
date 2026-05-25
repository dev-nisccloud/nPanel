import {
	getInventoryHourlyRateUsd,
	getInventoryUsdByPeriod,
	HIVELOCITY_PERIOD_OPTIONS,
	type HivelocityPeriod,
} from "@/lib/hivelocity-checkout";
import type { PricingBucket } from "@/hooks/use-hivelocity-pricing";

type MarginApplier = (
	bucket: PricingBucket,
	priceUsd: number,
) => { original: number; final: number; marginAmount: number };

type PlanPricingInput = {
	applyMarginFor: MarginApplier;
	toKes: (amountUsd: number) => number | null;
};

export function buildMarginedPlanPricesByPeriod(
	p: Record<string, unknown>,
	pricing: PlanPricingInput,
	displayCurrency: "KES" | "USD",
): {
	pricesByPeriod: Partial<Record<HivelocityPeriod, number>>;
	baseUsdByPeriod: Partial<Record<HivelocityPeriod, number>>;
	hourlyRateUsd: number;
	hourlyRateDisplay: number;
} {
	const baseUsd = (p as { __baseUsd?: { monthly: number; hourly: number } }).__baseUsd;
	const inventoryForPeriods =
		baseUsd?.monthly != null
			? {
					...p,
					product_monthly_price: baseUsd.monthly,
					product_hourly_price: baseUsd.hourly ?? p.product_hourly_price,
				}
			: p;

	const rawByPeriod = getInventoryUsdByPeriod(
		inventoryForPeriods as Parameters<typeof getInventoryUsdByPeriod>[0],
	);
	const hourlyRateUsd = getInventoryHourlyRateUsd(
		inventoryForPeriods as Parameters<typeof getInventoryHourlyRateUsd>[0],
	);
	const hourlyMargined = pricing.applyMarginFor("base", hourlyRateUsd).final;
	const hourlyRateDisplay =
		displayCurrency === "KES" ? (pricing.toKes(hourlyMargined) ?? hourlyMargined) : hourlyMargined;

	const pricesByPeriod: Partial<Record<HivelocityPeriod, number>> = {};
	const baseUsdByPeriod: Partial<Record<HivelocityPeriod, number>> = {};

	for (const { value } of HIVELOCITY_PERIOD_OPTIONS) {
		const rawUsd = rawByPeriod[value];
		baseUsdByPeriod[value] = rawUsd;
		const margined = pricing.applyMarginFor("base", rawUsd).final;
		pricesByPeriod[value] =
			displayCurrency === "KES" ? (pricing.toKes(margined) ?? margined) : margined;
	}

	return { pricesByPeriod, baseUsdByPeriod, hourlyRateUsd, hourlyRateDisplay };
}
