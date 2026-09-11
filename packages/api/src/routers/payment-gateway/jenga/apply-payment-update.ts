import { randomUUID } from "node:crypto";
import {
	isLocalDevOrigin,
	resolveLandingPageOrigins,
} from "@npanel/auth/landing-page-origins";
import { and, eq, or } from "@npanel/db";
import { db } from "@npanel/db";
import {
	paymentTransaction,
	paymentTransactionActivityLog,
} from "@npanel/db/schema/payment-transactions";
import type { JengaCallbackQuery, JengaIpnPayload, JengaPaymentMetadata } from "./types";
import { applySuccessfulPaymentToInvoiceSafe } from "../../../lib/invoice-apply-gateway-payment";

type ApplyResult =
	| { ok: true; alreadyTerminal: boolean; transactionId: string; status: string }
	| { ok: false; reason: string };

/**
 * Apply browser callback (GET redirect) to payment_transaction.
 * Success when status === "paid" (per Jenga docs).
 */
export async function applyJengaCallbackUpdate(
	query: JengaCallbackQuery,
): Promise<ApplyResult> {
	const orderReference = query.orderReference?.trim();
	if (!orderReference) {
		return { ok: false, reason: "Missing orderReference" };
	}

	const transaction = await db.query.paymentTransaction.findFirst({
		where: and(
			eq(paymentTransaction.checkoutRequestId, orderReference),
			eq(paymentTransaction.gateway, "JENGA"),
		),
	});

	if (!transaction) {
		return { ok: false, reason: "Transaction not found" };
	}

	if (transaction.status === "SUCCESS" || transaction.status === "FAILED") {
		if (transaction.status === "SUCCESS") {
			await applySuccessfulPaymentToInvoiceSafe(transaction.id);
		}
		return {
			ok: true,
			alreadyTerminal: true,
			transactionId: transaction.id,
			status: transaction.status,
		};
	}

	const now = new Date();
	const isPaid = query.status === "paid";
	const nextStatus = isPaid ? "SUCCESS" : "FAILED";

	await db
		.update(paymentTransaction)
		.set({
			status: nextStatus,
			gatewayStatus: query.status ?? null,
			gatewayMessage: query.desc ?? null,
			gatewayTransactionId: query.transactionId ?? null,
			receiptNumber: query.transactionId ?? null,
			paidAmount: isPaid && query.amount ? query.amount : transaction.paidAmount,
			rawResponse: query as unknown as Record<string, unknown>,
			processedAt: isPaid ? now : transaction.processedAt,
			failedAt: isPaid ? transaction.failedAt : now,
			updatedAt: now,
		})
		.where(eq(paymentTransaction.id, transaction.id));

	await db.insert(paymentTransactionActivityLog).values({
		id: randomUUID(),
		transactionId: transaction.id,
		userId: transaction.userId,
		action: isPaid ? "CALLBACK_SUCCESS" : "CALLBACK_FAILED",
		description: isPaid
			? `Jenga callback: paid. TransactionId: ${query.transactionId ?? "n/a"}`
			: `Jenga callback: not paid (status=${query.status ?? "unknown"})`,
		metadata: {
			orderReference,
			transactionId: query.transactionId,
			status: query.status,
			amount: query.amount,
			desc: query.desc,
		},
		ipAddress: null,
		userAgent: null,
		createdAt: now,
	});

	if (isPaid) {
		await applySuccessfulPaymentToInvoiceSafe(transaction.id);
	}

	return {
		ok: true,
		alreadyTerminal: false,
		transactionId: transaction.id,
		status: nextStatus,
	};
}

/**
 * Apply IPN webhook to payment_transaction (durable source of truth).
 * Matches by billNumber (order reference) or customer.reference when present.
 */
export async function applyJengaIpnUpdate(payload: JengaIpnPayload): Promise<ApplyResult> {
	const billNumber = payload.transaction.billNumber?.trim() || "";
	const customerRef = payload.customer.reference?.trim() || "";
	const candidates = [...new Set([billNumber, customerRef].filter(Boolean))];

	if (candidates.length === 0) {
		return { ok: false, reason: "Missing billNumber/order reference in IPN" };
	}

	// Jenga sample IPN: billNumber + customer.reference  match either against our orderReference
	const transaction = await db.query.paymentTransaction.findFirst({
		where: and(
			eq(paymentTransaction.gateway, "JENGA"),
			or(
				...candidates.flatMap((ref) => [
					eq(paymentTransaction.checkoutRequestId, ref),
					eq(paymentTransaction.accountReference, ref),
				]),
			),
		),
	});

	if (!transaction) {
		return {
			ok: false,
			reason: `Transaction not found for refs: ${candidates.join(", ")}`,
		};
	}

	const orderReference =
		transaction.checkoutRequestId || transaction.accountReference || candidates[0]!;

	if (transaction.status === "SUCCESS" || transaction.status === "FAILED") {
		// Allow IPN to upgrade FAILED→SUCCESS if callback raced incorrectly
		if (
			transaction.status === "FAILED" &&
			payload.transaction.status === "SUCCESS"
		) {
			// fall through
		} else {
			if (transaction.status === "SUCCESS") {
				await applySuccessfulPaymentToInvoiceSafe(transaction.id);
			}
			return {
				ok: true,
				alreadyTerminal: true,
				transactionId: transaction.id,
				status: transaction.status,
			};
		}
	}

	const now = new Date();
	const isSuccess = payload.transaction.status === "SUCCESS";
	const nextStatus = isSuccess ? "SUCCESS" : "FAILED";
	const paidAmountNum = Number(payload.transaction.amount);

	await db
		.update(paymentTransaction)
		.set({
			status: nextStatus,
			gatewayStatus: payload.transaction.status,
			gatewayMessage: payload.transaction.remarks ?? payload.transaction.paymentMode,
			gatewayTransactionId: payload.transaction.reference,
			receiptNumber: payload.bank.reference || payload.transaction.reference,
			paidAmount: isSuccess && Number.isFinite(paidAmountNum)
				? String(paidAmountNum)
				: transaction.paidAmount,
			rawResponse: payload as unknown as Record<string, unknown>,
			processedAt: isSuccess ? now : transaction.processedAt,
			failedAt: isSuccess ? null : now,
			updatedAt: now,
		})
		.where(eq(paymentTransaction.id, transaction.id));

	await db.insert(paymentTransactionActivityLog).values({
		id: randomUUID(),
		transactionId: transaction.id,
		userId: transaction.userId,
		action: isSuccess ? "IPN_SUCCESS" : "IPN_FAILED",
		description: isSuccess
			? `Jenga IPN SUCCESS. Ref: ${payload.transaction.reference}`
			: `Jenga IPN FAILED. ${payload.transaction.remarks ?? ""}`,
		metadata: {
			orderReference,
			transactionReference: payload.transaction.reference,
			bankReference: payload.bank.reference,
			amount: payload.transaction.amount,
			paymentMode: payload.transaction.paymentMode,
			status: payload.transaction.status,
		},
		ipAddress: null,
		userAgent: null,
		createdAt: now,
	});

	if (isSuccess) {
		await applySuccessfulPaymentToInvoiceSafe(transaction.id);
	}

	return {
		ok: true,
		alreadyTerminal: false,
		transactionId: transaction.id,
		status: nextStatus,
	};
}

export function parseJengaMetadata(
	raw: unknown,
): JengaPaymentMetadata | null {
	if (!raw || typeof raw !== "object") return null;
	const meta = raw as JengaPaymentMetadata;
	if (!meta.orderReference) return null;
	return meta;
}

function normalizeOrigin(url: string): string {
	return url.trim().replace(/\/+$/, "");
}

/** Origins allowed for post-Jenga browser redirects (open-redirect guard). */
function isAllowedJengaReturnOrigin(origin: string): boolean {
	const normalized = normalizeOrigin(origin);
	try {
		const { protocol } = new URL(normalized);
		if (protocol !== "http:" && protocol !== "https:") return false;
	} catch {
		return false;
	}

	const allowed = new Set<string>();
	const add = (raw: string | undefined) => {
		if (!raw?.trim()) return;
		try {
			allowed.add(normalizeOrigin(new URL(raw.trim()).origin));
		} catch {
			// ignore invalid
		}
	};

	add(process.env.CORS_ORIGIN);
	add(process.env.VITE_PUBLIC_APP_URL);
	for (const o of resolveLandingPageOrigins()) {
		add(o);
	}
	const extra = process.env.CORS_EXTRA_ORIGINS;
	if (extra) {
		for (const part of extra.split(",")) add(part);
	}

	if (allowed.has(normalized)) return true;
	if (process.env.NODE_ENV !== "production" && isLocalDevOrigin(normalized)) {
		return true;
	}
	return false;
}

function resolveFallbackOrigin(source: JengaPaymentMetadata["source"] | undefined): string {
	if (source === "storefront") {
		return (
			resolveLandingPageOrigins()[0] ||
			"http://localhost:5173"
		);
	}
	return (
		process.env.VITE_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ||
		process.env.CORS_ORIGIN?.trim().replace(/\/+$/, "") ||
		"http://localhost:3002"
	);
}

/**
 * Redirect the browser back to where checkout started (returnOrigin + returnPath
 * stored on the payment). No WEB_APP_URL / STOREFRONT_APP_URL required.
 */
export function getJengaReturnRedirect(params: {
	metadata: JengaPaymentMetadata | null;
	orderReference: string;
	status: string;
}): string {
	const source = params.metadata?.source;
	const isStorefront = source === "storefront";
	const fallbackPath = isStorefront ? "/cart" : "/payment/card/return";
	const returnPath =
		params.metadata?.returnPath?.startsWith("/") &&
		!params.metadata.returnPath.startsWith("//")
			? params.metadata.returnPath
			: fallbackPath;

	let origin = params.metadata?.returnOrigin?.trim() || "";
	if (!origin || !isAllowedJengaReturnOrigin(origin)) {
		origin = resolveFallbackOrigin(source);
	} else {
		origin = normalizeOrigin(origin);
	}

	const url = new URL(returnPath, origin.endsWith("/") ? origin : `${origin}/`);
	if (isStorefront) {
		url.searchParams.set("cardRef", params.orderReference);
		url.searchParams.set("cardStatus", params.status);
	} else {
		url.searchParams.set("orderReference", params.orderReference);
		url.searchParams.set("status", params.status);
	}
	return url.toString();
}
