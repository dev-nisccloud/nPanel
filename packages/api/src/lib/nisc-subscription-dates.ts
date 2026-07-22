import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { domainTransferRequest } from "@npanel/db/schema/domain-transfer-requests";

import { addBillingCycleToDate } from "./nisc-order-invoice-line-items";

/**
 * When a domain transfer subscription is created: start on transfer request date (or order date), not "now" at provision time.
 */
export async function resolveDomainTransferSubscriptionStartDate(options: {
	domainTransferRequestId?: string | null;
	orderCreatedAt?: Date | null;
	fallback?: Date;
}): Promise<Date> {
	const fallback = options.fallback ?? new Date();
	const requestId = options.domainTransferRequestId?.trim();
	if (requestId) {
		const [row] = await db
			.select({
				createdAt: domainTransferRequest.createdAt,
				submittedToProviderAt: domainTransferRequest.submittedToProviderAt,
			})
			.from(domainTransferRequest)
			.where(eq(domainTransferRequest.id, requestId))
			.limit(1);
		if (row?.submittedToProviderAt) return row.submittedToProviderAt;
		if (row?.createdAt) return row.createdAt;
	}
	if (options.orderCreatedAt) return options.orderCreatedAt;
	return fallback;
}

export function computeSubscriptionExpiryFromBillingCycle(
	subscriptionDate: Date,
	billingCycle: string | null | undefined,
): Date | null {
	return addBillingCycleToDate(subscriptionDate, billingCycle);
}

/**
 * Prefill expiry + next renewal for new subscriptions.
 * - Prefer an explicit registry/provider expiry when provided.
 * - Otherwise derive from billing cycle (null-safe when cycle missing/unknown).
 * - nextRenewalDate mirrors expiryDate (renewal due when the period ends).
 */
export function resolveSubscriptionPeriodDates(
	subscriptionDate: Date,
	billingCycle: string | null | undefined,
	options?: { expiryOverride?: Date | null },
): { expiryDate: Date | null; nextRenewalDate: Date | null } {
	const override = options?.expiryOverride ?? null;
	const expiry =
		override ??
		computeSubscriptionExpiryFromBillingCycle(subscriptionDate, billingCycle);
	if (!expiry) {
		return { expiryDate: null, nextRenewalDate: null };
	}
	return { expiryDate: expiry, nextRenewalDate: expiry };
}
