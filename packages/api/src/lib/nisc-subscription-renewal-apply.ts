/**
 * Extend an existing nPanel subscription after a paid renewal (local dates + renewal row).
 */
import { randomUUID } from "node:crypto";
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	niscClientSubscription,
	niscClientSubscriptionActivityLog,
	niscClientSubscriptionRenewal,
} from "@npanel/db/schema/products";
import { addBillingCycleToDate } from "./nisc-order-invoice-line-items";
import {
	resolveDomainBillingCycle,
	resolveDomainRegistrationPeriodYears,
} from "./nisc-domain-billing-cycle";

const TERMINAL_STATUSES = new Set(["CANCELLED", "UPGRADED", "DOWNGRADED"]);

export function isTerminalSubscriptionStatus(status: string | null | undefined): boolean {
	return TERMINAL_STATUSES.has((status ?? "").toUpperCase());
}

export function resolveRenewalBillingCycle(input: {
	serviceType: string | null;
	productName: string;
	billingCycle: string | null;
}): string {
	const st = (input.serviceType ?? "").toLowerCase();
	const isDomain = st.includes("domain") || input.productName.toLowerCase().includes("domain");
	if (isDomain) return resolveDomainBillingCycle(input.billingCycle);
	return input.billingCycle?.trim() || "YEARLY";
}

export function computeRenewalExpiry(params: {
	currentExpiry: Date | null;
	billingCycle: string | null;
	serviceType: string | null;
	productName: string;
	now?: Date;
}): Date {
	const now = params.now ?? new Date();
	const cycle = resolveRenewalBillingCycle(params);
	const base =
		params.currentExpiry && params.currentExpiry.getTime() > now.getTime()
			? params.currentExpiry
			: now;
	return addBillingCycleToDate(base, cycle) ?? addBillingCycleToDate(base, "YEARLY") ?? base;
}

export async function applyLocalSubscriptionRenewal(params: {
	subscriptionId: string;
	newExpiryDate: Date;
	billingCycle: string | null;
	renewalPrice: string | null;
	renewalCurrency: string | null;
	orderId: string | null;
	renewedBy: string | null;
}): Promise<void> {
	const now = new Date();
	const renewalId = randomUUID();

	await db.transaction(async (tx) => {
		await tx.insert(niscClientSubscriptionRenewal).values({
			id: renewalId,
			subscriptionId: params.subscriptionId,
			renewalType: "PAID",
			renewedBy: params.renewedBy,
			renewalDate: now,
			newExpiryDate: params.newExpiryDate,
			newNextRenewalDate: params.newExpiryDate,
			billingCycle: params.billingCycle,
			status: "ACTIVE",
			renewalPrice: params.renewalPrice,
			renewalCurrency: params.renewalCurrency ?? "KES",
			orderId: params.orderId,
			notes: "Paid invoice renewal via Nisc service order",
		});

		await tx
			.update(niscClientSubscription)
			.set({
				status: "ACTIVE",
				expiryDate: params.newExpiryDate,
				nextRenewalDate: params.newExpiryDate,
				updatedAt: now,
			})
			.where(eq(niscClientSubscription.id, params.subscriptionId));
	});

	if (params.renewedBy) {
		await db.insert(niscClientSubscriptionActivityLog).values({
			id: randomUUID(),
			subscriptionId: params.subscriptionId,
			userId: params.renewedBy,
			action: "RENEW",
			description: "Renewed subscription after invoice payment",
			metadata: {
				renewalId,
				orderId: params.orderId,
				newExpiryDate: params.newExpiryDate.toISOString(),
			},
			ipAddress: null,
			userAgent: null,
		});
	}
}

export function renewalPeriodYears(billingCycle: string | null | undefined): number {
	return resolveDomainRegistrationPeriodYears(billingCycle);
}
