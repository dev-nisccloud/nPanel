import { z } from "zod";
import { computeCeilVatTotals } from "@npanel/api/lib/convert-price";

export const ZEEPO_TOKEN_OVERRIDE_KEY = "zeepoTokenGrantOverride";

/** One order provisions one subscription per line. Keep the request bounded. */
export const MAX_PRODUCT_LINES = 20;

export const SERVICE_PRODUCT_IDS = [
	"zeepo_ai_agent",
	"nisc_email_marketing",
	"web_hosting",
	"email_hosting",
	"wordpress_hosting",
	"seo_reports",
	"creatives_design",
	"media_buying",
	"one_time_service",
] as const;

export type ServiceProductId = (typeof SERVICE_PRODUCT_IDS)[number];

export const BILLING_CYCLES = [
	"MONTHLY",
	"YEARLY",
	"BIENNIALLY",
	"TRIENNIALLY",
	"QUADRENNIALLY",
	"CUSTOM",
	"ONE_TIME",
] as const;
export type BillingCycleValue = (typeof BILLING_CYCLES)[number];

export type ServiceProductDef = {
	id: ServiceProductId;
	label: string;
	needsPlan: boolean;
	needsDomain: boolean;
	needsProvisionUser: boolean;
	supportsZeepoTokens: boolean;
	defaultBillingCycle: BillingCycleValue;
};

export const SERVICE_PRODUCTS: ServiceProductDef[] = [
	{
		id: "zeepo_ai_agent",
		label: "Zeepo AI Agent",
		needsPlan: true,
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: true,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "nisc_email_marketing",
		label: "Nisc Email Marketing",
		needsPlan: true,
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "web_hosting",
		label: "Website Hosting",
		needsPlan: true,
		needsDomain: true,
		needsProvisionUser: true,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "email_hosting",
		label: "Email Hosting",
		needsPlan: true,
		needsDomain: true,
		needsProvisionUser: true,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "wordpress_hosting",
		label: "WordPress Hosting",
		needsPlan: true,
		needsDomain: true,
		needsProvisionUser: true,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "seo_reports",
		label: "SEO Reports",
		needsPlan: true,
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "creatives_design",
		label: "Creatives & Design",
		needsPlan: true,
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "media_buying",
		label: "Media Buying",
		needsPlan: true,
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "one_time_service",
		label: "One-time service",
		needsPlan: false,
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: false,
		defaultBillingCycle: "ONE_TIME",
	},
];

export function getServiceDef(id: ServiceProductId): ServiceProductDef {
	return SERVICE_PRODUCTS.find((p) => p.id === id) ?? SERVICE_PRODUCTS[0]!;
}

/** Normalize pasted domain/URL input for Plesk primary domain. */
export function normalizeDomainInput(value: string): string {
	let d = value.trim().toLowerCase();
	if (!d) return "";
	d = d.replace(/^https?:\/\//i, "");
	d = d.replace(/^\/\//, "");
	const slash = d.indexOf("/");
	if (slash !== -1) d = d.slice(0, slash);
	const q = d.indexOf("?");
	if (q !== -1) d = d.slice(0, q);
	const hash = d.indexOf("#");
	if (hash !== -1) d = d.slice(0, hash);
	if (/^\[[^\]]+\]:\d+$/.test(d)) {
		d = d.replace(/:\d+$/, "");
	} else if (!d.includes("]") && /:\d+$/.test(d)) {
		d = d.replace(/:\d+$/, "");
	}
	d = d.replace(/\.+$/, "");
	return d.trim();
}

export type DomainValidationResult =
	| { ok: true; normalized: string }
	| { ok: false; message: string };

/** Validate FQDN for Plesk webspace name identifier. */
export function validateDomainName(value: string): DomainValidationResult {
	const raw = value.trim();
	if (!raw) {
		return { ok: false, message: "Enter a domain name (e.g. example.com)" };
	}
	if (/\s/.test(raw)) {
		return { ok: false, message: "Domain cannot contain spaces" };
	}
	if (/^https?:\/\//i.test(raw) || raw.includes("/") || raw.includes("?") || raw.includes("#")) {
		return {
			ok: false,
			message: "Enter only the domain name, not a full URL (e.g. example.com)",
		};
	}
	if (raw.includes("@")) {
		return { ok: false, message: "Enter a domain name, not an email address" };
	}
	if (raw.includes("_")) {
		return { ok: false, message: "Domain labels cannot contain underscores" };
	}
	if (raw.includes("..")) {
		return { ok: false, message: "Domain cannot contain consecutive dots" };
	}

	const d = normalizeDomainInput(raw);
	if (!d) {
		return { ok: false, message: "Enter a domain name (e.g. example.com)" };
	}
	if (d.length > 253) {
		return { ok: false, message: "Domain name is too long (max 253 characters)" };
	}
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(d) || d.includes(":")) {
		return { ok: false, message: "Enter a domain name, not an IP address" };
	}
	if (d === "localhost" || d.endsWith(".localhost") || d.endsWith(".local")) {
		return { ok: false, message: "Localhost / .local names are not allowed" };
	}
	if (!d.includes(".")) {
		return {
			ok: false,
			message: "Enter a full domain with a TLD (e.g. example.com)",
		};
	}

	const labels = d.split(".");
	if (labels.length < 2) {
		return {
			ok: false,
			message: "Enter a full domain with a TLD (e.g. example.com)",
		};
	}

	const tld = labels[labels.length - 1]!;
	if (!/^[a-z]{2,63}$/.test(tld)) {
		return {
			ok: false,
			message: "TLD must be 2–63 letters (e.g. .com, .co.ke)",
		};
	}

	for (const label of labels) {
		if (!label) {
			return { ok: false, message: "Domain cannot have empty labels" };
		}
		if (label.length > 63) {
			return { ok: false, message: "Each domain label must be at most 63 characters" };
		}
		if (label.startsWith("-") || label.endsWith("-")) {
			return {
				ok: false,
				message: "Domain labels cannot start or end with a hyphen",
			};
		}
		if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label) && label.length > 1) {
			return {
				ok: false,
				message: "Domain can only contain letters, numbers, hyphens, and dots",
			};
		}
		if (label.length === 1 && !/^[a-z0-9]$/.test(label)) {
			return {
				ok: false,
				message: "Domain can only contain letters, numbers, hyphens, and dots",
			};
		}
	}

	if (!/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(d)) {
		return {
			ok: false,
			message: "Enter a valid domain name (e.g. example.com or shop.example.co.ke)",
		};
	}

	return { ok: true, normalized: d };
}

export function isValidDomainName(value: string): boolean {
	return validateDomainName(value).ok;
}

const lineSchema = z.object({
	serviceProduct: z.enum(SERVICE_PRODUCT_IDS),
	planId: z.string().optional(),
	serviceName: z.string().optional(),
	customPrice: z.string().optional(),
	linePrice: z.string().optional(),
	billingCycle: z.enum(BILLING_CYCLES).optional(),
	primaryDomain: z.string().optional(),
	portfolioDomainId: z.string().optional(),
	overrideTokens: z.boolean(),
	tokenGrant: z.string().optional(),
});

export const createFormSchema = z
	.object({
		teamId: z.string().min(1, "Select an organization"),
		customerUserId: z.string().min(1, "Select the customer"),
		lines: z
			.array(lineSchema)
			.min(1, "Add at least one product")
			.max(MAX_PRODUCT_LINES, `Add at most ${MAX_PRODUCT_LINES} products on one order`),
		amount: z.string().min(1, "Enter the payment amount"),
		createInvoice: z.boolean().default(false),
		transactionReference: z.string().optional().default(""),
		gateway: z.enum(["MPESA", "JENGA", "OTHER"]),
		useStkPush: z.boolean().default(false),
		mpesaPhoneNumber: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		const amount = Number.parseFloat(data.amount);
		if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
			ctx.addIssue({
				code: "custom",
				message: "Amount must be a whole number greater than 0",
				path: ["amount"],
			});
		}

		if (!data.useStkPush || data.gateway !== "MPESA") {
			const ref = (data.transactionReference ?? "").trim();
			if (ref.length < 3) {
				ctx.addIssue({
					code: "custom",
					message: "Transaction reference must be at least 3 characters",
					path: ["transactionReference"],
				});
			}
			if (ref.length > 120) {
				ctx.addIssue({
					code: "custom",
					message: "Transaction reference is too long",
					path: ["transactionReference"],
				});
			}
		}

		if (data.useStkPush && data.gateway === "MPESA") {
			const phone = (data.mpesaPhoneNumber ?? "").trim();
			if (!phone) {
				ctx.addIssue({
					code: "custom",
					message: "Enter customer's M-Pesa phone number",
					path: ["mpesaPhoneNumber"],
				});
			} else if (phone.replace(/\D/g, "").length < 10) {
				ctx.addIssue({
					code: "custom",
					message: "Phone number must be at least 10 digits",
					path: ["mpesaPhoneNumber"],
				});
			}
		}

		const seenDomains = new Map<string, number>();
		let zeepoCount = 0;
		data.lines.forEach((line, index) => {
			const def = getServiceDef(line.serviceProduct);
			if (line.serviceProduct === "zeepo_ai_agent") zeepoCount += 1;

			if (def.needsPlan && !line.planId?.trim()) {
				ctx.addIssue({ code: "custom", message: "Select a plan", path: ["lines", index, "planId"] });
			}

			if (def.needsPlan && line.planId?.trim()) {
				const price = Number.parseFloat(line.linePrice ?? "");
				if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(price)) {
					ctx.addIssue({
						code: "custom",
						message: "Enter a whole price greater than 0",
						path: ["lines", index, "linePrice"],
					});
				}
			}

			if (line.serviceProduct === "one_time_service") {
				if (!line.serviceName?.trim()) {
					ctx.addIssue({
						code: "custom",
						message: "Enter a service name",
						path: ["lines", index, "serviceName"],
					});
				}
				const price = Number.parseFloat(line.customPrice ?? "");
				if (!Number.isFinite(price) || price <= 0) {
					ctx.addIssue({
						code: "custom",
						message: "Enter a price greater than 0",
						path: ["lines", index, "customPrice"],
					});
				}
			}

			if (def.needsDomain) {
				const result = validateDomainName(line.primaryDomain ?? "");
				if (!result.ok) {
					ctx.addIssue({
						code: "custom",
						message: result.message,
						path: ["lines", index, "primaryDomain"],
					});
				} else {
					const previous = seenDomains.get(result.normalized);
					if (previous != null) {
						ctx.addIssue({
							code: "custom",
							message: "This domain is already used on another product line",
							path: ["lines", index, "primaryDomain"],
						});
					} else {
						seenDomains.set(result.normalized, index);
					}
				}
			}

			if (def.supportsZeepoTokens && line.overrideTokens) {
				const rawTokens = (line.tokenGrant ?? "").trim();
				if (!/^\d+$/.test(rawTokens)) {
					ctx.addIssue({
						code: "custom",
						message: "Enter a whole number of tokens (0 or more)",
						path: ["lines", index, "tokenGrant"],
					});
				}
			}
		});

		if (zeepoCount > 1) {
			data.lines.forEach((line, index) => {
				if (line.serviceProduct !== "zeepo_ai_agent") return;
				ctx.addIssue({
					code: "custom",
					message: "Zeepo AI Agent can only be added once. It stays one subscription per organization.",
					path: ["lines", index, "serviceProduct"],
				});
			});
		}
	});

export type CreateFormData = z.infer<typeof createFormSchema>;
export type LineValues = CreateFormData["lines"][number];

export function emptyLine(serviceProduct: ServiceProductId = "zeepo_ai_agent"): LineValues {
	return {
		serviceProduct,
		planId: "",
		serviceName: "",
		customPrice: "",
		linePrice: "",
		billingCycle: getServiceDef(serviceProduct).defaultBillingCycle,
		primaryDomain: "",
		portfolioDomainId: "",
		overrideTokens: false,
		tokenGrant: "",
	};
}

export function lineField<K extends keyof LineValues>(index: number, key: K): `lines.${number}.${K}` {
	return `lines.${index}.${key}` as `lines.${number}.${K}`;
}

export type CatalogPlanOption = {
	id: string;
	name: string;
	productId: string;
	productName: string;
	displayPrice: number;
	displayCurrency: string;
	billingCycle: string;
	zeepoPlanType?: string;
	tokenGrant?: number;
};

export function normalizeBillingCycle(raw: string | null | undefined): Exclude<BillingCycleValue, "ONE_TIME"> {
	const v = (raw ?? "MONTHLY").toUpperCase();
	if (
		v === "YEARLY" ||
		v === "BIENNIALLY" ||
		v === "TRIENNIALLY" ||
		v === "QUADRENNIALLY" ||
		v === "CUSTOM"
	) {
		return v;
	}
	return "MONTHLY";
}

export function mapPricingPlans(
	plans:
		| Array<{
				id: string;
				name: string;
				productId: string;
				productName: string;
				niscPrice: string | null;
				niscCurrency: string;
				billingCycle: string;
		  }>
		| undefined,
): CatalogPlanOption[] {
	return (plans ?? []).map((p) => ({
		id: p.id,
		name: p.name,
		productId: p.productId,
		productName: p.productName,
		displayPrice: Number.parseFloat(p.niscPrice ?? "0") || 0,
		displayCurrency: p.niscCurrency || "KES",
		billingCycle: p.billingCycle || "MONTHLY",
	}));
}

const CYCLE_MONTHS: Record<string, number> = {
	MONTHLY: 1,
	YEARLY: 12,
	BIENNIALLY: 24,
	TRIENNIALLY: 36,
	QUADRENNIALLY: 48,
	CUSTOM: 1,
	ONE_TIME: 1,
};

function scaleExVat(displayPrice: number, planCycle: string, selectedCycle: string): number {
	const planMonths = CYCLE_MONTHS[planCycle.toUpperCase()] ?? 1;
	const selectedMonths = CYCLE_MONTHS[selectedCycle.toUpperCase()] ?? 1;
	return (displayPrice / planMonths) * selectedMonths;
}

/** Catalog price for a plan at the selected cycle, before VAT. */
export function catalogSubscriptionPrice(plan: CatalogPlanOption, cycle: string): number {
	return Math.max(0, Math.ceil(scaleExVat(plan.displayPrice, plan.billingCycle, cycle)));
}

export type LineQuote = {
	ready: boolean;
	currency: string;
	exVat: number;
	incVat: number;
	catalogExVat: number;
	billingCycle: BillingCycleValue;
	description: string;
	plan: CatalogPlanOption | null;
};

function wholePrice(value: string | undefined): number {
	const parsed = Number.parseFloat(value ?? "");
	if (!Number.isFinite(parsed) || parsed <= 0) return 0;
	return Math.ceil(parsed);
}

export function quoteLine(line: LineValues, plans: CatalogPlanOption[]): LineQuote {
	const def = getServiceDef(line.serviceProduct);
	if (line.serviceProduct === "one_time_service") {
		const exVat = wholePrice(line.customPrice);
		const incVat = exVat > 0 ? computeCeilVatTotals(exVat).totalIncVat : 0;
		return {
			ready: Boolean(line.serviceName?.trim()) && exVat > 0,
			currency: "KES",
			exVat,
			incVat,
			catalogExVat: exVat,
			billingCycle: "ONE_TIME",
			description: line.serviceName?.trim() || def.label,
			plan: null,
		};
	}

	const plan = plans.find((p) => p.id === line.planId) ?? null;
	const billingCycle: BillingCycleValue =
		line.billingCycle && line.billingCycle !== "ONE_TIME"
			? line.billingCycle
			: plan?.zeepoPlanType === "top_up"
				? "CUSTOM"
				: plan
					? normalizeBillingCycle(plan.billingCycle)
					: def.defaultBillingCycle === "ONE_TIME"
						? "MONTHLY"
						: def.defaultBillingCycle;

	if (!plan) {
		return {
			ready: false,
			currency: "KES",
			exVat: 0,
			incVat: 0,
			catalogExVat: 0,
			billingCycle,
			description: def.label,
			plan: null,
		};
	}

	const catalogExVat = catalogSubscriptionPrice(plan, billingCycle);
	const typedPrice = wholePrice(line.linePrice);
	const exVat = typedPrice > 0 ? typedPrice : catalogExVat;
	const incVat = exVat > 0 ? computeCeilVatTotals(exVat).totalIncVat : 0;
	const domainOk = !def.needsDomain || isValidDomainName(line.primaryDomain ?? "");
	const tokensOk =
		!def.supportsZeepoTokens || !line.overrideTokens || /^\d+$/.test((line.tokenGrant ?? "").trim());
	return {
		ready: incVat > 0 && exVat > 0 && domainOk && tokensOk,
		currency: plan.displayCurrency || "KES",
		exVat,
		incVat,
		catalogExVat,
		billingCycle,
		description: plan.name,
		plan,
	};
}

export function orderTotalsFromQuotes(quotes: LineQuote[]) {
	const priced = quotes.filter((quote) => quote.incVat > 0);
	const exVat = priced.reduce((sum, quote) => sum + quote.exVat, 0);
	const totals = computeCeilVatTotals(exVat);
	const subscriptionSum = priced.reduce((sum, quote) => sum + quote.incVat, 0);
	return {
		...totals,
		subscriptionSum,
		hasPrice: priced.length > 0 && totals.totalIncVat > 0,
		allReady: quotes.length > 0 && quotes.every((quote) => quote.ready),
	};
}

export function formatMoney(amount: number, currency = "KES"): string {
	return `${currency} ${Math.ceil(amount).toLocaleString()}`;
}

export function lineSummaryLabel(line: LineValues | undefined, quote: LineQuote): string {
	if (!line) return "Product";
	const def = getServiceDef(line.serviceProduct);
	const domain = validateDomainName(line.primaryDomain ?? "");
	if (def.needsDomain && domain.ok) return `${def.label} · ${domain.normalized}`;
	if (quote.description && quote.description !== def.label) return `${def.label} · ${quote.description}`;
	return def.label;
}

export type PaymentLineItem = {
	productId: string;
	productPlanId?: string;
	billingCycle: BillingCycleValue;
	itemPrice: string;
	itemSubtotal: string;
	description: string;
	primaryDomain?: string;
	metadata: Record<string, unknown>;
};

export function resolveLineProductId(
	line: LineValues,
	quote: LineQuote,
	ids: { oneTimeProductId: string | null; zeepoProductId: string | null },
): string | null {
	if (line.serviceProduct === "one_time_service") return ids.oneTimeProductId;
	if (line.serviceProduct === "zeepo_ai_agent") return ids.zeepoProductId || quote.plan?.productId || null;
	return quote.plan?.productId ?? null;
}

export function buildPaymentItems(args: {
	data: CreateFormData;
	plansFor: (id: ServiceProductId) => CatalogPlanOption[];
	oneTimeProductId: string | null;
	zeepoProductId: string | null;
	billedForUserId: string;
}): { ok: true; items: PaymentLineItem[]; currency: string; orderTotal: number } | { ok: false; error: string } {
	const quotes = args.data.lines.map((line) => quoteLine(line, args.plansFor(line.serviceProduct)));
	const totals = orderTotalsFromQuotes(quotes);
	if (!totals.allReady) {
		return { ok: false, error: "Finish every product line before continuing." };
	}

	const currencies = new Set(quotes.map((quote) => quote.currency));
	if (currencies.size > 1) {
		return { ok: false, error: "All products on one order must use the same currency." };
	}

	const paid = Math.ceil(Number.parseFloat(args.data.amount));
	const partial = paid < totals.totalIncVat;
	const items: PaymentLineItem[] = [];

	for (let index = 0; index < args.data.lines.length; index++) {
		const line = args.data.lines[index]!;
		const quote = quotes[index]!;
		const def = getServiceDef(line.serviceProduct);
		const productId = resolveLineProductId(line, quote, {
			oneTimeProductId: args.oneTimeProductId,
			zeepoProductId: args.zeepoProductId,
		});
		if (!productId) {
			return { ok: false, error: `${def.label} is not available. Check that it is seeded and active.` };
		}

		let primaryDomain: string | undefined;
		if (def.needsDomain) {
			const domain = validateDomainName(line.primaryDomain ?? "");
			if (!domain.ok) return { ok: false, error: domain.message };
			primaryDomain = domain.normalized;
		}

		const metadata: Record<string, unknown> = {
			billingCycle: quote.billingCycle,
			actualPlanPrice: String(quote.incVat),
			actualPlanPriceExVat: String(quote.exVat),
			amountPaid: String(paid),
			isPartialPayment: partial,
		};
		if (line.serviceProduct === "one_time_service") {
			metadata.subscriptionName = quote.description;
		}
		if (def.supportsZeepoTokens && line.overrideTokens && line.tokenGrant?.trim()) {
			metadata[ZEEPO_TOKEN_OVERRIDE_KEY] = Number.parseInt(line.tokenGrant, 10);
		}
		if (def.needsProvisionUser) {
			metadata.provisionUserId = args.billedForUserId;
		}

		items.push({
			productId,
			productPlanId: def.needsPlan ? line.planId || undefined : undefined,
			billingCycle: quote.billingCycle,
			itemPrice: String(quote.exVat),
			itemSubtotal: String(quote.exVat),
			description: quote.description,
			...(primaryDomain ? { primaryDomain } : {}),
			metadata,
		});
	}

	return {
		ok: true,
		items,
		currency: quotes[0]?.currency || "KES",
		orderTotal: totals.totalIncVat,
	};
}

export function duplicateDomainMessage(lines: LineValues[], index: number): string | null {
	const line = lines[index];
	if (!line || !getServiceDef(line.serviceProduct).needsDomain) return null;
	const domain = validateDomainName(line.primaryDomain ?? "");
	if (!domain.ok) return null;
	const earlier = lines.findIndex((other, otherIndex) => {
		if (otherIndex >= index || !getServiceDef(other.serviceProduct).needsDomain) return false;
		const otherDomain = validateDomainName(other.primaryDomain ?? "");
		return otherDomain.ok && otherDomain.normalized === domain.normalized;
	});
	return earlier >= 0 ? "This domain is already used on another product line" : null;
}

export function getMpesaUserFriendlyError(resultCode: number, resultDesc?: string): string {
	const map: Record<number, string> = {
		0: "Payment completed successfully",
		1: "Insufficient balance in M-Pesa account",
		2: "Amount is below the minimum transaction limit",
		3: "Amount exceeds the maximum transaction limit",
		4: "Transaction would exceed daily transfer limit",
		8: "Transaction would exceed account balance limit",
		17: "Too many requests. Please wait a few minutes and try again",
		1019: "Payment request expired. Please initiate a new payment",
		1025: "Error sending payment request. Please try again",
		1032: "Payment request was cancelled",
		2001: "Incorrect M-Pesa PIN entered. Please try again with the correct PIN",
		2028: "Payment request not permitted. Please contact support",
		8006: "M-Pesa account is locked. Please contact M-Pesa customer care",
	};
	return map[resultCode] ?? resultDesc ?? `Payment failed with error code ${resultCode}`;
}
