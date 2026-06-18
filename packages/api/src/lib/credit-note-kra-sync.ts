import { and, eq, isNull, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { creditNote, invoice } from "@npanel/db/schema/invoicing";
import { getEtimsContext } from "./etims-config";
import {
	buildEtimsReceiptVerifyUrl,
	extractRcptSignFromKraResponse,
	parseKraSdcDateTime,
} from "./etims-receipt-url";
import {
	buildKraCreditNoteTransactionForInvoice,
	type KraRefundReasonCode,
} from "./invoice-kra-mapper";
import { isInvoiceKraSynced } from "./invoice-kra-status";

export type CreditNoteKraSyncResult =
	| { ok: true; creditNoteId: string; kraStatus: "SYNCED" }
	| { ok: false; creditNoteId: string; kraStatus: "FAILED" | "SKIPPED"; reason: string }
	| { ok: false; creditNoteId: string; skipped: true; reason: string };

async function markCreditNoteKraFailed(
	creditNoteId: string,
	reason: string,
	payload: unknown,
	response: unknown,
): Promise<void> {
	const now = new Date();
	await db
		.update(creditNote)
		.set({
			kraStatus: "FAILED",
			kraError: reason.slice(0, 2000),
			kraSyncPayload: payload ?? null,
			kraSyncResponse: response ?? null,
			kraLastAttemptAt: now,
			updatedAt: now,
		})
		.where(eq(creditNote.id, creditNoteId));
}

async function markCreditNoteKraSynced(
	creditNoteId: string,
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
		.update(creditNote)
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
		.where(eq(creditNote.id, creditNoteId));
}

export async function processCreditNoteKraSync(creditNoteId: string): Promise<CreditNoteKraSyncResult> {
	const row = await db.query.creditNote.findFirst({
		where: eq(creditNote.id, creditNoteId),
		columns: {
			id: true,
			invoiceId: true,
			kraStatus: true,
			kraRefundReasonCode: true,
		},
	});

	if (!row) {
		return { ok: false, creditNoteId, skipped: true, reason: "Credit note not found" };
	}

	if (row.kraStatus === "SYNCED" || row.kraStatus === "VERIFIED") {
		return { ok: false, creditNoteId, skipped: true, reason: "Already synced to KRA" };
	}

	if (row.kraStatus === "SUBMITTING") {
		return { ok: false, creditNoteId, skipped: true, reason: "KRA sync already in progress" };
	}

	const rfdRsnCd = row.kraRefundReasonCode as KraRefundReasonCode | null;
	if (!rfdRsnCd || !["01", "02", "03", "04", "05", "06"].includes(rfdRsnCd)) {
		return {
			ok: false,
			creditNoteId,
			kraStatus: "SKIPPED",
			reason: "Credit note is missing a valid KRA refund reason code",
		};
	}

	const inv = await db.query.invoice.findFirst({
		where: eq(invoice.id, row.invoiceId),
		columns: { kraStatus: true },
	});
	if (!inv || !isInvoiceKraSynced(inv.kraStatus)) {
		return {
			ok: false,
			creditNoteId,
			kraStatus: "SKIPPED",
			reason: "Original invoice must be synced to KRA before credit note submission",
		};
	}

	const now = new Date();
	const claimed = await db
		.update(creditNote)
		.set({
			kraStatus: "SUBMITTING",
			kraLastAttemptAt: now,
			kraAttemptCount: sql`${creditNote.kraAttemptCount} + 1`,
			updatedAt: now,
		})
		.where(
			and(
				eq(creditNote.id, creditNoteId),
				or(
					eq(creditNote.kraStatus, "PENDING"),
					eq(creditNote.kraStatus, "FAILED"),
					isNull(creditNote.kraStatus),
				),
			),
		)
		.returning({ id: creditNote.id });

	if (claimed.length === 0) {
		return { ok: false, creditNoteId, skipped: true, reason: "Could not claim credit note for KRA sync" };
	}

	let etimsContext: Awaited<ReturnType<typeof getEtimsContext>>;
	try {
		etimsContext = await getEtimsContext();
	} catch (err) {
		const reason = err instanceof Error ? err.message : "eTIMS is not configured";
		await db
			.update(creditNote)
			.set({ kraStatus: "SKIPPED", kraError: reason.slice(0, 2000), updatedAt: new Date() })
			.where(eq(creditNote.id, creditNoteId));
		return { ok: false, creditNoteId, kraStatus: "SKIPPED", reason };
	}

	const built = await buildKraCreditNoteTransactionForInvoice(row.invoiceId, creditNoteId, rfdRsnCd);
	if (!built.ok) {
		await db
			.update(creditNote)
			.set({
				kraStatus: "SKIPPED",
				kraError: built.reason.slice(0, 2000),
				kraLastAttemptAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(creditNote.id, creditNoteId));
		return { ok: false, creditNoteId, kraStatus: "SKIPPED", reason: built.reason };
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
		const sdcDateTime = body?.sdcDateTime != null ? String(body.sdcDateTime) : null;
		const verificationUrl =
			rcptSign != null
				? buildEtimsReceiptVerifyUrl({
						tin: etimsContext.oscu.tin,
						bhfId: etimsContext.oscu.bhfId,
						rcptSign,
						isSandbox: etimsContext.isSandbox,
					})
				: null;

		await markCreditNoteKraSynced(creditNoteId, payload, response, {
			kraSignature: rcptSign,
			kraReceiptNumber: curRcptNo,
			kraVerificationUrl: verificationUrl,
			kraVerifiedDate: parseKraSdcDateTime(sdcDateTime),
			kraInvoiceNumber: String(payload.invcNo),
		});

		return { ok: true, creditNoteId, kraStatus: "SYNCED" };
	} catch (err) {
		const reason = err instanceof Error ? err.message : "KRA credit note submission failed";
		await markCreditNoteKraFailed(creditNoteId, reason, payload, null);
		return { ok: false, creditNoteId, kraStatus: "FAILED", reason };
	}
}
