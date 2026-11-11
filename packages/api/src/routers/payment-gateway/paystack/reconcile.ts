import * as crypto from "node:crypto";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	paymentTransaction,
	paymentTransactionActivityLog,
} from "@npanel/db/schema/payment-transactions";
import { applySuccessfulPaymentToInvoiceSafe } from "../../../lib/invoice-apply-gateway-payment";
import { completeStorefrontOrderFromVerifiedPayment } from "../../../lib/storefront-order-completion";
import { verifyPaystackTransaction } from "./client";
import { resolveTaxPolicy } from "../../../lib/tax-policy";

export async function reconcilePaystackPayment(reference: string): Promise<{
	status: "PENDING" | "SUCCESS" | "FAILED" | "REJECTED";
	transactionId?: string;
}> {
	const transaction = await db.query.paymentTransaction.findFirst({
		where: and(
			eq(paymentTransaction.gateway, "PAYSTACK"),
			eq(paymentTransaction.checkoutRequestId, reference),
		),
	});
	if (!transaction) return { status: "REJECTED" };

	const verified = await verifyPaystackTransaction(reference);
	const expectedMinor = Math.round(Number(transaction.amount) * 100);
	const currencyMatches =
		verified.currency.toUpperCase() === transaction.currency.toUpperCase();
	const referenceMatches = verified.reference === reference;
	const amountMatches = verified.amount === expectedMinor;
	const paymentCountry =
		verified.authorization?.country_code?.trim().toUpperCase() || null;
	const taxPolicy = resolveTaxPolicy({
		billingCountry: transaction.billingCountry,
		ipCountry: transaction.ipCountry,
		paymentCountry,
	});
	const taxMatches =
		Math.abs(Number(transaction.taxRate ?? "0.16") - taxPolicy.rate) < 0.000001 &&
		(transaction.taxPolicyId ?? "STANDARD_VAT") === taxPolicy.id;
	const now = new Date();

	if (!currencyMatches || !referenceMatches || !amountMatches || !taxMatches) {
		await db.insert(paymentTransactionActivityLog).values({
			id: crypto.randomUUID(),
			transactionId: transaction.id,
			userId: transaction.userId,
			action: "VERIFICATION_REJECTED",
			description: "Paystack verification rejected due to settlement mismatch",
			metadata: {
				expectedReference: reference,
				receivedReference: verified.reference,
				expectedAmountMinor: expectedMinor,
				receivedAmountMinor: verified.amount,
				expectedCurrency: transaction.currency,
				receivedCurrency: verified.currency,
				expectedTaxPolicy: transaction.taxPolicyId,
				resolvedTaxPolicy: taxPolicy.id,
			},
			ipAddress: null,
			userAgent: null,
			createdAt: now,
		});
		return { status: "REJECTED", transactionId: transaction.id };
	}

	if (verified.status !== "success") {
		const terminal = new Set(["failed", "abandoned", "reversed"]);
		if (terminal.has(verified.status)) {
			await db
				.update(paymentTransaction)
				.set({
					status: "FAILED",
					gatewayStatus: verified.status,
					gatewayMessage: verified.gateway_response ?? verified.status,
					rawError: verified as unknown as Record<string, unknown>,
					failedAt: now,
					updatedAt: now,
				})
				.where(eq(paymentTransaction.id, transaction.id));
			return { status: "FAILED", transactionId: transaction.id };
		}
		return { status: "PENDING", transactionId: transaction.id };
	}

	if (transaction.status !== "SUCCESS") {
		await db
			.update(paymentTransaction)
			.set({
				status: "SUCCESS",
				gatewayStatus: verified.status,
				gatewayMessage: verified.gateway_response ?? "Paystack payment verified",
				gatewayTransactionId: verified.reference,
				receiptNumber: verified.reference,
				paidAmount: transaction.amount,
				paymentCountry,
				taxEvidence: {
					billingCountry: transaction.billingCountry,
					ipCountry: transaction.ipCountry,
					paymentCountry,
					mismatch: taxPolicy.evidenceMismatch,
				},
				rawResponse: verified as unknown as Record<string, unknown>,
				processedAt: verified.paid_at ? new Date(verified.paid_at) : now,
				updatedAt: now,
			})
			.where(eq(paymentTransaction.id, transaction.id));

		await db.insert(paymentTransactionActivityLog).values({
			id: crypto.randomUUID(),
			transactionId: transaction.id,
			userId: transaction.userId,
			action: "VERIFIED_SUCCESS",
			description: `Paystack payment verified. Reference: ${verified.reference}`,
			metadata: {
				reference: verified.reference,
				amountMinor: verified.amount,
				currency: verified.currency,
				channel: verified.channel,
			},
			ipAddress: null,
			userAgent: null,
			createdAt: now,
		});
	}

	await applySuccessfulPaymentToInvoiceSafe(transaction.id);
	await completeStorefrontOrderFromVerifiedPayment({
		checkoutRequestId: reference,
		userId: transaction.userId,
		teamId: transaction.teamId,
		metadata: transaction.metadata,
	});
	return { status: "SUCCESS", transactionId: transaction.id };
}
