import { db } from "@npanel/db";
import { signStorefrontToken } from "./storefront-token";
import { storefrontOrdersRouter } from "../routers/storefront/orders";
import type { JengaPaymentMetadata } from "../routers/payment-gateway/jenga/types";

type StorefrontOrderMetadata = JengaPaymentMetadata & {
	teamSlug?: string;
};

export type StorefrontOrderCompletionResult =
	| { completed: true; orderId: string; orderNumber: string }
	| { completed: false; reason: string };

/**
 * Complete a storefront order from verified payment metadata. This removes the
 * browser from the authoritative completion path while reusing the same
 * idempotent order procedure and provisioning handoff.
 */
export async function completeStorefrontOrderFromVerifiedPayment(params: {
	checkoutRequestId: string;
	userId: string;
	teamId: string | null;
	metadata: unknown;
}): Promise<StorefrontOrderCompletionResult> {
	const metadata =
		params.metadata && typeof params.metadata === "object"
			? (params.metadata as StorefrontOrderMetadata)
			: null;
	if (metadata?.source !== "storefront") {
		return { completed: false, reason: "not_storefront_payment" };
	}
	if (
		!params.teamId ||
		!metadata.teamSlug ||
		!metadata.cart ||
		!metadata.productId ||
		!metadata.quoteToken
	) {
		return { completed: false, reason: "incomplete_order_metadata" };
	}

	const storefrontToken = signStorefrontToken(
		params.userId,
		params.teamId,
		metadata.teamSlug,
	);
	const caller = storefrontOrdersRouter.createCaller({
		session: null,
		ipAddress: "verified-payment-webhook",
		apiKeyError: null,
		req: undefined,
		getCookie: () => undefined,
		setCookie: () => undefined,
		db,
		ip: null,
		userAgent: "verified-payment-webhook",
	} as never);

	const result = await caller.createFromPayment({
		storefrontToken,
		checkoutRequestId: params.checkoutRequestId,
		cart: metadata.cart as never,
		planId: metadata.planId,
		productId: metadata.productId,
		billingCycle: metadata.billingCycle as never,
		primaryDomain: metadata.primaryDomain,
		quoteToken: metadata.quoteToken,
	});

	return {
		completed: true,
		orderId: result.orderId,
		orderNumber: result.orderNumber,
	};
}
