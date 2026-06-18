import { and, eq, isNull, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice } from "@npanel/db/schema/invoicing";
import { getEtimsContext } from "./etims-config";
import {
	buildEtimsReceiptVerifyUrl,
	extractRcptSignFromKraResponse,
	parseKraSdcDateTime,
} from "./etims-receipt-url";
import { buildKraSalesTransactionForInvoice } from "./invoice-kra-mapper";
import {
	isInvoiceKraAwaitingSync,
	isInvoiceKraInFlight,
	isInvoiceKraSynced,
} from "./invoice-kra-status";

export type InvoiceKraSyncResult =
	| { ok: true; invoiceId: string; kraStatus: "SYNCED" }
	| { ok: false; invoiceId: string; kraStatus: "FAILED" | "SKIPPED"; reason: string }
	| { ok: false; invoiceId: string; skipped: true; reason: string };

async function markInvoiceKraSkipped(invoiceId: string, reason: string): Promise<void> {
	const now = new Date();
	await db
		.update(invoice)
		.set({
			kraStatus: "SKIPPED",
			kraError: reason.slice(0, 2000),
			kraLastAttemptAt: now,
			updatedAt: now,
		})
		.where(eq(invoice.id, invoiceId));
}

async function markInvoiceKraFailed(
	invoiceId: string,
	reason: string,
	payload: unknown,
	response: unknown,
): Promise<void> {
	const now = new Date();
	await db
		.update(invoice)
		.set({
			kraStatus: "FAILED",
			kraError: reason.slice(0, 2000),
			kraSyncPayload: payload ?? null,
			kraSyncResponse: response ?? null,
			kraLastAttemptAt: now,
			updatedAt: now,
		})
		.where(eq(invoice.id, invoiceId));
}

async function markInvoiceKraSynced(
	invoiceId: string,
	payload: unknown,
	response: unknown,
	fields: {
		kraSignature: string | null;
		kraReceiptNumber: string | null;
		kraVerificationUrl: string | null;
		kraVerifiedDate: Date | null;
		kraInvoiceNumber: string | null;
	},
): Promise<void> {
	const now = new Date();
	await db
		.update(invoice)
		.set({
			kraStatus: "SYNCED",
			kraError: null,
			kraSubmittedAt: now,
			kraLastAttemptAt: now,
			kraSyncPayload: payload ?? null,
			kraSyncResponse: response ?? null,
			kraSignature: fields.kraSignature,
			kraReceiptNumber: fields.kraReceiptNumber,
			kraVerificationUrl: fields.kraVerificationUrl,
			kraQrCode: fields.kraVerificationUrl,
			kraVerifiedDate: fields.kraVerifiedDate,
			kraInvoiceNumber: fields.kraInvoiceNumber,
			updatedAt: now,
		})
		.where(eq(invoice.id, invoiceId));
}

/**
 * Submit one invoice to KRA eTIMS (saveTrnsSalesOsdc). Called by the QStash worker.
 */
export async function processInvoiceKraSync(invoiceId: string): Promise<InvoiceKraSyncResult> {
	const row = await db.query.invoice.findFirst({
		where: eq(invoice.id, invoiceId),
		columns: {
			id: true,
			kraStatus: true,
			status: true,
			invoiceNumber: true,
		},
	});

	if (!row) {
		return { ok: false, invoiceId, skipped: true, reason: "Invoice not found" };
	}

	if (isInvoiceKraSynced(row.kraStatus)) {
		return { ok: false, invoiceId, skipped: true, reason: "Already synced to KRA" };
	}

	if (isInvoiceKraInFlight(row.kraStatus)) {
		return { ok: false, invoiceId, skipped: true, reason: "KRA sync already in progress" };
	}

	if (!isInvoiceKraAwaitingSync(row.kraStatus) && row.kraStatus != null) {
		return {
			ok: false,
			invoiceId,
			skipped: true,
			reason: `KRA status ${row.kraStatus} is not eligible for sync`,
		};
	}

	const now = new Date();
	const claimed = await db
		.update(invoice)
		.set({
			kraStatus: "SUBMITTING",
			kraLastAttemptAt: now,
			kraAttemptCount: sql`${invoice.kraAttemptCount} + 1`,
			updatedAt: now,
		})
		.where(
			and(
				eq(invoice.id, invoiceId),
				or(
					eq(invoice.kraStatus, "PENDING"),
					eq(invoice.kraStatus, "FAILED"),
					isNull(invoice.kraStatus),
				),
			),
		)
		.returning({ id: invoice.id });

	if (claimed.length === 0) {
		return { ok: false, invoiceId, skipped: true, reason: "Could not claim invoice for KRA sync" };
	}

	let etimsContext: Awaited<ReturnType<typeof getEtimsContext>>;
	try {
		etimsContext = await getEtimsContext();
	} catch (err) {
		const reason =
			err instanceof Error ? err.message : "eTIMS is not configured";
		await markInvoiceKraSkipped(invoiceId, reason);
		return { ok: false, invoiceId, kraStatus: "SKIPPED", reason };
	}

	const built = await buildKraSalesTransactionForInvoice(invoiceId);
	if (!built.ok) {
		await markInvoiceKraSkipped(invoiceId, built.reason);
		return { ok: false, invoiceId, kraStatus: "SKIPPED", reason: built.reason };
	}

	const payload = built.transaction;

	try {
		const response = await etimsContext.client.saveTrnsSalesOsdc(
			etimsContext.oscu,
			payload as Record<string, unknown>,
		);

		const rcptSign = extractRcptSignFromKraResponse(response);
		const body = (response as Record<string, unknown>).data as Record<string, unknown> | undefined;
		const curRcptNo = body?.curRcptNo != null ? String(body.curRcptNo) : null;
		const sdcDateTime =
			body?.sdcDateTime != null ? String(body.sdcDateTime) : null;
		const verificationUrl =
			rcptSign != null
				? buildEtimsReceiptVerifyUrl({
						tin: etimsContext.oscu.tin,
						bhfId: etimsContext.oscu.bhfId,
						rcptSign,
						isSandbox: etimsContext.isSandbox,
					})
				: null;

		await markInvoiceKraSynced(invoiceId, payload, response, {
			kraSignature: rcptSign,
			kraReceiptNumber: curRcptNo,
			kraVerificationUrl: verificationUrl,
			kraVerifiedDate: parseKraSdcDateTime(sdcDateTime),
			kraInvoiceNumber: String(payload.invcNo),
		});

		return { ok: true, invoiceId, kraStatus: "SYNCED" };
	} catch (err) {
		const reason = err instanceof Error ? err.message : "KRA submission failed";
		console.warn("[invoice-kra-sync] submission failed:", invoiceId, reason);
		await markInvoiceKraFailed(invoiceId, reason, payload, null);
		return { ok: false, invoiceId, kraStatus: "FAILED", reason };
	}
}

export type EnsureInvoiceKraSyncedResult =
	| { ok: true; invoiceId: string; alreadySynced: boolean }
	| { ok: false; invoiceId: string; kraStatus: string; reason: string };

/**
 * Blocks invoice delivery until KRA accepts the sale. Safe to call when invoice already SYNCED.
 */
export async function ensureInvoiceKraSyncedForDelivery(
	invoiceId: string,
): Promise<EnsureInvoiceKraSyncedResult> {
	const row = await db.query.invoice.findFirst({
		where: eq(invoice.id, invoiceId),
		columns: { id: true, kraStatus: true },
	});

	if (!row) {
		return { ok: false, invoiceId, kraStatus: "UNKNOWN", reason: "Invoice not found" };
	}

	if (isInvoiceKraSynced(row.kraStatus)) {
		return { ok: true, invoiceId, alreadySynced: true };
	}

	const result = await processInvoiceKraSync(invoiceId);

	if (result.ok && result.kraStatus === "SYNCED") {
		return { ok: true, invoiceId, alreadySynced: false };
	}

	if ("skipped" in result && result.skipped) {
		const after = await db.query.invoice.findFirst({
			where: eq(invoice.id, invoiceId),
			columns: { kraStatus: true },
		});
		return {
			ok: false,
			invoiceId,
			kraStatus: after?.kraStatus ?? "SKIPPED",
			reason: result.reason,
		};
	}

	return {
		ok: false,
		invoiceId,
		kraStatus: "kraStatus" in result ? result.kraStatus : "FAILED",
		reason: "reason" in result ? result.reason : "KRA sync failed",
	};
}
