/**
 * Authoritative storefront cart pricing — never trust URL or client-supplied amounts.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProductPlan } from "@npanel/db/schema/products";
import { hivelocityPricingSettings } from "@npanel/db/schema/hivelocity-pricing-settings";
import { agentCheckDomainAvailability } from "./agent-internal-tools/domains";
import {
	applyHivelocityMarginUsd,
	getDefaultHivelocityMarginSettings,
	resolveUsdToKesExchangeRate,
	type HivelocityMarginRow,
	type HivelocityProductTypeKey,
} from "./hivelocity-display-pricing";
import { ceilConvertedPrice } from "./convert-price";
import { hivelocityRequest } from "./hivelocity-client";
import { extractHivelocityProductMonthlyUsd } from "./hivelocity-product-pricing";

export const storefrontBillingCycleSchema = z.enum(["MONTHLY", "YEARLY"]);
export type StorefrontBillingCycle = z.infer<typeof storefrontBillingCycleSchema>;

const HIVELOCITY_SERVICE_TYPES = new Set(["vps", "vds", "dedicated_servers"]);

export const storefrontCartMainLineSchema = z.object({
	serviceType: z.string().min(1),
	planId: z.string().optional(),
	productId: z.string().optional(),
	planName: z.string().optional(),
	productName: z.string().optional(),
	billingCycle: storefrontBillingCycleSchema.default("MONTHLY"),
	locationName: z.string().optional(),
	bundleDomains: z.array(z.string().min(1)).optional(),
});

export const storefrontCartQuoteInputSchema = z.object({
	main: storefrontCartMainLineSchema,
	upsellDomain: z
		.object({
			domain: z.string().min(1),
			isExisting: z.boolean().optional(),
		})
		.optional(),
	upsellHosting: z
		.object({
			serviceType: z.enum(["web_hosting", "wordpress_hosting", "email_hosting"]),
			planId: z.string().min(1),
			billingCycle: storefrontBillingCycleSchema,
		})
		.optional(),
	hivelocity: z
		.object({
			hivelocityProductId: z.number().int().positive(),
			locationName: z.string().min(1),
			selectedOsId: z.string().min(1),
			selectedOptionIds: z.array(z.number().int()),
		})
		.optional(),
});

export type StorefrontCartQuoteInput = z.infer<typeof storefrontCartQuoteInputSchema>;

export type StorefrontCartQuote = {
	currency: string;
	monthlyPrice: number;
	yearlyPrice: number;
	planName: string;
	productName: string;
	serviceType: string;
	planId?: string;
	productId?: string;
	locationName?: string;
	billingCycle: StorefrontBillingCycle;
	subtotal: number;
	taxAmount: number;
	total: number;
};

function serviceTypeToHivelocityProductType(
	serviceType: string,
): HivelocityProductTypeKey | null {
	if (serviceType === "vps") return "VPS";
	if (serviceType === "vds") return "VDS";
	if (serviceType === "dedicated_servers") return "DEDICATED_SERVERS";
	return null;
}

/** Derive monthly/yearly KES from a plan's stored price + billing cycle. */
export function derivePlanPricingKes(
	niscPrice: string | null | undefined,
	planBillingCycle: string | null | undefined,
  checkoutCycle: StorefrontBillingCycle,
): { monthly: number; yearly: number } {
	if (!niscPrice) return { monthly: 0, yearly: 0 };
	const price = Number.parseFloat(niscPrice);
	if (!Number.isFinite(price) || price <= 0) return { monthly: 0, yearly: 0 };

	const cycle = (planBillingCycle ?? "MONTHLY").toUpperCase();
	if (cycle === "MONTHLY") {
		return { monthly: Math.round(price), yearly: Math.round(price * 12 * 0.8) };
	}
	if (cycle === "YEARLY") {
		return { monthly: Math.round(price / 12), yearly: Math.round(price) };
	}
	return { monthly: Math.round(price), yearly: Math.round(price * 12 * 0.8) };
}

function pickCheckoutPrice(
	pricing: { monthly: number; yearly: number },
	billingCycle: StorefrontBillingCycle,
): number {
	return billingCycle === "YEARLY" ? pricing.yearly : pricing.monthly;
}

function marginRowFromSettings(row: {
	marginType: string | null;
	percentageMargin: string | null;
	fixedMargin: string | null;
	roundOff: string | null;
}): HivelocityMarginRow {
	return {
		marginType: row.marginType,
		percentageMargin: row.percentageMargin,
		fixedMargin: row.fixedMargin,
		roundOff: row.roundOff,
	};
}

async function fetchHivelocityPricingMargins(productType: HivelocityProductTypeKey): Promise<{
	base: HivelocityMarginRow | null;
	os: HivelocityMarginRow | null;
	addons: HivelocityMarginRow | null;
}> {
	const [row] = await db
		.select()
		.from(hivelocityPricingSettings)
		.where(
			and(
				eq(hivelocityPricingSettings.productType, productType),
				eq(hivelocityPricingSettings.isDefault, true),
			),
		)
		.limit(1);

	if (!row) {
		const base = await getDefaultHivelocityMarginSettings(productType);
		return { base, os: base, addons: base };
	}

	return {
		base: marginRowFromSettings(row),
		os: marginRowFromSettings({
			marginType: row.osMarginType,
			percentageMargin: row.osPercentageMargin,
			fixedMargin: row.osFixedMargin,
			roundOff: row.osRoundOff,
		}),
		addons: marginRowFromSettings({
			marginType: row.addonsMarginType,
			percentageMargin: row.addonsPercentageMargin,
			fixedMargin: row.addonsFixedMargin,
			roundOff: row.addonsRoundOff,
		}),
	};
}

function usdLineToKes(
	monthlyUsd: number,
	margin: HivelocityMarginRow | null,
	kesRate: number | null,
): number {
	if (monthlyUsd <= 0) return 0;
	const marginedUsd = applyHivelocityMarginUsd(margin, monthlyUsd);
	if (kesRate != null) return ceilConvertedPrice(marginedUsd * kesRate);
	return Math.ceil(marginedUsd);
}

function parseOptionMonthlyUsd(row: Record<string, unknown>): number {
	const price = Number(row.monthlyPrice ?? row.monthly_price ?? row.price ?? 0);
	return Number.isFinite(price) && price > 0 ? price : 0;
}

async function resolveNiscPlanQuote(
	planId: string,
	billingCycle: StorefrontBillingCycle,
): Promise<{ monthly: number; yearly: number; planName: string; currency: string }> {
	const plan = await db.query.niscProductPlan.findFirst({
		where: and(eq(niscProductPlan.id, planId), eq(niscProductPlan.isActive, true)),
		columns: {
			id: true,
			name: true,
			price: true,
			billingCycle: true,
			currency: true,
		},
	});

	if (!plan) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "The selected plan is no longer available.",
		});
	}

	const pricing = derivePlanPricingKes(plan.price, plan.billingCycle, billingCycle);
	return {
		...pricing,
		planName: plan.name ?? "",
		currency: plan.currency ?? "KES",
	};
}

async function resolveDomainRetailPriceKes(domain: string): Promise<number> {
	const normalized = domain.trim().toLowerCase();
	const dotIndex = normalized.indexOf(".");
	if (dotIndex <= 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid domain name.",
		});
	}

	const name = normalized.slice(0, dotIndex);
	const extension = normalized.slice(dotIndex);

	const result = await agentCheckDomainAvailability({
		name,
		extensions: [extension],
		targetCurrency: "KES",
	});

	const entry = result.checked.find((d) => d.domain === normalized);
	if (!entry?.price?.amount || entry.price.amount <= 0) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `Could not resolve pricing for ${normalized}.`,
		});
	}

	return Math.round(entry.price.amount);
}

async function resolveDomainBundlePriceKes(domains: string[]): Promise<number> {
	if (domains.length === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Domain bundle requires at least one domain.",
		});
	}

	let total = 0;
	for (const domain of domains) {
		total += await resolveDomainRetailPriceKes(domain);
	}
	return total;
}

async function resolveHivelocityBasePricing(
	serviceType: string,
	hivelocityProductId: number,
	locationName?: string,
): Promise<{ monthly: number; yearly: number }> {
	const productType = serviceTypeToHivelocityProductType(serviceType);
	if (!productType) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid Hivelocity service type.",
		});
	}

	const raw = await hivelocityRequest<unknown>(
		`/inventory/product/${hivelocityProductId}`,
		{ requireApiKey: true },
	);

	const baseMonthlyUsd = extractHivelocityProductMonthlyUsd(raw, {
		locationName,
		productId: hivelocityProductId,
	});
	if (baseMonthlyUsd <= 0) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Could not resolve server plan pricing.",
		});
	}

	const [margins, kesRate] = await Promise.all([
		fetchHivelocityPricingMargins(productType),
		resolveUsdToKesExchangeRate(),
	]);

	const baseKes = usdLineToKes(baseMonthlyUsd, margins.base, kesRate);
	const monthly = baseKes;
	const yearly = Math.round(monthly * 12 * 0.8);

	return { monthly, yearly };
}

async function resolveHivelocityMainPricing(
	serviceType: string,
	hivelocityProductId: number,
	config: NonNullable<StorefrontCartQuoteInput["hivelocity"]>,
): Promise<{ monthly: number; yearly: number }> {
	const productType = serviceTypeToHivelocityProductType(serviceType);
	if (!productType) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid Hivelocity service type.",
		});
	}

	const raw = await hivelocityRequest<unknown>(
		`/inventory/product/${hivelocityProductId}`,
		{ requireApiKey: true },
	);

	const baseMonthlyUsd = extractHivelocityProductMonthlyUsd(raw, {
		locationName: config.locationName,
		productId: hivelocityProductId,
	});
	if (baseMonthlyUsd <= 0) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Could not resolve server plan pricing.",
		});
	}

	const [margins, kesRate, osRaw, optionsRaw] = await Promise.all([
		fetchHivelocityPricingMargins(productType),
		resolveUsdToKesExchangeRate(),
		hivelocityRequest<unknown>(`/product/${hivelocityProductId}/operating-systems`, {
			requireApiKey: true,
		}),
		hivelocityRequest<unknown>(`/product/${hivelocityProductId}/options`, {
			query: { groupBy: "upgrade" },
			requireApiKey: true,
		}),
	]);

	let extrasKes = 0;

	const osRows = Array.isArray(osRaw) ? osRaw : [];
	for (const row of osRows) {
		if (!row || typeof row !== "object") continue;
		const r = row as Record<string, unknown>;
		if (String(r.id) !== config.selectedOsId) continue;
		extrasKes += usdLineToKes(parseOptionMonthlyUsd(r), margins.os, kesRate);
		break;
	}

	const optionGroups =
		optionsRaw && typeof optionsRaw === "object" && !Array.isArray(optionsRaw)
			? (optionsRaw as Record<string, unknown>)
			: {};
	const selectedOptionSet = new Set(config.selectedOptionIds);

	for (const value of Object.values(optionGroups)) {
		const rows = Array.isArray(value) ? value : [];
		for (const row of rows) {
			if (!row || typeof row !== "object") continue;
			const r = row as Record<string, unknown>;
			const id = Number(r.id);
			if (!selectedOptionSet.has(id)) continue;
			extrasKes += usdLineToKes(parseOptionMonthlyUsd(r), margins.addons, kesRate);
		}
	}

	const baseKes = usdLineToKes(baseMonthlyUsd, margins.base, kesRate);
	const monthly = baseKes + extrasKes;
	const yearly = Math.round(monthly * 12 * 0.8);

	return { monthly, yearly };
}

async function resolveMainLineQuote(
	main: StorefrontCartQuoteInput["main"],
	hivelocity: StorefrontCartQuoteInput["hivelocity"],
): Promise<{
	monthly: number;
	yearly: number;
	planName: string;
	productName: string;
	currency: string;
}> {
	const billingCycle = main.billingCycle;
	const productName = main.productName?.trim() || "Nisc Cloud Service";

	if (main.serviceType === "domain_registration") {
		if (main.bundleDomains && main.bundleDomains.length > 0) {
			const yearly = await resolveDomainBundlePriceKes(main.bundleDomains);
			return {
				monthly: 0,
				yearly,
				planName: main.planName?.trim() || main.bundleDomains.join(", "),
				productName: main.productName?.trim() || "Domain Bundle",
				currency: "KES",
			};
		}

		const domain = main.planName?.trim();
		if (!domain) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Domain registration requires a domain name.",
			});
		}

		const yearly = await resolveDomainRetailPriceKes(domain);
		return {
			monthly: 0,
			yearly,
			planName: domain,
			productName: productName || "Domain Registration",
			currency: "KES",
		};
	}

	if (HIVELOCITY_SERVICE_TYPES.has(main.serviceType)) {
		const productId = Number(main.planId);
		if (!Number.isFinite(productId) || productId <= 0) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid server plan.",
			});
		}

		// Base product price until the customer selects OS / add-ons on the cart page.
		if (!hivelocity?.selectedOsId) {
			const pricing = await resolveHivelocityBasePricing(
				main.serviceType,
				productId,
				main.locationName,
			);
			return {
				...pricing,
				planName: main.planName?.trim() || "Server Plan",
				productName,
				currency: "KES",
			};
		}

		const pricing = await resolveHivelocityMainPricing(
			main.serviceType,
			productId,
			hivelocity,
		);

		return {
			...pricing,
			planName: main.planName?.trim() || "Server Plan",
			productName,
			currency: "KES",
		};
	}

	if (!main.planId?.trim()) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "A plan must be selected.",
		});
	}

	const planQuote = await resolveNiscPlanQuote(main.planId, billingCycle);
	return {
		monthly: planQuote.monthly,
		yearly: planQuote.yearly,
		planName: main.planName?.trim() || planQuote.planName,
		productName,
		currency: planQuote.currency,
	};
}

export async function computeStorefrontCartQuote(
	input: StorefrontCartQuoteInput,
): Promise<StorefrontCartQuote> {
	const parsed = storefrontCartQuoteInputSchema.parse(input);

	// Domains register for 1 year — checkout always uses the yearly price.
	const effectiveBillingCycle =
		parsed.main.serviceType === "domain_registration"
			? "YEARLY"
			: parsed.main.billingCycle;

	const mainQuote = await resolveMainLineQuote(parsed.main, parsed.hivelocity);
	let subtotal = pickCheckoutPrice(
		{ monthly: mainQuote.monthly, yearly: mainQuote.yearly },
		effectiveBillingCycle,
	);

	if (parsed.upsellDomain && !parsed.upsellDomain.isExisting) {
		subtotal += await resolveDomainRetailPriceKes(parsed.upsellDomain.domain);
	}

	if (parsed.upsellHosting) {
		const hostingPlan = await resolveNiscPlanQuote(
			parsed.upsellHosting.planId,
			parsed.upsellHosting.billingCycle,
		);
		subtotal += pickCheckoutPrice(
			{ monthly: hostingPlan.monthly, yearly: hostingPlan.yearly },
			parsed.upsellHosting.billingCycle,
		);
	}

	if (subtotal < 1) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Unable to calculate a valid checkout total.",
		});
	}

	const taxAmount = Math.round(subtotal * 0.16);
	const total = subtotal + taxAmount;

	return {
		currency: mainQuote.currency,
		monthlyPrice: mainQuote.monthly,
		yearlyPrice: mainQuote.yearly,
		planName: mainQuote.planName,
		productName: mainQuote.productName,
		serviceType: parsed.main.serviceType,
		planId: parsed.main.planId,
		productId: parsed.main.productId,
		locationName: parsed.main.locationName,
		billingCycle: effectiveBillingCycle,
		subtotal,
		taxAmount,
		total,
	};
}
