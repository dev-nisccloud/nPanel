export type TaxEvidence = {
	billingCountry?: string | null;
	paymentCountry?: string | null;
	ipCountry?: string | null;
};

export type TaxPolicy = {
	id: "STANDARD_VAT" | "EXPORT_ZERO_RATED";
	rate: number;
	evidenceMismatch: boolean;
};

function country(value: string | null | undefined): string | null {
	const normalized = value?.trim().toUpperCase();
	return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function configuredStandardRate(): number {
	const raw = Number(process.env.STOREFRONT_DEFAULT_VAT_RATE ?? "16");
	if (!Number.isFinite(raw) || raw < 0 || raw > 100) return 0.16;
	return raw / 100;
}

/**
 * IP is evidence only and never determines tax. Foreign zero-rating remains
 * disabled unless explicitly approved and enabled; the safe default is 16%.
 */
export function resolveTaxPolicy(evidence: TaxEvidence): TaxPolicy {
	const billingCountry = country(evidence.billingCountry);
	const paymentCountry = country(evidence.paymentCountry);
	const ipCountry = country(evidence.ipCountry);
	const known = [billingCountry, paymentCountry, ipCountry].filter(
		(value): value is string => Boolean(value),
	);
	const evidenceMismatch = new Set(known).size > 1;
	const zeroRatingEnabled =
		process.env.FOREIGN_SERVICE_ZERO_RATING_ENABLED === "true";
	const verifiedForeign =
		billingCountry != null &&
		billingCountry !== "KE" &&
		paymentCountry != null &&
		paymentCountry !== "KE";

	if (zeroRatingEnabled && verifiedForeign) {
		return { id: "EXPORT_ZERO_RATED", rate: 0, evidenceMismatch };
	}
	return {
		id: "STANDARD_VAT",
		rate: configuredStandardRate(),
		evidenceMismatch,
	};
}

export function computeTaxTotals(
	subtotal: number,
	rate: number,
	currency: string,
): { subtotal: number; taxAmount: number; total: number } {
	if (!Number.isFinite(subtotal) || subtotal < 0) {
		throw new Error("Invalid taxable subtotal");
	}
	const taxRaw = subtotal * rate;
	const taxAmount =
		currency.toUpperCase() === "KES"
			? Math.ceil(taxRaw)
			: Math.round(taxRaw * 100) / 100;
	return {
		subtotal,
		taxAmount,
		total: Math.round((subtotal + taxAmount) * 100) / 100,
	};
}
