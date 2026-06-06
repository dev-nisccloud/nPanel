import type { ServicePlanDetails } from "@/components/buy-now-dialog";
import type { useHivelocityPricing } from "@/hooks/use-hivelocity-pricing";

export type VpsUpgradeOption = {
	productId: number;
	name: string;
	monthlyPrice: number;
	vcpu?: string;
	memory?: string;
	disk?: string;
};

/** Extract upstream base plan monthly USD from GET /inventory/product/{id} payloads. */
export function extractHivelocityProductMonthlyUsd(raw: unknown): number {
	if (raw == null) return 0;

	const read = (row: unknown): number => {
		if (!row || typeof row !== "object") return 0;
		const price = Number((row as { product_monthly_price?: unknown }).product_monthly_price);
		return Number.isFinite(price) && price > 0 ? price : 0;
	};

	if (Array.isArray(raw)) {
		for (const item of raw) {
			const price = read(item);
			if (price > 0) return price;
		}
		return 0;
	}

	const direct = read(raw);
	if (direct > 0) return direct;

	if (typeof raw === "object") {
		for (const value of Object.values(raw as Record<string, unknown>)) {
			if (!Array.isArray(value)) continue;
			for (const item of value) {
				const price = read(item);
				if (price > 0) return price;
			}
		}
	}

	return 0;
}

export type VpsUpgradePricing = {
	targetUsd: number;
	currentUsd: number;
	deltaUsd: number;
	displayDelta: number;
	displayTarget: number;
	deltaMarginUsd: number;
	targetMarginUsd: number;
};

/** Upgrade checkout charges the monthly price increase, not the full target plan. */
export function computeVpsUpgradePricing(opts: {
	targetMonthlyUsd: number;
	currentMonthlyUsd: number;
	displayCurrency: "KES" | "USD";
	pricing: Pick<ReturnType<typeof useHivelocityPricing>, "applyMarginFor" | "toKes">;
}): VpsUpgradePricing {
	const targetUsd = Math.max(0, Number(opts.targetMonthlyUsd) || 0);
	const currentUsd = Math.max(0, Number(opts.currentMonthlyUsd) || 0);
	const deltaUsd = Math.max(0, targetUsd - currentUsd);

	// Plan tier delta uses the base/hosting margin bucket (not OS or add-ons).
	const marginedDelta = opts.pricing.applyMarginFor("base", deltaUsd);
	const marginedTarget = opts.pricing.applyMarginFor("base", targetUsd);

	const toDisplay = (amountUsd: number) =>
		opts.displayCurrency === "KES"
			? (opts.pricing.toKes(amountUsd) ?? amountUsd)
			: amountUsd;

	return {
		targetUsd,
		currentUsd,
		deltaUsd,
		displayDelta: toDisplay(marginedDelta.final),
		displayTarget: toDisplay(marginedTarget.final),
		deltaMarginUsd: marginedDelta.marginAmount,
		targetMarginUsd: marginedTarget.marginAmount,
	};
}

export function buildHivelocityVpsUpgradePlanForCheckout(opts: {
	upgrade: VpsUpgradeOption;
	deviceId: number;
	currentHostname: string;
	currentLocationName: string;
	currentOsName: string;
	currentMonthlyUsd: number;
	displayCurrency: "KES" | "USD";
	niscProductId?: string;
	pricing: Pick<ReturnType<typeof useHivelocityPricing>, "applyMarginFor" | "toKes">;
}): ServicePlanDetails {
	const computed = computeVpsUpgradePricing({
		targetMonthlyUsd: opts.upgrade.monthlyPrice,
		currentMonthlyUsd: opts.currentMonthlyUsd,
		displayCurrency: opts.displayCurrency,
		pricing: opts.pricing,
	});

	return {
		planId: String(opts.upgrade.productId),
		planName: opts.upgrade.name,
		planType: "VPS Hosting Upgrade",
		price: computed.displayDelta,
		currency: opts.displayCurrency,
		billingCycle: "MONTHLY",
		productId: opts.niscProductId,
		hivelocity: {
			productType: "VPS",
			hivelocityProductId: opts.upgrade.productId,
			locationName: opts.currentLocationName,
			locationDisplayName: opts.currentLocationName,
			baseMonthlyUsd: computed.deltaUsd,
			baseHourlyUsd: 0,
			pricesByPeriod: { monthly: computed.displayDelta },
			baseUsdByPeriod: { monthly: computed.deltaUsd },
			stock: "available",
			upgrade: {
				targetDeviceId: opts.deviceId,
				currentHostname: opts.currentHostname,
				currentLocationName: opts.currentLocationName,
				currentOsName: opts.currentOsName,
				currentMonthlyUsd: computed.currentUsd,
				targetMonthlyUsd: computed.targetUsd,
				upgradeDeltaUsd: computed.deltaUsd,
				targetPlanName: opts.upgrade.name,
				targetVcpu: opts.upgrade.vcpu,
				targetMemory: opts.upgrade.memory,
				targetDisk: opts.upgrade.disk,
				targetDisplayMonthlyPrice: computed.displayTarget,
			},
		},
	};
}
