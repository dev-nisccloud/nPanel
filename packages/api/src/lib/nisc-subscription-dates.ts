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
