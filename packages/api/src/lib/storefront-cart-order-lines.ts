/**
 * Build authoritative Nisc order line items from a resolved storefront cart.
 * Existing-domain upsells attach to the main subscription only  no domain subscription line.
 */
import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct, niscProductPlan } from "@npanel/db/schema/products";
import {
	computeStorefrontCartQuote,
	normalizeStorefrontMainBillingCycle,
	pickCheckoutPrice,
	resolveDomainRetailPriceKes,
	resolveDomainTransferUpsellPriceKes,
	resolveMainLineQuote,
	resolveNiscPlanQuote,
	storefrontCartQuoteInputSchema,
	type StorefrontBillingCycle,
	type StorefrontCartQuoteInput,
} from "./storefront-cart-pricing";
import { resolveActiveNiscProductById } from "./planless-product-resolver";
import { NISC_DOMAINS_PRODUCT_ID } from "./planless-services-billing";

const HOSTING_SERVICE_TYPES = new Set([
	"web_hosting",
	"wordpress_hosting",
	"email_hosting",
	"vps",
	"vds",
	"dedicated_servers",
]);

/** Shared / email hosting must be bound to a customer domain at checkout. */
const DOMAIN_REQUIRED_HOSTING_TYPES = new Set([
	"web_hosting",
	"wordpress_hosting",
	"email_hosting",
]);

export type StorefrontCartOrderLine = {
	productId: string;
	productPlanId: string | null;
	billingCycle: StorefrontBillingCycle;
	primaryDomain: string | null;
	itemPrice: number;
	description: string | null;
	metadata: Record<string, unknown> | null;
};

async function resolveDomainRegistrationProductId(): Promise<string> {
	const product = await resolveActiveNiscProductById(NISC_DOMAINS_PRODUCT_ID);
	if (!product) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Domain registration product is not available.",
		});
	}
	return product.id;
}

async function resolveDomainTransferProductId(): Promise<string> {
	const [product] = await db
		.select({ id: niscProduct.id })
		.from(niscProduct)
		.where(and(eq(niscProduct.isActive, true), eq(niscProduct.serviceType, "domain_transfer")))
		.limit(1);
	if (!product) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Domain transfer product is not available.",
		});
	}
	return product.id;
}

function resolveMainPrimaryDomain(
	parsed: StorefrontCartQuoteInput,
	fallbackPrimaryDomain?: string,
): string | null {
	const mainType = parsed.main.serviceType;
	const upsellDomain = parsed.upsellDomain?.domain?.trim().toLowerCase();

	if (mainType === "domain_registration" || mainType === "domain_transfer") {
		return parsed.main.planName?.trim().toLowerCase() || fallbackPrimaryDomain?.trim().toLowerCase() || null;
	}

	if (HOSTING_SERVICE_TYPES.has(mainType) && upsellDomain) {
		return upsellDomain;
	}

	return fallbackPrimaryDomain?.trim().toLowerCase() || null;
}

export async function buildStorefrontCartOrderLines(input: {
	cart: StorefrontCartQuoteInput;
	primaryDomain?: string;
	fallbackProductId?: string;
}): Promise<{
	lines: StorefrontCartOrderLine[];
	quote: Awaited<ReturnType<typeof computeStorefrontCartQuote>>;
}> {
	const parsed = storefrontCartQuoteInputSchema.parse(input.cart);

	if (
		DOMAIN_REQUIRED_HOSTING_TYPES.has(parsed.main.serviceType) &&
		!parsed.upsellDomain?.domain?.trim()
	) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"A domain is required for this hosting plan — register, transfer, or connect one you already own.",
		});
	}

	const quote = await computeStorefrontCartQuote(parsed);

	const effectiveBillingCycle = normalizeStorefrontMainBillingCycle(
		parsed.main.serviceType,
		parsed.main.billingCycle,
	);

	const mainQuote = await resolveMainLineQuote(parsed.main, parsed.hivelocity);
	const mainPrice = pickCheckoutPrice(
		{ monthly: mainQuote.monthly, yearly: mainQuote.yearly },
		effectiveBillingCycle,
	);

	const resolvedMainProduct = await resolveActiveNiscProductById(
		parsed.main.productId?.trim() ?? input.fallbackProductId?.trim() ?? "",
	);
	const mainProductId = resolvedMainProduct?.id ?? parsed.main.productId?.trim();
	if (!mainProductId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Checkout product is missing or inactive.",
		});
	}

	const isMainDomainTransfer = parsed.main.serviceType === "domain_transfer";
	const lines: StorefrontCartOrderLine[] = [
		{
			productId: mainProductId,
			productPlanId: parsed.main.planId?.trim() || null,
			billingCycle: effectiveBillingCycle,
			primaryDomain: resolveMainPrimaryDomain(parsed, input.primaryDomain),
			itemPrice: mainPrice,
			description: isMainDomainTransfer ? "transfer" : null,
			metadata: isMainDomainTransfer
				? {
						transferAuthCode: parsed.transferAuthCode?.trim(),
					}
				: null,
		},
	];

	// Purchased domain upsell → separate domain subscription line.
	// Existing domains only name the main hosting subscription (primaryDomain above).
	if (parsed.upsellDomain && !parsed.upsellDomain.isExisting) {
		const domain = parsed.upsellDomain.domain.trim().toLowerCase();

		if (parsed.upsellDomain.isTransfer) {
			const authCode = parsed.transferAuthCode?.trim();
			if (!authCode) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Domain transfer requires an authorization (EPP) code.",
				});
			}

			const transferPrice = await resolveDomainTransferUpsellPriceKes(domain);

			lines.push({
				productId: await resolveDomainTransferProductId(),
				productPlanId: null,
				billingCycle: "YEARLY",
				primaryDomain: domain,
				itemPrice: transferPrice,
				description: "transfer",
				metadata: {
					transferAuthCode: authCode,
					transferProvider: parsed.upsellDomain.provider ?? null,
				},
			});
		} else {
			const registrationPrice = await resolveDomainRetailPriceKes(domain);

			lines.push({
				productId: await resolveDomainRegistrationProductId(),
				productPlanId: null,
				billingCycle: "YEARLY",
				primaryDomain: domain,
				itemPrice: registrationPrice,
				description: null,
				metadata: null,
			});
		}
	}

	if (parsed.upsellHosting) {
		const [hostingPlanRow] = await db
			.select({
				productId: niscProductPlan.productId,
			})
			.from(niscProductPlan)
			.where(
				and(
					eq(niscProductPlan.id, parsed.upsellHosting.planId),
					eq(niscProductPlan.isActive, true),
				),
			)
			.limit(1);

		if (!hostingPlanRow?.productId) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Selected hosting upsell plan is no longer available.",
			});
		}

		const hostingPlan = await resolveNiscPlanQuote(
			parsed.upsellHosting.planId,
			parsed.upsellHosting.billingCycle,
		);
		const hostingPrice = pickCheckoutPrice(
			{ monthly: hostingPlan.monthly, yearly: hostingPlan.yearly },
			parsed.upsellHosting.billingCycle,
		);

		const domainForHosting =
			parsed.main.serviceType === "domain_registration" ||
			parsed.main.serviceType === "domain_transfer"
				? parsed.main.planName?.trim().toLowerCase() || null
				: null;

		lines.push({
			productId: hostingPlanRow.productId,
			productPlanId: parsed.upsellHosting.planId,
			billingCycle: parsed.upsellHosting.billingCycle,
			primaryDomain: domainForHosting,
			itemPrice: hostingPrice,
			description: null,
			metadata: null,
		});
	}

	const lineSubtotal = lines.reduce((sum, line) => sum + line.itemPrice, 0);
	if (lineSubtotal !== quote.subtotal) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Checkout line totals could not be reconciled. Please refresh and try again.",
		});
	}

	return { lines, quote };
}
