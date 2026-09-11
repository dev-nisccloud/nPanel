/**
 * Apply a successful gateway payment (M-Pesa / Jenga) onto a linked invoice,
 * then fulfill subscription renewals when the invoice is fully paid.
 */
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	invoice,
	invoiceActivityLog,
	invoiceTransaction,
} from "@npanel/db/schema/invoicing";
import { paymentTransaction } from "@npanel/db/schema/payment-transactions";
import { computeInvoicePaymentState } from "./invoice-payment-state";
import { invoicePaymentMethodFromGateway } from "./invoice-payment-method";
import { fulfillPaidInvoiceRenewals } from "./invoice-renewal-fulfillment";

export type ApplyGatewayInvoicePaymentResult =
	| { ok: true; skipped: true; reason: string }
	| { ok: true; skipped: false; invoiceId: string; nowPaidInFull: boolean }
	| { ok: false; error: string };

export function invoiceIdFromPaymentMetadata(metadata: unknown): string | null {
	if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
	const id = (metadata as Record<string, unknown>).invoiceId;
	return typeof id === "string" && id.trim() ? id.trim() : null;
}

function paymentTxIdFromInvoiceTxMetadata(metadata: unknown): string | null {
	if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
	const id = (metadata as Record<string, unknown>).paymentTransactionId;
	return typeof id === "string" && id.trim() ? id.trim() : null;
}

export async function applySuccessfulPaymentToInvoice(
	paymentTransactionId: string,
): Promise<ApplyGatewayInvoicePaymentResult> {
	const [pay] = await db
		.select()
		.from(paymentTransaction)
		.where(eq(paymentTransaction.id, paymentTransactionId))
		.limit(1);
	if (!pay) return { ok: false, error: "Payment not found" };
	if (pay.status !== "SUCCESS") {
		return { ok: true, skipped: true, reason: "payment_not_success" };
	}

	const invoiceId = invoiceIdFromPaymentMetadata(pay.metadata);
	if (!invoiceId) {
		return { ok: true, skipped: true, reason: "not_invoice_payment" };
	}

	const [inv] = await db
		.select({
			id: invoice.id,
			status: invoice.status,
			amount: invoice.amount,
			currency: invoice.currency,
			paymentDetails: invoice.paymentDetails,
			amountPaid: invoice.amountPaid,
			createdBy: invoice.createdBy,
		})
		.from(invoice)
		.where(eq(invoice.id, invoiceId))
		.limit(1);
	if (!inv) return { ok: false, error: "Invoice not found" };
	if (inv.status === "CANCELLED" || inv.status === "WRITTEN_OFF") {
		return { ok: true, skipped: true, reason: "invoice_closed" };
	}

	const existingTxs = await db
		.select({
			id: invoiceTransaction.id,
			amount: invoiceTransaction.amount,
			status: invoiceTransaction.status,
			providerReference: invoiceTransaction.providerReference,
			metadata: invoiceTransaction.metadata,
		})
		.from(invoiceTransaction)
		.where(eq(invoiceTransaction.invoiceId, invoiceId));

	const alreadyApplied = existingTxs.some((row) => {
		if (paymentTxIdFromInvoiceTxMetadata(row.metadata) === pay.id) return true;
		const pref = (row.providerReference ?? "").trim();
		return Boolean(
			pref &&
				(pref === pay.id ||
					pref === (pay.checkoutRequestId ?? "") ||
					pref === (pay.receiptNumber ?? "")),
		);
	});

	if (alreadyApplied) {
		const paymentState = computeInvoicePaymentState({
			amount: inv.amount,
			amountPaid: inv.amountPaid,
			status: inv.status,
			transactions: existingTxs,
		});
		if (paymentState.fullyPaid) {
			await fulfillPaidInvoiceRenewals(invoiceId, pay.userId);
		}
		return {
			ok: true,
			skipped: false,
			invoiceId,
			nowPaidInFull: paymentState.fullyPaid,
		};
	}

	const paymentState = computeInvoicePaymentState({
		amount: inv.amount,
		amountPaid: inv.amountPaid,
		status: inv.status,
		transactions: existingTxs,
	});
	const recordedNum =
		Number.parseFloat(pay.paidAmount || pay.amount || "0") || 0;
	if (recordedNum <= 0) {
		return { ok: false, error: "Payment amount is missing" };
	}

	const alreadyPaid = paymentState.paid;
	const totalAmountNum = Number.parseFloat(inv.amount ?? "0") || 0;
	const newPaid = Math.round((alreadyPaid + recordedNum) * 100) / 100;
	const newRemaining = Math.max(0, Math.round((totalAmountNum - newPaid) * 100) / 100);
	const newCredit = Math.max(0, Math.round((newPaid - totalAmountNum) * 100) / 100);
	const nowPaidInFull = newRemaining <= 0;
	const now = new Date();
	const method = invoicePaymentMethodFromGateway(pay.gateway) ?? "OTHER";

	await db.transaction(async (tx) => {
		await tx
			.update(invoice)
			.set({
				status: nowPaidInFull ? "PAID" : "PARTIALLY_PAID",
				paidAt: nowPaidInFull ? now : null,
				amountPaid: String(newPaid),
				amountRemaining: String(newRemaining),
				creditBalance: newCredit > 0 ? String(newCredit) : "0",
				updatedAt: now,
			})
			.where(eq(invoice.id, invoiceId));

		await tx.insert(invoiceTransaction).values({
			id: crypto.randomUUID(),
			invoiceId,
			status: "COMPLETED",
			method,
			amount: String(recordedNum),
			currency: pay.currency ?? inv.currency ?? "KES",
			paidAt: pay.processedAt ?? now,
			recordedBy: pay.userId,
			reference: pay.receiptNumber || pay.checkoutRequestId || null,
			providerReference:
				pay.gatewayTransactionId || pay.checkoutRequestId || pay.id,
			notes: pay.notes ?? null,
			metadata: {
				paymentTransactionId: pay.id,
				gateway: pay.gateway,
				checkoutRequestId: pay.checkoutRequestId,
				source: "invoice-gateway-payment",
			},
			createdAt: now,
			updatedAt: now,
		});

		await tx.insert(invoiceActivityLog).values({
			id: crypto.randomUUID(),
			invoiceId,
			userId: pay.userId,
			action: nowPaidInFull ? "PAYMENT_COMPLETE" : "PAYMENT_PARTIAL",
			description: nowPaidInFull
				? `Gateway payment recorded: ${pay.currency ?? "KES"} ${recordedNum}`
				: `Partial gateway payment recorded: ${pay.currency ?? "KES"} ${recordedNum}`,
			metadata: {
				paymentTransactionId: pay.id,
				gateway: pay.gateway,
				amount: recordedNum,
			},
			createdAt: now,
		});
	});

	if (nowPaidInFull) {
		try {
			const fulfillment = await fulfillPaidInvoiceRenewals(invoiceId, pay.userId);
			if (!fulfillment.ok || !fulfillment.skipped) {
				await db.insert(invoiceActivityLog).values({
					id: crypto.randomUUID(),
					invoiceId,
					userId: pay.userId,
					action: "RENEWAL_FULFILLMENT",
					description: fulfillment.ok
						? `Invoice paid; renewal order ${fulfillment.orderNumber} (${fulfillment.status}).`
						: `Invoice paid; renewal fulfillment failed: ${fulfillment.error}`,
					metadata: fulfillment,
					createdAt: new Date(),
				});
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			await db.insert(invoiceActivityLog).values({
				id: crypto.randomUUID(),
				invoiceId,
				userId: pay.userId,
				action: "RENEWAL_FULFILLMENT",
				description: `Invoice paid; renewal fulfillment failed: ${message}`,
				metadata: { ok: false, error: message },
				createdAt: new Date(),
			});
		}
	}

	return { ok: true, skipped: false, invoiceId, nowPaidInFull };
}

export async function applySuccessfulPaymentToInvoiceSafe(
	paymentTransactionId: string,
): Promise<void> {
	try {
		await applySuccessfulPaymentToInvoice(paymentTransactionId);
	} catch (err) {
		console.error(
			"[invoice-gateway-payment] Failed to apply payment to invoice:",
			err,
		);
	}
}
