import type { StorefrontCurrency } from "@/components/providers/currency.tsx";

export function formatCurrency(
	amount: number,
	currency: StorefrontCurrency,
): string {
	return new Intl.NumberFormat(currency === "KES" ? "en-KE" : "en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: currency === "KES" ? 0 : 2,
		maximumFractionDigits: currency === "KES" ? 0 : 2,
	}).format(amount);
}

export function convertKesForDisplay(
	amountKes: number,
	currency: StorefrontCurrency,
	kesToDisplayRate: number,
): number {
	if (currency === "KES") return amountKes;
	return Math.round(amountKes * kesToDisplayRate * 100) / 100;
}

export function convertStorefrontAmount(
	amount: number,
	sourceCurrency: string,
	targetCurrency: StorefrontCurrency,
	kesToTargetRate: number,
): number {
	const source = sourceCurrency.trim().toUpperCase();
	if (source === targetCurrency) return amount;
	if (source === "KES") {
		return Math.round(amount * kesToTargetRate * 100) / 100;
	}
	if (source === "USD" && targetCurrency === "KES" && kesToTargetRate > 0) {
		return Math.round((amount / kesToTargetRate) * 100) / 100;
	}
	throw new Error(`Unsupported display conversion: ${source}/${targetCurrency}`);
}
