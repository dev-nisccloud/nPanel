/**
 * Hivelocity billing helpers: collapsed invoice lines (service + hostname only)
 * and subscription add-on purchase detail (not shown on customer invoices).
 */
import {
	hivelocityInvoiceLineSchema,
	type HivelocityInvoiceLine,
	type HivelocityItemMetadata,
} from "../routers/nisc-service-orders-schemas";
import {
	resolveHostingServiceLabel,
	addBillingCycleToDate,
	type NiscOrderInvoiceLineItemCopy,
} from "./nisc-order-invoice-line-items";
import { formatNiscDate } from "./nisc-datetime-format";

const HIVELOCITY_SERVICE_TYPES = new Set([
	"vps_hosting",
	"vds_hosting",
	"dedicated_server_hosting",
]);

export type HivelocityPurchasedAddon = {
	kind: "os" | "addon";
	name: string;
	optionId?: number;
	/** Hivelocity wholesale (USD) for the billing period when known. */
	providerPriceUsd: number | null;
	/** Customer price ex-VAT (KES) for this component. */
	resellerPriceKes: number;
};

export function parseHivelocityInvoiceLinesFromMetadata(
	metadata: unknown,
): HivelocityInvoiceLine[] | null {
	if (!metadata || typeof metadata !== "object") return null;
	const raw = (metadata as { invoiceLines?: unknown }).invoiceLines;
	if (!Array.isArray(raw) || raw.length === 0) return null;
	const lines = raw
		.map((line) => hivelocityInvoiceLineSchema.safeParse(line))
		.filter((r): r is { success: true; data: HivelocityInvoiceLine } => r.success)
		.map((r) => r.data);
	return lines.length > 0 ? lines : null;
}

export function isHivelocityOrderItem(item: {
	metadata?: unknown;
	product?: { serviceType?: string | null };
}): boolean {
	const st = (item.product?.serviceType ?? "").trim().toLowerCase();
	if (HIVELOCITY_SERVICE_TYPES.has(st)) return true;
	return parseHivelocityInvoiceLinesFromMetadata(item.metadata) != null;
}

function billingCycleLabel(billingCycle: string | null | undefined): string {
	switch (billingCycle) {
		case "MONTHLY":
			return "1 month";
		case "YEARLY":
			return "1 year";
		case "BIENNIALLY":
			return "2 years";
		default:
			return "1 year";
	}
}

function formatSubscriptionPeriod(
	subscriptionStart: Date,
	billingCycle: string | null | undefined,
): string {
	const startStr = formatNiscDate(subscriptionStart);
	const expiry = addBillingCycleToDate(subscriptionStart, billingCycle);
	const cycle = billingCycleLabel(billingCycle);
	if (expiry) {
		return `Subscription: ${startStr} – ${formatNiscDate(expiry)} (${cycle})`;
	}
	return `Subscription: ${startStr} – (${cycle})`;
}

function readHostname(metadata: unknown): string {
	if (!metadata || typeof metadata !== "object") return "";
	const hostname = (metadata as { hivelocityHostname?: unknown }).hivelocityHostname;
	return typeof hostname === "string" ? hostname.trim() : "";
}

/**
 * One invoice line per Hivelocity order item: "{Service} - {hostname}" + billing period.
 * Add-ons and OS are not mentioned on the invoice line; total is itemSubtotal.
 */
export function buildHivelocityCollapsedInvoiceLineCopy(input: {
	product: { name: string; serviceType?: string | null };
	metadata?: unknown;
	billingCycle: string | null | undefined;
	subscriptionStart: Date;
}): NiscOrderInvoiceLineItemCopy {
	const serviceLabel = resolveHostingServiceLabel(
		input.product.serviceType,
		input.product.name,
	);
	const hostname = readHostname(input.metadata);
	const name = hostname ? `${serviceLabel} - ${hostname}` : serviceLabel;
	return {
		name,
		description: formatSubscriptionPeriod(input.subscriptionStart, input.billingCycle),
	};
}

export function buildHivelocitySubscriptionDisplayName(input: {
	product: { name: string; serviceType?: string | null };
	metadata?: unknown;
}): string {
	const { name } = buildHivelocityCollapsedInvoiceLineCopy({
		...input,
		billingCycle: null,
		subscriptionStart: new Date(),
	});
	return name;
}

/** OS and add-on components purchased with the server (stored on subscription, not on invoice). */
export function buildHivelocityPurchasedAddons(
	meta: Pick<HivelocityItemMetadata, "osPriceUsd" | "addonsPriceUsd">,
	lines: HivelocityInvoiceLine[],
): HivelocityPurchasedAddon[] {
	const extras = lines.filter((line) => line.kind === "os" || line.kind === "addon");
	const addonLines = extras.filter((line) => line.kind === "addon");
	const addonResellerTotal = addonLines.reduce((sum, line) => sum + line.amountExVat, 0);

	return extras.map((line) => {
		let providerPriceUsd: number | null = null;
		if (line.kind === "os" && meta.osPriceUsd != null) {
			providerPriceUsd = meta.osPriceUsd;
		} else if (line.kind === "addon" && meta.addonsPriceUsd != null) {
			if (addonLines.length === 1) {
				providerPriceUsd = meta.addonsPriceUsd;
			} else if (addonResellerTotal > 0) {
				const share = line.amountExVat / addonResellerTotal;
				providerPriceUsd = Math.round(meta.addonsPriceUsd * share * 100) / 100;
			}
		}

		return {
			kind: line.kind,
			name: line.name,
			...(line.optionId != null ? { optionId: line.optionId } : {}),
			providerPriceUsd,
			resellerPriceKes: line.amountExVat,
		};
	});
}

export function computeHivelocityTotalProviderCostUsd(
	meta: Pick<HivelocityItemMetadata, "basePriceUsd" | "osPriceUsd" | "addonsPriceUsd">,
): number | null {
	const total =
		(meta.basePriceUsd ?? 0) + (meta.osPriceUsd ?? 0) + (meta.addonsPriceUsd ?? 0);
	return total > 0 ? total : null;
}
