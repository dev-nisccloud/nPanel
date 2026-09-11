/**
 * Create a NISC-style invoice for KRA OSCU sale #1, stamp the existing fiscal
 * signature, issue a KRA credit note, and write both PDFs.
 *
 * Run from apps/server (uses apps/server/.env, same as the Postman API):
 *   bun run src/scripts/kra-etims-golive-invoice.ts
 */
import * as crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import {
	creditNote,
	creditNoteActivityLog,
	creditNoteCounter,
	invoice,
	invoiceActivityLog,
	invoiceCounter,
	invoiceLineItem,
	invoiceTransaction,
} from "@npanel/db/schema/invoicing";
import { team } from "@npanel/db/schema/teams";
import { NISC_INVOICE_BANK_PAYMENT_DETAILS, NISC_INVOICE_FROM_DETAILS } from "@npanel/api/lib/nisc-order-auto-invoice";
import { COMPANY_LOGO_URL } from "@npanel/api/lib/company-branding";
import { getCreditNoteDetailForPdf } from "@npanel/api/lib/credit-note-for-pdf";
import { getEtimsContext } from "@npanel/api/lib/etims-config";
import { generateCreditNotePdfBuffer } from "@npanel/api/lib/generate-credit-note-pdf";
import { generateInvoicePdfBuffer } from "@npanel/api/lib/generate-invoice-pdf";
import { getInvoiceDetailForPdf } from "@npanel/api/lib/invoice-for-pdf";
import { sanitizeInvoicePdfFilename } from "@npanel/api/lib/invoice-pdf-data";
import {
	buildEtimsReceiptVerifyUrl,
	extractRcptSignFromKraResponse,
	parseKraSdcDateTime,
} from "@npanel/api/lib/etims-receipt-url";

const GOLIVE_META = { etimsGoliveSale1: true as const };
const SALE_INVC_NO = 1;
const SUBTOTAL = "1000.00";
const TAX = "160.00";
const TOTAL = "1160.00";
const TAX_PCT = 16;
const ISSUE_AT = new Date("2026-09-11T12:18:00+03:00");

const SALE_FISCAL = {
	resultCd: "000",
	resultMsg: "Successful",
	resultDt: "20260911122132",
	data: {
		curRcptNo: 1,
		totRcptNo: 1,
		intrlData: "CNU7XM6EMRCQAO6ODVVUTJR5EQ",
		rcptSign: "5AWILTL6HKHBQ754",
		sdcDateTime: "20260911122132",
	},
};

const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../tmp/etims-oscu-golive");

async function nextInvoiceNumber(): Promise<string> {
	const now = new Date();
	const rows = await db
		.insert(invoiceCounter)
		.values({ id: "invoice-counter", lastNumber: 1, updatedAt: now })
		.onConflictDoUpdate({
			target: invoiceCounter.id,
			set: { lastNumber: sql`${invoiceCounter.lastNumber} + 1`, updatedAt: now },
		})
		.returning({ lastNumber: invoiceCounter.lastNumber });
	return `INV-${String(rows[0]?.lastNumber ?? 1).padStart(4, "0")}`;
}

async function nextCreditNoteNumber(): Promise<string> {
	const now = new Date();
	for (let i = 0; i < 8; i++) {
		const rows = await db
			.insert(creditNoteCounter)
			.values({ id: "credit-note-counter", lastNumber: 1, updatedAt: now })
			.onConflictDoUpdate({
				target: creditNoteCounter.id,
				set: { lastNumber: sql`${creditNoteCounter.lastNumber} + 1`, updatedAt: now },
			})
			.returning({ lastNumber: creditNoteCounter.lastNumber });
		const n = rows[0]?.lastNumber ?? 1;
		if (n !== SALE_INVC_NO) return `CN-${String(n).padStart(4, "0")}`;
	}
	throw new Error("Could not allocate a credit-note number other than 1");
}

async function findActor() {
	const [agencyUser] = await db
		.select({ id: user.id, role: user.role })
		.from(user)
		.where(eq(user.role, "AGENCY_SUPER_ADMIN"))
		.limit(1);
	if (!agencyUser) {
		const [anyAgency] = await db
			.select({ id: user.id, role: user.role })
			.from(user)
			.limit(1);
		if (!anyAgency) throw new Error("No user found to own the invoice");
		return anyAgency;
	}
	return agencyUser;
}

async function findTeam() {
	const [row] = await db
		.select({ id: team.id, slug: team.slug, name: team.name })
		.from(team)
		.where(eq(team.isActive, true))
		.limit(1);
	if (!row) throw new Error("No active team found");
	return row;
}

function saleVerifyUrl(tin: string, bhfId: string) {
	return buildEtimsReceiptVerifyUrl({
		tin,
		bhfId,
		rcptSign: SALE_FISCAL.data.rcptSign,
		isSandbox: true,
	});
}

async function createInvoice(params: {
	teamId: string;
	createdBy: string;
	tin: string;
	bhfId: string;
}) {
	const existing = await db.query.invoice.findFirst({
		where: sql`(${invoice.metadata}->>'etimsGoliveSale1') = 'true'`,
	});
	if (existing) {
		console.log(`Reusing invoice ${existing.invoiceNumber} (${existing.id})`);
		return existing;
	}

	const invoiceId = crypto.randomUUID();
	const invoiceNumber = await nextInvoiceNumber();
	const now = new Date();
	const verifyUrl = saleVerifyUrl(params.tin, params.bhfId);

	await db.insert(invoice).values({
		id: invoiceId,
		token: crypto.randomUUID(),
		teamId: params.teamId,
		customerName: "Application Test Customer",
		customerEmail: "cert@nisccloud.com",
		invoiceNumber,
		status: "PAID",
		amount: TOTAL,
		subtotal: SUBTOTAL,
		tax: TAX,
		taxPercentage: TAX_PCT,
		currency: "KES",
		issueDate: ISSUE_AT,
		dueDate: null,
		paidAt: ISSUE_AT,
		sentAt: ISSUE_AT,
		amountPaid: TOTAL,
		amountRemaining: "0.00",
		creditBalance: "0.00",
		note: "OSCU verification sale",
		fromDetails: NISC_INVOICE_FROM_DETAILS,
		customerDetails: {
			name: "Application Test Customer",
			email: "cert@nisccloud.com",
			phone: "0700000000",
			address: "Nairobi",
			city: "Nairobi",
			country: "Kenya",
			taxId: "P600004455A",
		},
		paymentDetails: NISC_INVOICE_BANK_PAYMENT_DETAILS,
		template: { logoUrl: COMPANY_LOGO_URL },
		metadata: GOLIVE_META,
		createdBy: params.createdBy,
		updatedBy: params.createdBy,
		createdAt: now,
		updatedAt: now,
		kraInvoiceNumber: String(SALE_INVC_NO),
		kraReceiptNumber: "1",
		kraSignature: SALE_FISCAL.data.rcptSign,
		kraQrCode: verifyUrl,
		kraVerifiedDate: parseKraSdcDateTime(SALE_FISCAL.data.sdcDateTime),
		kraStatus: "SYNCED",
		kraError: null,
		kraSubmittedAt: ISSUE_AT,
		kraLastAttemptAt: now,
		kraAttemptCount: 1,
		kraVerificationUrl: verifyUrl,
		kraSyncPayload: {
			invcNo: SALE_INVC_NO,
			trdInvcNo: "CERT121920",
			source: "etims-oscu-sale-1",
		},
		kraSyncResponse: SALE_FISCAL,
	});

	await db.insert(invoiceLineItem).values({
		id: crypto.randomUUID(),
		invoiceId,
		position: 0,
		name: "nPanel Cert VAT16",
		description: "KE1NTBA0000001 · 1010150100 · Tax B · BA × NT",
		quantity: 1,
		unit: "BA",
		price: SUBTOTAL,
		total: SUBTOTAL,
		createdAt: now,
		updatedAt: now,
	});

	await db.insert(invoiceTransaction).values({
		id: crypto.randomUUID(),
		invoiceId,
		reference: "CERT121920",
		status: "COMPLETED",
		method: "CASH",
		amount: TOTAL,
		currency: "KES",
		paidAt: ISSUE_AT,
		notes: "KRA eTIMS OSCU verification sale",
		recordedBy: params.createdBy,
		balanceBefore: TOTAL,
		balanceAfter: "0.00",
		createdAt: now,
		updatedAt: now,
	});

	await db.insert(invoiceActivityLog).values({
		id: crypto.randomUUID(),
		invoiceId,
		userId: params.createdBy,
		action: "CREATE",
		description: `Go Live invoice from KRA sale #${SALE_INVC_NO}`,
		metadata: GOLIVE_META,
		createdAt: now,
	});

	console.log(`Created invoice ${invoiceNumber} (${invoiceId})`);
	const created = await db.query.invoice.findFirst({ where: eq(invoice.id, invoiceId) });
	if (!created) throw new Error("Invoice insert did not persist");
	return created;
}

function creditNoteBody(invcNo: number, creditNumber: string, tin: string) {
	// Use Kenya timestamps after sale #1 (12:21:32) and before typical "now".
	const cfmDt = "20260911122300";
	const salesDt = "20260911";
	console.log(`CN dates salesDt=${salesDt} cfmDt=${cfmDt} rfdDt=${cfmDt}`);
	return {
		trdInvcNo: creditNumber,
		invcNo,
		orgInvcNo: SALE_INVC_NO,
		custTin: tin,
		custNm: "Application Test Customer",
		salesTyCd: "N",
		rcptTyCd: "R",
		pmtTyCd: "01",
		salesSttsCd: "02",
		cfmDt,
		salesDt,
		stockRlsDt: cfmDt,
		rfdDt: cfmDt,
		rfdRsnCd: "06",
		totItemCnt: 1,
		taxblAmtA: 0,
		taxblAmtB: 1000,
		taxblAmtC: 0,
		taxblAmtD: 0,
		taxblAmtE: 0,
		taxRtA: 0,
		taxRtB: 16,
		taxRtC: 0,
		taxRtD: 0,
		taxRtE: 0,
		taxAmtA: 0,
		taxAmtB: 160,
		taxAmtC: 0,
		taxAmtD: 0,
		taxAmtE: 0,
		totTaxblAmt: 1000,
		totTaxAmt: 160,
		totAmt: 1160,
		prchrAcptcYn: "N",
		remark: "OSCU verification credit note",
		regrId: "Admin",
		regrNm: "Admin",
		modrId: "Admin",
		modrNm: "Admin",
		receipt: {
			custTin: tin,
			custMblNo: "0700000000",
			rcptPbctDt: cfmDt,
			trdeNm: "nPanel 3",
			adrs: "Nairobi",
			prchrAcptcYn: "N",
		},
		itemList: [
			{
				itemSeq: 1,
				itemCd: "KE1NTBA0000001",
				itemClsCd: "1010150100",
				itemNm: "nPanel Cert VAT16",
				pkgUnitCd: "NT",
				pkg: 1,
				qtyUnitCd: "BA",
				qty: 1,
				prc: 1160,
				splyAmt: 1160,
				dcRt: 0,
				dcAmt: 0,
				taxTyCd: "B",
				taxblAmt: 1000,
				taxAmt: 160,
				totAmt: 1160,
			},
		],
	};
}

async function ensureCreditNote(params: {
	invoiceId: string;
	invoiceNumber: string | null;
	teamId: string | null;
	createdBy: string;
}) {
	const existing = await db.query.creditNote.findFirst({
		where: eq(creditNote.invoiceId, params.invoiceId),
	});
	if (existing) {
		console.log(`Reusing credit note ${existing.creditNumber} (${existing.id})`);
		return existing;
	}

	const creditNoteId = crypto.randomUUID();
	const creditNumber = await nextCreditNoteNumber();
	const now = new Date();

	await db.insert(creditNote).values({
		id: creditNoteId,
		invoiceId: params.invoiceId,
		teamId: params.teamId,
		creditNumber,
		status: "ISSUED",
		amount: TOTAL,
		currency: "KES",
		reason: "Refund",
		note: "OSCU verification credit note",
		issuedAt: now,
		kraRefundReasonCode: "06",
		originalInvoiceNumber: params.invoiceNumber,
		createdBy: params.createdBy,
		updatedBy: params.createdBy,
		createdAt: now,
		updatedAt: now,
		kraStatus: "PENDING",
		kraAttemptCount: 0,
	});

	await db
		.update(invoice)
		.set({ creditedAmount: TOTAL, updatedAt: now })
		.where(eq(invoice.id, params.invoiceId));

	await db.insert(creditNoteActivityLog).values({
		id: crypto.randomUUID(),
		creditNoteId,
		userId: params.createdBy,
		action: "CREATE",
		description: `Issued credit note ${creditNumber}`,
		metadata: { rfdRsnCd: "06", orgInvcNo: SALE_INVC_NO },
		createdAt: now,
	});

	console.log(`Created credit note ${creditNumber} (${creditNoteId})`);
	const created = await db.query.creditNote.findFirst({ where: eq(creditNote.id, creditNoteId) });
	if (!created) throw new Error("Credit note insert did not persist");
	return created;
}

async function submitCreditNoteToKra(row: typeof creditNote.$inferSelect) {
	if (row.kraStatus === "SYNCED" || row.kraStatus === "VERIFIED") {
		console.log("Credit note already synced to KRA");
		return row;
	}

	const { client, oscu, isSandbox } = await getEtimsContext();
	let invcNo = 2;

	let lastError = "";
	for (let attempt = 0; attempt < 8; attempt++) {
		const payload = creditNoteBody(invcNo, row.creditNumber ?? `CN-${invcNo}`, oscu.tin);
		try {
			const response = await client.saveTrnsSalesOsdc(oscu, payload);
			const rcptSign = extractRcptSignFromKraResponse(response);
			const body = (response as { data?: Record<string, unknown> }).data;
			const curRcptNo = body?.curRcptNo != null ? String(body.curRcptNo) : null;
			const sdcDateTime = body?.sdcDateTime != null ? String(body.sdcDateTime) : null;
			const verificationUrl =
				rcptSign != null
					? buildEtimsReceiptVerifyUrl({
							tin: oscu.tin,
							bhfId: oscu.bhfId,
							rcptSign,
							isSandbox,
						})
					: null;
			const now = new Date();
			await db
				.update(creditNote)
				.set({
					kraStatus: "SYNCED",
					kraError: null,
					kraSubmittedAt: now,
					kraLastAttemptAt: now,
					kraAttemptCount: sql`${creditNote.kraAttemptCount} + 1`,
					kraSignature: rcptSign,
					kraReceiptNumber: curRcptNo,
					kraVerificationUrl: verificationUrl,
					kraQrCode: verificationUrl,
					kraVerifiedDate: parseKraSdcDateTime(sdcDateTime),
					kraInvoiceNumber: String(invcNo),
					kraSyncPayload: payload,
					kraSyncResponse: response,
					updatedAt: now,
				})
				.where(eq(creditNote.id, row.id));
			console.log(`Credit note signed by KRA as invcNo ${invcNo} rcptSign=${rcptSign}`);
			const updated = await db.query.creditNote.findFirst({ where: eq(creditNote.id, row.id) });
			if (!updated) throw new Error("Credit note KRA stamp did not persist");
			return updated;
		} catch (err) {
			lastError = err instanceof Error ? err.message : String(err);
			console.warn(`KRA credit note invcNo=${invcNo} failed: ${lastError}`);
			const expected = lastError.match(/expected:\s*(\d+)\s+but\s+found/i);
			if (expected) {
				invcNo = Number(expected[1]);
				continue;
			}
			if (/invoice number already exists/i.test(lastError)) {
				invcNo += 1;
				continue;
			}
			await db
				.update(creditNote)
				.set({
					kraStatus: "FAILED",
					kraError: lastError.slice(0, 2000),
					kraLastAttemptAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(creditNote.id, row.id));
			throw err;
		}
	}
	throw new Error(lastError || "KRA credit note failed");
}

async function main() {
	const actor = await findActor();
	const teamRow = await findTeam();
	const { oscu } = await getEtimsContext();

	const inv = await createInvoice({
		teamId: teamRow.id,
		createdBy: actor.id,
		tin: oscu.tin,
		bhfId: oscu.bhfId,
	});

	const cn = await ensureCreditNote({
		invoiceId: inv.id,
		invoiceNumber: inv.invoiceNumber,
		teamId: inv.teamId,
		createdBy: actor.id,
	});
	await submitCreditNoteToKra(cn);

	await mkdir(OUT_DIR, { recursive: true });

	const invoiceDetail = await getInvoiceDetailForPdf(db, inv.id);
	const invoicePdf = await generateInvoicePdfBuffer(invoiceDetail);
	const invoiceName = sanitizeInvoicePdfFilename(inv.invoiceNumber ?? "INV-0001");
	const invoicePath = path.join(OUT_DIR, invoiceName);
	await writeFile(invoicePath, invoicePdf);

	const creditDetail = await getCreditNoteDetailForPdf(db, cn.id);
	const creditPdf = await generateCreditNotePdfBuffer(creditDetail);
	const creditName = sanitizeInvoicePdfFilename(cn.creditNumber ?? "CN-0002").replace(/^INV/i, "CN");
	const creditPath = path.join(OUT_DIR, creditName.startsWith("CN") ? creditName : `CN-${creditName}`);
	await writeFile(creditPath, creditPdf);

	console.log("\nDone.");
	console.log(`Team: ${teamRow.name} (${teamRow.slug})`);
	console.log(`Invoice UI: /agency/invoices/${inv.id}`);
	console.log(`Credit note UI: /agency/invoices/credit-notes/${cn.id}`);
	console.log(`Invoice PDF: ${invoicePath}`);
	console.log(`Credit note PDF: ${creditPath}`);
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
