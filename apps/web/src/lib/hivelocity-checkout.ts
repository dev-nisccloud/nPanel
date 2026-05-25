/**
 * Shared Hivelocity checkout helpers (UI layer).
 * OS and add-ons bill under the main nisc product but appear as separate invoice lines.
 */

export type HivelocityProductType = "DEDICATED_SERVERS" | "VPS" | "VDS";

export type HivelocityPeriod =
	| "hourly"
	| "monthly"
	| "quarterly"
	| "semi-annually"
	| "annually"
	| "biennial"
	| "triennial";

export const HIVELOCITY_SERVICE_TYPE_BY_PRODUCT_TYPE: Record<HivelocityProductType, string> = {
	DEDICATED_SERVERS: "dedicated_server_hosting",
	VPS: "vps_hosting",
	VDS: "vds_hosting",
};

export const HIVELOCITY_PERIOD_OPTIONS: Array<{
	value: HivelocityPeriod;
	label: string;
	hint?: string;
}> = [
	{ value: "hourly", label: "Hourly", hint: "First month charged as deposit upfront" },
	{ value: "monthly", label: "Monthly" },
	{ value: "quarterly", label: "Quarterly" },
	{ value: "semi-annually", label: "Semi-annually" },
	{ value: "annually", label: "Annually" },
	{ value: "biennial", label: "Biennial (2 years)" },
	{ value: "triennial", label: "Triennial (3 years)" },
];

export type HivelocityInvoiceLineKind = "base" | "os" | "addon";

export type HivelocityInvoiceLine = {
	id: string;
	kind: HivelocityInvoiceLineKind;
	name: string;
	description?: string;
	amountExVat: number;
	/** Hivelocity option id (OS or add-on) when applicable */
	optionId?: number;
};

export type HivelocityInvoiceBreakdown = {
	lines: HivelocityInvoiceLine[];
	subtotalExVat: number;
	vatRate: number;
	vatAmount: number;
	totalIncVat: number;
};

export const HIVELOCITY_VAT_RATE = 0.16;

/** Multiplier applied to option/OS monthly USD rates for the selected billing term. */
const OPTION_PERIOD_MULTIPLIERS: Record<HivelocityPeriod, number> = {
	hourly: 1,
	monthly: 1,
	quarterly: 3,
	"semi-annually": 6,
	annually: 12,
	biennial: 24,
	triennial: 36,
};

export type HivelocityInventoryPriceFields = {
	product_hourly_price?: number;
	product_monthly_price?: number;
	product_quarterly_price?: number;
	product_semi_annually_price?: number;
	product_annually_price?: number;
	product_biennial_price?: number;
	product_triennial_price?: number;
};

/**
 * Raw USD list prices from Hivelocity inventory for each billing term.
 * Hourly checkout uses a first-month deposit (monthly list price), per Hivelocity billing rules.
 */
export function getInventoryUsdByPeriod(p: HivelocityInventoryPriceFields): Record<HivelocityPeriod, number> {
	const monthly = Number(p.product_monthly_price ?? 0);
	return {
		hourly: monthly,
		monthly,
		quarterly: Number(p.product_quarterly_price ?? monthly * 3),
		"semi-annually": Number(p.product_semi_annually_price ?? monthly * 6),
		annually: Number(p.product_annually_price ?? monthly * 12),
		biennial: Number(p.product_biennial_price ?? monthly * 24),
		triennial: Number(p.product_triennial_price ?? monthly * 36),
	};
}

export function getInventoryHourlyRateUsd(p: HivelocityInventoryPriceFields): number {
	return Number(p.product_hourly_price ?? 0);
}

/** Scale a monthly option/OS USD price to the selected billing term total. */
export function getOptionUsdForBillingPeriod(monthlyPriceUsd: number, period: HivelocityPeriod): number {
	if (!Number.isFinite(monthlyPriceUsd) || monthlyPriceUsd <= 0) return 0;
	return monthlyPriceUsd * (OPTION_PERIOD_MULTIPLIERS[period] ?? 1);
}

export function getPeriodPriceSuffix(period: HivelocityPeriod): string {
	switch (period) {
		case "hourly":
			return "/mo deposit";
		case "monthly":
			return "/mo";
		case "quarterly":
			return "/qtr";
		case "semi-annually":
			return "/6 mo";
		case "annually":
			return "/yr";
		case "biennial":
			return "/2 yr";
		case "triennial":
			return "/3 yr";
		default:
			return "";
	}
}

export const HIVELOCITY_NPANEL_DISALLOWED_PERIODS: HivelocityPeriod[] = ["hourly"];

/** Months until the next renewal for each billing term (from order date). */
const NEXT_BILLING_MONTHS: Record<HivelocityPeriod, number | null> = {
	hourly: null,
	monthly: 1,
	quarterly: 3,
	"semi-annually": 6,
	annually: 12,
	biennial: 24,
	triennial: 36,
};

export function getNextBillingDate(period: HivelocityPeriod, fromDate: Date = new Date()): Date | null {
	const months = NEXT_BILLING_MONTHS[period];
	if (months == null) return null;
	const next = new Date(fromDate);
	next.setMonth(next.getMonth() + months);
	return next;
}

export function formatNextBillingDate(period: HivelocityPeriod, fromDate: Date = new Date()): string | null {
	const next = getNextBillingDate(period, fromDate);
	if (!next) return null;
	return next.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function getHivelocityPeriodLabel(period: HivelocityPeriod): string {
	return HIVELOCITY_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;
}

export function mapHivelocityPeriodToBillingCycle(
	period: HivelocityPeriod,
): "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" {
	switch (period) {
		case "monthly":
			return "MONTHLY";
		case "annually":
			return "YEARLY";
		case "biennial":
			return "BIENNIALLY";
		default:
			return "CUSTOM";
	}
}

export function getAvailableHivelocityPeriods(
	disabledPeriods: string[] | undefined,
): typeof HIVELOCITY_PERIOD_OPTIONS {
	const disabled = new Set([
		...HIVELOCITY_NPANEL_DISALLOWED_PERIODS,
		...(disabledPeriods ?? []).map((p) => p.trim().toLowerCase()),
	]);
	return HIVELOCITY_PERIOD_OPTIONS.filter((o) => !disabled.has(o.value));
}

export function buildHivelocityInvoiceBreakdown(input: {
	/** Nisc product label from DB flow, e.g. "VDS Hosting". */
	serviceProductName: string;
	/** Hivelocity plan slug, e.g. "vds.md.intel". */
	planIdentifier: string;
	/** e.g. "Los Angeles 2 · Monthly" */
	locationLabel: string;
	baseAmountExVat: number;
	os?: { id: number | string; name: string; amountExVat: number } | null;
	addons?: Array<{ id: number | string; name: string; group?: string; amountExVat: number }>;
	vatRate?: number;
}): HivelocityInvoiceBreakdown {
	const vatRate = input.vatRate ?? HIVELOCITY_VAT_RATE;
	const baseLineName = `${input.serviceProductName.trim().toUpperCase()} (${input.planIdentifier.trim()})`;
	const lines: HivelocityInvoiceLine[] = [
		{
			id: "base",
			kind: "base",
			name: baseLineName,
			description: input.locationLabel,
			amountExVat: input.baseAmountExVat,
		},
	];

	if (input.os) {
		lines.push({
			id: `os-${input.os.id}`,
			kind: "os",
			name: `Operating system — ${input.os.name}`,
			description: "OS license / image",
			amountExVat: input.os.amountExVat,
			optionId: typeof input.os.id === "number" ? input.os.id : Number(input.os.id) || undefined,
		});
	}

	for (const addon of input.addons ?? []) {
		lines.push({
			id: `addon-${addon.id}`,
			kind: "addon",
			name: addon.name,
			description: addon.group ? `${addon.group} add-on` : "Add-on",
			amountExVat: addon.amountExVat,
			optionId: typeof addon.id === "number" ? addon.id : Number(addon.id) || undefined,
		});
	}

	const subtotalExVat = lines.reduce((sum, line) => sum + line.amountExVat, 0);
	const vatAmount = subtotalExVat * vatRate;
	const totalIncVat = subtotalExVat + vatAmount;

	return { lines, subtotalExVat, vatRate, vatAmount, totalIncVat };
}
