/**
 * Subscription renewal pricing with billing cycle conversion - Frontend version.
 * agreedPrice is tied to the current billing cycle. When renewing with a
 * different cycle, we normalize to yearly equivalent then recalculate.
 */

export type RenewalBillingCycle = "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY";

function billingCycleToMonths(cycle: string | null): number {
	switch (cycle?.toUpperCase()) {
		case "MONTHLY":
			return 1;
		case "YEARLY":
			return 12;
		case "BIENNIALLY":
			return 24;
		case "TRIENNIALLY":
			return 36;
		case "QUADRENNIALLY":
			return 48;
		default:
			return 12; // Default to yearly
	}
}

/**
 * Normalize any agreed price to its yearly equivalent.
 */
export function normalizeToYearlyPrice(
	agreedPrice: string | null,
	currentCycle: string | null,
): number {
	const price = Number.parseFloat(agreedPrice || "0");
	if (!Number.isFinite(price) || price <= 0) return 0;

	const months = billingCycleToMonths(currentCycle);
	const monthlyEquivalent = price / months;
	return monthlyEquivalent * 12;
}

/**
 * Calculate renewal price for a new billing cycle based on current agreed price.
 * Preserves the pricing ratio when changing cycles.
 */
export function calculateRenewalPrice(
	currentAgreedPrice: string | null,
	currentCycle: string | null,
	targetCycle: string | null,
): string {
	const yearlyEquivalent = normalizeToYearlyPrice(currentAgreedPrice, currentCycle);
	if (yearlyEquivalent <= 0) return "0";

	const targetMonths = billingCycleToMonths(targetCycle);
	const targetPrice = (yearlyEquivalent / 12) * targetMonths;

	return targetPrice.toFixed(2);
}

/**
 * Get available billing cycles for renewal based on service type.
 */
export function getAvailableRenewalCycles(
	serviceType: string | null,
	isDomain: boolean,
): RenewalBillingCycle[] {
	if (isDomain) {
		return ["YEARLY", "BIENNIALLY", "TRIENNIALLY"];
	}

	const type = serviceType?.toLowerCase() || "";
	const isHosting =
		type === "web_hosting" ||
		type === "email_hosting" ||
		type === "wordpress_hosting" ||
		type === "website_hosting";

	if (isHosting) {
		return ["MONTHLY", "YEARLY", "BIENNIALLY"];
	}

	return ["MONTHLY", "YEARLY", "BIENNIALLY"];
}

/**
 * Check if a subscription is renewable.
 */
export function isSubscriptionRenewable(subscription: {
	status: string;
	billingCycle: string | null;
}): boolean {
	const terminalStatuses = ["CANCELLED", "UPGRADED", "DOWNGRADED"];
	if (terminalStatuses.includes(subscription.status)) return false;

	if (subscription.billingCycle?.toUpperCase() === "ONE_TIME") return false;

	return ["EXPIRED", "SUSPENDED"].includes(subscription.status);
}

/**
 * Determine if service is a domain.
 */
export function isDomainService(
	serviceType: string | null,
	productName: string | null,
): boolean {
	const type = serviceType?.toLowerCase() || "";
	if (
		type === "domain_registration" ||
		type === "domain_transfer" ||
		type === "domains"
	) {
		return true;
	}

	const name = productName?.toLowerCase() || "";
	return name.includes("domain");
}

/**
 * Calculate next expiry date from today with new billing cycle.
 */
export function calculateNextExpiryFromToday(
	billingCycle: string | null,
): Date {
	const today = new Date();
	const months = billingCycleToMonths(billingCycle);

	const nextExpiry = new Date(today);
	nextExpiry.setMonth(nextExpiry.getMonth() + months);

	return nextExpiry;
}

/**
 * Format billing cycle for display.
 */
export function formatBillingCycleLabel(cycle: string | null): string {
	switch (cycle?.toUpperCase()) {
		case "MONTHLY":
			return "Monthly (1 month)";
		case "YEARLY":
			return "Yearly (12 months)";
		case "BIENNIALLY":
			return "Biennially (24 months)";
		case "TRIENNIALLY":
			return "Triennially (36 months)";
		case "QUADRENNIALLY":
			return "Quadrennially (48 months)";
		default:
			return cycle || "Unknown";
	}
}

/**
 * Format price with currency.
 */
export function formatRenewalPrice(price: string, currency: string): string {
	const amount = Number.parseFloat(price || "0");
	return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
