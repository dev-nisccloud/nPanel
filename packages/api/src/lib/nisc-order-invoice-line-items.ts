/**
 * Invoice line item titles and subscription periods for Nisc order auto-invoices.
 * Format: "(identifier) Service - Action" with subscription dates from billing cycle.
 * Domains use Transfer / Registration / Renewal; subscription services use Subscription (or Renewal).
 */
import type { NiscOrderItemForInvoice } from "../schemas/nisc-order-invoice";
import { formatInvoiceDate } from "./nisc-datetime-format";

export type InvoiceLineItemAction = "Transfer" | "Registration" | "Renewal" | "Upgrade" | "Subscription";

export type NiscOrderInvoiceLineItemCopy = {
	name: string;
	description: string;
};

function formatDateForInvoice(d: Date): string {
	return formatInvoiceDate(d);
}

export function addBillingCycleToDate(start: Date, billingCycle: string | null | undefined): Date | null {
	if (!billingCycle) return null;
	const end = new Date(start);
	const cycle = billingCycle.trim().toUpperCase();
	if (cycle === "MONTHLY") {
		end.setMonth(end.getMonth() + 1);
		return end;
	}
	if (cycle === "YEARLY") {
		end.setFullYear(end.getFullYear() + 1);
		return end;
	}
	if (cycle === "BIENNIALLY") {
		end.setFullYear(end.getFullYear() + 2);
		return end;
	}
	if (cycle === "TRIENNIALLY") {
		end.setFullYear(end.getFullYear() + 3);
		return end;
	}
	if (cycle === "QUADRENNIALLY") {
		end.setFullYear(end.getFullYear() + 4);
		return end;
	}
	return null;
}

function billingCycleLabel(billingCycle: string | null | undefined): string {
	switch ((billingCycle ?? "").trim().toUpperCase()) {
		case "MONTHLY":
			return "1 month";
		case "YEARLY":
			return "1 year";
		case "BIENNIALLY":
			return "2 years";
		case "TRIENNIALLY":
			return "3 years";
		case "QUADRENNIALLY":
			return "4 years";
		case "ONE_TIME":
			return "one-time";
		default:
			return "1 year";
	}
}

export function resolveInvoiceLineItemAction(
	description: string | null | undefined,
	serviceType?: string | null,
	options?: { subscriptionBased?: boolean },
): InvoiceLineItemAction {
	const desc = (description ?? "").trim().toLowerCase();
	if (desc === "transfer" || serviceType === "domain_transfer") return "Transfer";
	if (desc === "renewal") return "Renewal";
	if (desc === "upgrade") return "Upgrade";
	if (options?.subscriptionBased) return "Subscription";
	if (desc === "registration") return "Registration";
	return "Registration";
}

function normalizeServiceType(serviceType: string | null | undefined): string {
	return (serviceType ?? "").trim().toLowerCase();
}

export function isDomainOrderItem(
	item: Pick<NiscOrderItemForInvoice, "description" | "primaryDomain"> & {
		product?: { serviceType?: string | null };
	},
): boolean {
	const st = normalizeServiceType(item.product?.serviceType);
	if (
		st === "domain_transfer" ||
		st === "domain_registration" ||
		st === "domains" ||
		st.includes("domain")
	) {
		return true;
	}
	const desc = (item.description ?? "").trim().toLowerCase();
	if (item.primaryDomain?.trim() && (desc === "transfer" || desc === "registration" || desc === "renewal")) {
		return true;
	}
	return false;
}

export function isEmailMarketingOrderItem(item: {
	product?: { serviceType?: string | null; name?: string };
}): boolean {
	const st = normalizeServiceType(item.product?.serviceType);
	if (st === "email_marketing" || st === "nisc_email_marketing") {
		return true;
	}
	const name = (item.product?.name ?? "").toLowerCase();
	return name.includes("email marketing") || name.includes("nisc email marketing");
}

export function isHostingOrderItem(item: {
	product?: { serviceType?: string | null; name?: string };
}): boolean {
	if (isEmailMarketingOrderItem(item)) {
		return false;
	}
	const st = normalizeServiceType(item.product?.serviceType);
	if (
		st === "web_hosting" ||
		st === "email_hosting" ||
		st === "vps_hosting" ||
		st === "vds_hosting" ||
		st === "dedicated_server_hosting" ||
		st === "reseller_hosting"
	) {
		return true;
	}
	const name = (item.product?.name ?? "").toLowerCase();
	return (
		name.includes("hosting") ||
		name.includes("vps") ||
		name.includes("dedicated") ||
		name.includes("email hosting")
	);
}

export function resolveEmailMarketingServiceLabel(
	serviceType: string | null | undefined,
	productName: string,
): string {
	const st = normalizeServiceType(serviceType);
	if (st === "nisc_email_marketing") return "Nisc Email Marketing";
	const name = productName.trim();
	if (/nisc email marketing/i.test(name)) return "Nisc Email Marketing";
	if (/email marketing/i.test(name)) return "Email Marketing";
	return "Email Marketing";
}

export function resolveHostingServiceLabel(
	serviceType: string | null | undefined,
	productName: string,
): string {
	const st = normalizeServiceType(serviceType);
	if (st === "web_hosting") return "Website Hosting";
	if (st === "email_hosting") return "Email Hosting";
	if (st === "vps_hosting") return "VPS Hosting";
	if (st === "vds_hosting") return "VDS Hosting";
	if (st === "dedicated_server_hosting") return "Dedicated Hosting";
	if (st === "reseller_hosting") return "Reseller Hosting";

	const name = productName.trim();
	if (/\bvds\b/i.test(name)) return "VDS Hosting";
	if (/vps/i.test(name)) return "VPS Hosting";
	if (/email hosting/i.test(name)) return "Email Hosting";
	if (/dedicated/i.test(name)) return "Dedicated Hosting";
	if (/hosting/i.test(name)) return "Website Hosting";
	return productName.trim() || "Hosting";
}

function resolveIdentifier(item: NiscOrderItemForInvoice): string {
	if (item.primaryDomain?.trim()) return item.primaryDomain.trim();
	if (item.productPlan?.name?.trim()) return item.productPlan.name.trim();
	if (item.description?.trim()) return item.description.trim();
	return "";
}

export function formatInvoiceSubscriptionPeriod(
	subscriptionStart: Date,
	billingCycle: string | null | undefined,
	action: InvoiceLineItemAction = "Subscription",
): string {
	const startStr = formatDateForInvoice(subscriptionStart);
	const expiry = addBillingCycleToDate(subscriptionStart, billingCycle);
	const cycle = billingCycleLabel(billingCycle);
	if (expiry) {
		return `${action}: ${startStr} – ${formatDateForInvoice(expiry)} (${cycle})`;
	}
	return `${action}: ${startStr} – (${cycle})`;
}

function formatSubscriptionPeriod(
	subscriptionStart: Date,
	billingCycle: string | null | undefined,
	action: InvoiceLineItemAction = "Subscription",
): string {
	return formatInvoiceSubscriptionPeriod(subscriptionStart, billingCycle, action);
}

/** Renewal cron line copy: `{product name} - {subscription name}` plus renewal period dates. */
export function buildRenewalReminderInvoiceLineCopy(input: {
	productName: string;
	subscriptionName?: string | null;
	periodStart: Date;
	billingCycle: string | null | undefined;
}): NiscOrderInvoiceLineItemCopy {
	const product = input.productName.trim() || "Service";
	const subscriptionName = input.subscriptionName?.trim();
	return {
		name: subscriptionName ? `${product} - ${subscriptionName}` : product,
		description: formatInvoiceSubscriptionPeriod(
			input.periodStart,
			input.billingCycle,
			"Renewal",
		),
	};
}

/**
 * Builds invoice line `name` (main line) and `description` (subscription period) for one order item.
 */
export function buildNiscOrderInvoiceLineItemCopy(
	item: NiscOrderItemForInvoice & { product: { name: string; serviceType?: string | null } },
	subscriptionStart: Date,
): NiscOrderInvoiceLineItemCopy {
	const identifier = resolveIdentifier(item);
	const bracket = identifier ? `(${identifier})` : "";
	const isDomain = isDomainOrderItem(item);
	const action = resolveInvoiceLineItemAction(item.description, item.product.serviceType, {
		subscriptionBased: !isDomain,
	});
	const subscription = formatSubscriptionPeriod(subscriptionStart, item.billingCycle, action);

	if (isDomain) {
		const name = bracket ? `${bracket} Domain - ${action}` : `Domain - ${action}`;
		return { name, description: subscription };
	}

	if (isEmailMarketingOrderItem(item)) {
		const emailMarketingLabel = resolveEmailMarketingServiceLabel(
			item.product.serviceType,
			item.product.name,
		);
		const name = bracket
			? `${bracket} ${emailMarketingLabel} - ${action}`
			: `${emailMarketingLabel} - ${action}`;
		return { name, description: subscription };
	}

	if (isHostingOrderItem(item)) {
		const hostingLabel = resolveHostingServiceLabel(item.product.serviceType, item.product.name);
		const name = bracket
			? `${bracket} ${hostingLabel} - ${action}`
			: `${hostingLabel} - ${action}`;
		return { name, description: subscription };
	}

	const planSuffix = item.productPlan?.name?.trim() ? ` - ${item.productPlan.name.trim()}` : "";
	const actionSuffix = action === "Upgrade" || action === "Renewal" ? ` - ${action}` : "";
	const name = bracket
		? `${bracket} ${item.product.name}${planSuffix}${actionSuffix}`
		: `${item.product.name}${planSuffix}${actionSuffix}`;
	return { name, description: subscription };
}

/** KRA itemCd `{CC}{T}{PKG}{QTY}{seq7}` e.g. KE2BGNO0000003 — not shown on TIS PDFs. */
function looksLikeKraItemCode(value: string): boolean {
	return /^[A-Z]{2}[1-3][A-Z]{2}[A-Z]{2}\d{7}$/i.test(value.trim());
}

/** PDF / preview line text: title and subscription on separate lines for wrapping. */
export function formatInvoiceLineItemForPdf(name: string, description?: string | null): string {
	const desc = normalizeStoredInvoicePeriodDescription(description)?.trim();
	if (!desc || looksLikeKraItemCode(desc)) return name;
	return `${name}\n${desc}`;
}

/**
 * Display-time cleanup for stored invoice period copy:
 * 4-digit years, and "Renewal" when the invoice is a subscription renewal.
 */
export function normalizeStoredInvoicePeriodDescription(
	description: string | null | undefined,
	context?: { invoiceSource?: string | null; lineSource?: string | null },
): string | null {
	if (!description?.trim()) return description ?? null;
	let desc = description.replace(
		/\b(\d{2})-(\d{2})-(\d{2})\b/g,
		(_m, dd: string, mm: string, yy: string) => `${dd}-${mm}-20${yy}`,
	);
	const source = `${context?.invoiceSource ?? ""} ${context?.lineSource ?? ""}`.toLowerCase();
	const isRenewal =
		source.includes("renewal") || source.includes("subscription-renewal-reminder");
	if (isRenewal && /^Subscription:/i.test(desc)) {
		desc = `Renewal:${desc.slice(desc.indexOf(":") + 1)}`;
	}
	if (source.includes("upgrade") && /^Subscription:/i.test(desc)) {
		desc = `Upgrade:${desc.slice(desc.indexOf(":") + 1)}`;
	}
	return desc;
}
