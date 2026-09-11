/**
 * Resolve which subscriptions a paid invoice should renew.
 * Only renewal invoices are linked (cron metadata / subscription.invoiceId).
 * Original NISC order invoices are NOT treated as renewal links.
 */
import { db, eq, inArray } from "@npanel/db";
import { invoice, invoiceLineItem } from "@npanel/db/schema/invoicing";
import { niscClientSubscription, niscProduct } from "@npanel/db/schema/products";
import { SUBSCRIPTION_RENEWAL_INVOICE_SOURCE } from "./subscription-renewal-invoice";

export type InvoiceLinkedSubscription = {
	id: string;
	name: string | null;
	teamId: string | null;
	userId: string | null;
	recordedBy: string | null;
	subscribedBy: string | null;
	productId: string;
	productPlanId: string | null;
	billingCycle: string | null;
	agreedPrice: string | null;
	agreedCurrency: string | null;
	expiryDate: Date | null;
	nextRenewalDate: Date | null;
	primaryDomain: string | null;
	openProviderId: number | null;
	status: string;
	productName: string;
	serviceType: string;
};

function uniqueIds(ids: Array<string | null | undefined>): string[] {
	return [...new Set(ids.filter((id): id is string => Boolean(id?.trim())))];
}

export async function resolveLinkedSubscriptionsForInvoice(
	invoiceId: string,
): Promise<InvoiceLinkedSubscription[]> {
	const [inv] = await db
		.select({ metadata: invoice.metadata })
		.from(invoice)
		.where(eq(invoice.id, invoiceId))
		.limit(1);
	if (!inv) return [];

	const meta =
		inv.metadata && typeof inv.metadata === "object" && !Array.isArray(inv.metadata)
			? (inv.metadata as Record<string, unknown>)
			: {};

	const fromInvoiceMeta =
		typeof meta.subscriptionId === "string" ? meta.subscriptionId : null;

	const lines = await db
		.select({ metadata: invoiceLineItem.metadata })
		.from(invoiceLineItem)
		.where(eq(invoiceLineItem.invoiceId, invoiceId));

	const fromLines = lines.map((line) => {
		if (!line.metadata || typeof line.metadata !== "object" || Array.isArray(line.metadata)) {
			return null;
		}
		const m = line.metadata as Record<string, unknown>;
		return typeof m.subscriptionId === "string" ? m.subscriptionId : null;
	});

	const pointedAtInvoice = await db
		.select({ id: niscClientSubscription.id })
		.from(niscClientSubscription)
		.where(eq(niscClientSubscription.invoiceId, invoiceId));

	const ids = uniqueIds([
		fromInvoiceMeta,
		...fromLines,
		...pointedAtInvoice.map((row) => row.id),
	]);
	if (ids.length === 0) return [];

	const rows = await db
		.select({
			id: niscClientSubscription.id,
			name: niscClientSubscription.name,
			teamId: niscClientSubscription.teamId,
			userId: niscClientSubscription.userId,
			recordedBy: niscClientSubscription.recordedBy,
			subscribedBy: niscClientSubscription.subscribedBy,
			productId: niscClientSubscription.productId,
			productPlanId: niscClientSubscription.productPlanId,
			billingCycle: niscClientSubscription.billingCycle,
			agreedPrice: niscClientSubscription.agreedPrice,
			agreedCurrency: niscClientSubscription.agreedCurrency,
			expiryDate: niscClientSubscription.expiryDate,
			nextRenewalDate: niscClientSubscription.nextRenewalDate,
			primaryDomain: niscClientSubscription.primaryDomain,
			openProviderId: niscClientSubscription.openProviderId,
			status: niscClientSubscription.status,
			productName: niscProduct.name,
			serviceType: niscProduct.serviceType,
		})
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscProduct.id, niscClientSubscription.productId))
		.where(inArray(niscClientSubscription.id, ids));

	return rows;
}

export function isRenewalInvoiceMetadata(metadata: unknown): boolean {
	if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
	const m = metadata as Record<string, unknown>;
	return m.source === SUBSCRIPTION_RENEWAL_INVOICE_SOURCE || typeof m.subscriptionId === "string";
}
