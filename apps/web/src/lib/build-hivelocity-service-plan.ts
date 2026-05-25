import type { ServicePlanDetails } from "@/components/buy-now-dialog";
import type { HivelocityPeriod, HivelocityProductType } from "@/lib/hivelocity-checkout";
import { buildMarginedPlanPricesByPeriod } from "@/lib/hivelocity-plan-pricing";
import type { useHivelocityPricing } from "@/hooks/use-hivelocity-pricing";

type HivelocityInventoryPlan = {
	product_id: number;
	product_name: string;
	data_center: string;
	stock?: "available" | "limited" | "unavailable" | string;
	product_disabled_billing_periods?: string[];
	product_monthly_price?: number;
	product_hourly_price?: number;
	__baseUsd?: { monthly: number; hourly: number };
};

export function buildHivelocityServicePlanDetails(
	p: HivelocityInventoryPlan,
	opts: {
		productType: HivelocityProductType;
		planTypeLabel: string;
		displayCurrency: "KES" | "USD";
		niscProductId?: string;
		locationDisplayName?: string;
		pricesByPeriod: Partial<Record<HivelocityPeriod, number>>;
		baseUsdByPeriod: Partial<Record<HivelocityPeriod, number>>;
		hourlyRateUsd?: number;
		hourlyRateDisplay?: number;
	},
): ServicePlanDetails {
	const base = p.__baseUsd ?? {
		monthly: p.product_monthly_price ?? 0,
		hourly: p.product_hourly_price ?? 0,
	};
	const defaultPeriodPrice = opts.pricesByPeriod.monthly ?? Number(p.product_monthly_price ?? 0);

	return {
		planId: String(p.product_id),
		planName: p.product_name,
		planType: opts.planTypeLabel,
		price: defaultPeriodPrice,
		currency: opts.displayCurrency,
		billingCycle: "MONTHLY",
		productId: opts.niscProductId,
		hivelocity: {
			productType: opts.productType,
			hivelocityProductId: Number(p.product_id),
			locationName: p.data_center,
			locationDisplayName: opts.locationDisplayName ?? p.data_center,
			baseMonthlyUsd: Number(base.monthly ?? 0),
			baseHourlyUsd: Number(base.hourly ?? 0),
			pricesByPeriod: opts.pricesByPeriod,
			baseUsdByPeriod: opts.baseUsdByPeriod,
			hourlyRateUsd: opts.hourlyRateUsd ?? Number(base.hourly ?? 0),
			hourlyRateDisplay: opts.hourlyRateDisplay,
			disabledBillingPeriods: p.product_disabled_billing_periods ?? [],
			stock: (p.stock as "available" | "limited" | "unavailable") ?? "available",
		},
	};
}

export function buildHivelocityPlanForCheckout(
	p: HivelocityInventoryPlan,
	opts: {
		productType: HivelocityProductType;
		planTypeLabel: string;
		displayCurrency: "KES" | "USD";
		niscProductId?: string;
		locationDisplayName?: string;
		pricing: Pick<ReturnType<typeof useHivelocityPricing>, "applyMarginFor" | "toKes">;
	},
): ServicePlanDetails {
	const { pricesByPeriod, baseUsdByPeriod, hourlyRateUsd, hourlyRateDisplay } =
		buildMarginedPlanPricesByPeriod(p, opts.pricing, opts.displayCurrency);

	return buildHivelocityServicePlanDetails(p, {
		productType: opts.productType,
		planTypeLabel: opts.planTypeLabel,
		displayCurrency: opts.displayCurrency,
		niscProductId: opts.niscProductId,
		locationDisplayName: opts.locationDisplayName,
		pricesByPeriod,
		baseUsdByPeriod,
		hourlyRateUsd,
		hourlyRateDisplay,
	});
}
