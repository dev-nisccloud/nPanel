import type { ServicePlanDetails } from "@/components/buy-now-dialog";

export function buildHivelocityVpsReactivatePlanForCheckout(opts: {
	deviceId: number;
	subscriptionId: string;
	serviceLabel: string;
	amount: number;
	currency: string;
	billingCycle: string | null;
	productId: string;
}): ServicePlanDetails {
	const billingCycle =
		opts.billingCycle === "YEARLY" ||
		opts.billingCycle === "BIENNIALLY" ||
		opts.billingCycle === "CUSTOM"
			? opts.billingCycle
			: "MONTHLY";

	return {
		planId: `reactivate-${opts.subscriptionId}`,
		planName: opts.serviceLabel,
		planType: "VPS Reactivation",
		price: opts.amount,
		currency: opts.currency,
		billingCycle,
		productId: opts.productId,
		hivelocity: {
			productType: "VPS",
			hivelocityProductId: 1,
			locationName: "Reactivation",
			locationDisplayName: "Service reactivation",
			baseMonthlyUsd: 0,
			baseHourlyUsd: 0,
			pricesByPeriod: { monthly: opts.amount },
			baseUsdByPeriod: { monthly: 0 },
			stock: "available",
			reactivate: {
				targetDeviceId: opts.deviceId,
				subscriptionId: opts.subscriptionId,
				serviceLabel: opts.serviceLabel,
				reactivationAmount: opts.amount,
				reactivationCurrency: opts.currency,
			},
		},
	};
}
