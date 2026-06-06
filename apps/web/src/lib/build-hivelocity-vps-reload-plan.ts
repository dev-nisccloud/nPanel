import type { ServicePlanDetails } from "@/components/buy-now-dialog";
import type { useHivelocityPricing } from "@/hooks/use-hivelocity-pricing";

export type VpsReloadOsOption = {
	id: number;
	name: string;
	monthlyPriceUsd: number;
};

export function buildHivelocityVpsReloadPlanForCheckout(opts: {
	deviceId: number;
	currentHostname: string;
	currentLocationName: string;
	currentOsName: string;
	targetOs: VpsReloadOsOption;
	hivelocityProductId: number;
	publicSshKeyIds?: number[];
	displayCurrency: "KES" | "USD";
	niscProductId?: string;
	pricing: Pick<ReturnType<typeof useHivelocityPricing>, "applyMarginFor" | "toKes">;
}): ServicePlanDetails {
	const osPriceUsd = Math.max(0, opts.targetOs.monthlyPriceUsd);
	const margined = opts.pricing.applyMarginFor("os", osPriceUsd);
	const toDisplay = (amountUsd: number) =>
		opts.displayCurrency === "KES"
			? (opts.pricing.toKes(amountUsd) ?? amountUsd)
			: amountUsd;
	const displayOsPrice = toDisplay(margined.final);

	return {
		planId: `reload-os-${opts.targetOs.id}`,
		planName: opts.targetOs.name,
		planType: "VPS OS Reload",
		price: displayOsPrice,
		currency: opts.displayCurrency,
		billingCycle: "MONTHLY",
		productId: opts.niscProductId,
		hivelocity: {
			productType: "VPS",
			hivelocityProductId: opts.hivelocityProductId,
			locationName: opts.currentLocationName,
			locationDisplayName: opts.currentLocationName,
			baseMonthlyUsd: 0,
			baseHourlyUsd: 0,
			pricesByPeriod: { monthly: displayOsPrice },
			baseUsdByPeriod: { monthly: 0 },
			stock: "available",
			reload: {
				targetDeviceId: opts.deviceId,
				currentHostname: opts.currentHostname,
				currentLocationName: opts.currentLocationName,
				currentOsName: opts.currentOsName,
				targetOsName: opts.targetOs.name,
				targetOsOptionId: opts.targetOs.id,
				osPriceUsd,
				hivelocityProductId: opts.hivelocityProductId,
				publicSshKeyIds: opts.publicSshKeyIds,
			},
		},
	};
}
