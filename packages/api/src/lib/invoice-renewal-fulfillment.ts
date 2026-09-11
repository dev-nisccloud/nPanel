/**
 * After a renewal invoice is paid in full, create a Nisc service order that
 * renews the linked subscription(s). Never treats original checkout invoices
 * as renewal targets — those are resolved only via renewal invoice links.
 */
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice } from "@npanel/db/schema/invoicing";
import { niscOrder, niscOrderItem } from "@npanel/db/schema/nisc-orders";
import { niscLog } from "./nisc-order-logger";
import { runPreProvisioningInvoiceForOrder } from "./nisc-order-invoice-delivery";
import { processNiscOrder } from "./nisc-order-processor";
import { NISC_ORDER_RENEWAL_DESCRIPTION } from "./nisc-order-renewal";
import { isTerminalSubscriptionStatus } from "./nisc-subscription-renewal-apply";
import { resolveLinkedSubscriptionsForInvoice } from "./invoice-subscription-link";
import { enqueueNiscOrderProcessing } from "./qstash/nisc-order-worker";

export const INVOICE_PAID_RENEWAL_SOURCE = "invoice-paid-renewal";

export type InvoiceRenewalFulfillmentResult =
	| { ok: true; skipped: true; reason: string }
	| { ok: true; skipped: false; orderId: string; orderNumber: string; status: string }
	| { ok: false; error: string };

function generateNiscOrderNumber(): string {
	const year = new Date().getFullYear();
	const timestamp = Date.now().toString().slice(-6);
	const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
	return `Nisc-${year}-${timestamp}-${random}`;
}

async function processOrderInline(niscOrderId: string) {
	await runPreProvisioningInvoiceForOrder(niscOrderId);
	return processNiscOrder(niscOrderId);
}

async function enqueueOrProcessInline(orderId: string): Promise<string | null> {
	try {
		const result = await enqueueNiscOrderProcessing(orderId);
		await db
			.update(niscOrder)
			.set({ qstashMessageId: result.messageId, updatedAt: new Date() })
			.where(eq(niscOrder.id, orderId));
		return result.messageId;
	} catch (err) {
		await niscLog("enqueue_fallback_inline", {
			niscOrderId: orderId,
			error: err instanceof Error ? err.message : String(err),
		});
		const processResult = await processOrderInline(orderId);
		if (!processResult.ok) {
			throw new Error(processResult.failureReason || "Failed to complete renewal order processing");
		}
		return null;
	}
}

async function findExistingRenewalOrder(invoiceId: string) {
	const [row] = await db
		.select({
			id: niscOrder.id,
			orderNumber: niscOrder.orderNumber,
			status: niscOrder.status,
		})
		.from(niscOrder)
		.where(
			and(
				eq(niscOrder.invoiceId, invoiceId),
				sql`(${niscOrder.metadata}->>'source') = ${INVOICE_PAID_RENEWAL_SOURCE}`,
			),
		)
		.limit(1);
	return row ?? null;
}

export async function fulfillPaidInvoiceRenewals(
	invoiceId: string,
	paidByUserId: string | null,
): Promise<InvoiceRenewalFulfillmentResult> {
	const linked = await resolveLinkedSubscriptionsForInvoice(invoiceId);
	const renewables = linked.filter((sub) => !isTerminalSubscriptionStatus(sub.status));
	if (renewables.length === 0) {
		return { ok: true, skipped: true, reason: "no_linked_subscriptions" };
	}

	const existing = await findExistingRenewalOrder(invoiceId);
	if (existing) {
		if (existing.status === "COMPLETED") {
			return {
				ok: true,
				skipped: false,
				orderId: existing.id,
				orderNumber: existing.orderNumber,
				status: existing.status,
			};
		}
		if (existing.status === "FAILED" || existing.status === "PARTIAL") {
			await db
				.update(niscOrder)
				.set({ status: "PENDING", failureReason: null, updatedAt: new Date() })
				.where(eq(niscOrder.id, existing.id));
		}
		if (existing.status !== "PROCESSING") {
			await enqueueOrProcessInline(existing.id);
		}
		const [refreshed] = await db
			.select({ status: niscOrder.status })
			.from(niscOrder)
			.where(eq(niscOrder.id, existing.id))
			.limit(1);
		return {
			ok: true,
			skipped: false,
			orderId: existing.id,
			orderNumber: existing.orderNumber,
			status: refreshed?.status ?? existing.status,
		};
	}

	const [inv] = await db
		.select({
			id: invoice.id,
			teamId: invoice.teamId,
			customerId: invoice.customerId,
			createdBy: invoice.createdBy,
			amount: invoice.amount,
			subtotal: invoice.subtotal,
			currency: invoice.currency,
			invoiceNumber: invoice.invoiceNumber,
		})
		.from(invoice)
		.where(eq(invoice.id, invoiceId))
		.limit(1);
	if (!inv) {
		return { ok: false, error: "Invoice not found" };
	}

	const primary = renewables[0]!;
	const currency = inv.currency ?? primary.agreedCurrency ?? "KES";
	const total = inv.amount ?? primary.agreedPrice ?? "0";
	const subtotal = inv.subtotal ?? total;

	let created: { id: string; orderNumber: string } | null = null;
	for (let attempt = 0; attempt < 3 && !created; attempt++) {
		const orderNumber = generateNiscOrderNumber();
		try {
			created = await db.transaction(async (tx) => {
				const ins = await tx
					.insert(niscOrder)
					.values({
						id: randomUUID(),
						orderNumber,
						userId: primary.userId ?? inv.customerId,
						teamId: inv.teamId ?? primary.teamId,
						createdBy: inv.createdBy || paidByUserId,
						status: "PENDING",
						subtotal,
						total,
						currency,
						invoiceId,
						invoiceNumber: inv.invoiceNumber,
						notes: "Paid invoice renewal",
						metadata: {
							source: INVOICE_PAID_RENEWAL_SOURCE,
							skipInvoice: true,
							invoiceId,
							subscriptionIds: renewables.map((row) => row.id),
						},
					})
					.returning({ id: niscOrder.id, orderNumber: niscOrder.orderNumber });
				const order = ins[0];
				if (!order) throw new Error("Failed to create renewal Nisc order");

				for (const sub of renewables) {
					const price = sub.agreedPrice ?? "0";
					await tx.insert(niscOrderItem).values({
						id: randomUUID(),
						niscOrderId: order.id,
						productId: sub.productId,
						productPlanId: sub.productPlanId,
						billingCycle: sub.billingCycle,
						itemPrice: price,
						itemSubtotal: price,
						itemCurrency: sub.agreedCurrency ?? currency,
						primaryDomain: sub.primaryDomain,
						description: NISC_ORDER_RENEWAL_DESCRIPTION,
						metadata: {
							existingSubscriptionId: sub.id,
							source: INVOICE_PAID_RENEWAL_SOURCE,
						},
					});
				}
				return order;
			});
		} catch (err) {
			const code =
				typeof err === "object" && err && "code" in err
					? String((err as { code?: string }).code)
					: "";
			if (code !== "23505" || attempt === 2) throw err;
		}
	}

	if (!created) {
		return { ok: false, error: "Failed to create renewal Nisc order" };
	}

	await niscLog("invoice_paid_renewal_order_created", {
		niscOrderId: created.id,
		invoiceId,
		subscriptionIds: renewables.map((row) => row.id),
	});

	await enqueueOrProcessInline(created.id);
	const [refreshed] = await db
		.select({ status: niscOrder.status })
		.from(niscOrder)
		.where(eq(niscOrder.id, created.id))
		.limit(1);

	return {
		ok: true,
		skipped: false,
		orderId: created.id,
		orderNumber: created.orderNumber,
		status: refreshed?.status ?? "PENDING",
	};
}
