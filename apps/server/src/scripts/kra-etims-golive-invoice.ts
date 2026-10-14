/**
 * Stamp the cert OSCU sale/credit-note with the KRA SCU datetime as returned,
 * then write TIS PDFs (ISSUED / SCU / TIS all print that full stamp).
 *
 *   bun run etims:golive-invoice
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
import { generateCreditNotePdfBuffer } from "@npanel/api/lib/generate-credit-note-pdf";
import { generateInvoicePdfBuffer } from "@npanel/api/lib/generate-invoice-pdf";
import { getInvoiceDetailForPdf } from "@npanel/api/lib/invoice-for-pdf";
import { sanitizeInvoicePdfFilename } from "@npanel/api/lib/invoice-pdf-data";
import { buildEtimsReceiptVerifyUrl, parseKraSdcDateTime } from "@npanel/api/lib/etims-receipt-url";
import { formatKraSdcDateTimeFull } from "@npanel/api/lib/etims-scu-print";

const GOLIVE_META = { etimsGoliveSale1: true as const };
let CERT_TIN = process.env.ETIMS_CERT_APP_TEST_PIN?.trim() || "P600005001A";
let CERT_BHF_ID = process.env.ETIMS_CERT_BHF_ID?.trim() || "00";
const SDC_ID = "KRACU0400001023";
let SALE_INVC_NO = 1;
let CN_INVC_NO = 2;
const SUBTOTAL = "1000.00";
const TAX = "160.00";
const TOTAL = "1160.00";
const TAX_PCT = 16;
const NGROK = process.env.ETIMS_CERT_NGROK_URL ?? "https://loverlike-cinderella-signatureless.ngrok-free.dev";

/** Filled from live `etimsCert.sales.getInvoiceDetails` (this cert session). */
const SALE_FISCAL = {
	resultCd: "000",
	resultMsg: "Successful",
	data: {
		sdcId: SDC_ID,
		curRcptNo: "1",
		totRcptNo: "1",
		intrlData: "",
		rcptSign: "",
		sdcDateTime: "",
	},
};

/** Filled from live `etimsCert.sales.getInvoiceDetails` for the credit note. */
const CN_FISCAL = {
	resultCd: "000",
	resultMsg: "Successful",
	data: {
		sdcId: SDC_ID,
		curRcptNo: "2",
		totRcptNo: "2",
		intrlData: "",
		rcptSign: "",
		sdcDateTime: "",
	},
};

const SALE_ISSUE_AT = parseKraSdcDateTime(SALE_FISCAL.data.sdcDateTime) ?? new Date("2026-09-30T14:56:38+03:00");
const CN_ISSUE_AT = parseKraSdcDateTime(CN_FISCAL.data.sdcDateTime) ?? new Date("2026-09-30T15:01:11+03:00");

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
		const [anyAgency] = await db.select({ id: user.id, role: user.role }).from(user).limit(1);
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

function saleVerifyUrl() {
	return buildEtimsReceiptVerifyUrl({
		tin: CERT_TIN,
		bhfId: CERT_BHF_ID,
		rcptSign: SALE_FISCAL.data.rcptSign,
		isSandbox: true,
	});
}

function cnVerifyUrl() {
	return buildEtimsReceiptVerifyUrl({
		tin: CERT_TIN,
		bhfId: CERT_BHF_ID,
		rcptSign: CN_FISCAL.data.rcptSign,
		isSandbox: true,
	});
}

function saleKraFields() {
	const verifyUrl = saleVerifyUrl();
	const issueAt = parseKraSdcDateTime(SALE_FISCAL.data.sdcDateTime) ?? SALE_ISSUE_AT;
	return {
		issueDate: issueAt,
		paidAt: issueAt,
		sentAt: issueAt,
		kraInvoiceNumber: String(SALE_INVC_NO),
		kraReceiptNumber: String(SALE_FISCAL.data.curRcptNo),
		kraSignature: SALE_FISCAL.data.rcptSign,
		kraQrCode: verifyUrl,
		kraVerifiedDate: issueAt,
		kraStatus: "SYNCED" as const,
		kraError: null,
		kraSubmittedAt: issueAt,
		kraVerificationUrl: verifyUrl,
		kraSyncPayload: {
			invcNo: SALE_INVC_NO,
			trdInvcNo: `CERT${String(SALE_INVC_NO).padStart(4, "0")}`,
			tin: CERT_TIN,
			bhfId: CERT_BHF_ID,
			source: "etims-oscu-golive",
			sdcId: SALE_FISCAL.data.sdcId,
		},
		kraSyncResponse: SALE_FISCAL,
	};
}

async function trpcGet(procedure: string, input?: unknown) {
	let url = `${NGROK}/trpc/${procedure}`;
	if (input !== undefined) url += `?input=${encodeURIComponent(JSON.stringify(input))}`;
	const res = await fetch(url, { headers: { "ngrok-skip-browser-warning": "1" } });
	return (await res.json()) as Record<string, unknown>;
}

function pickJsonString(text: string, key: string): string | null {
	const quoted = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
	if (quoted?.[1]) return quoted[1];
	const num = text.match(new RegExp(`"${key}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`));
	return num?.[1] ?? null;
}

function salesRows(json: unknown): Array<Record<string, unknown>> {
	const walk = (v: unknown, depth: number): unknown[] => {
		if (depth > 8 || !v || typeof v !== "object") return [];
		const r = v as Record<string, unknown>;
		for (const k of ["salesList", "saleList", "itemList"]) {
			if (Array.isArray(r[k])) return r[k] as unknown[];
		}
		for (const k of ["data", "result", "responseBody", "json"]) {
			const n = walk(r[k], depth + 1);
			if (n.length) return n;
		}
		return [];
	};
	return walk(json, 0).filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
}

async function overlayFromKra(invcNo: number, fallback: typeof SALE_FISCAL) {
	try {
		const json = await trpcGet("etimsCert.sales.getInvoiceDetails", { invcNo });
		const text = JSON.stringify(json);
		const sdc = pickJsonString(text, "sdcDateTime");
		const sign = pickJsonString(text, "rcptSign");
		const intra = pickJsonString(text, "intrlData");
		const sdcId = pickJsonString(text, "sdcId");
		const cur = pickJsonString(text, "curRcptNo");
		const tot = pickJsonString(text, "totRcptNo");
		if (sdc) {
			fallback.data.sdcDateTime = sdc;
			console.log(`KRA invcNo ${invcNo} sdcDateTime=${sdc}`);
		}
		if (sign) fallback.data.rcptSign = sign;
		if (intra) fallback.data.intrlData = intra;
		if (sdcId) fallback.data.sdcId = sdcId;
		if (cur) fallback.data.curRcptNo = cur;
		if (tot) fallback.data.totRcptNo = tot;
		if (!fallback.data.rcptSign) {
			throw new Error(`KRA invcNo ${invcNo} returned no rcptSign`);
		}
		console.log(`KRA invcNo ${invcNo} rcptSign=${fallback.data.rcptSign} sdcId=${fallback.data.sdcId}`);
	} catch (err) {
		throw new Error(
			`Could not refresh invcNo ${invcNo} from ngrok: ${err instanceof Error ? err.message : String(err)}`,
		);
	}
}

async function loadCertSession() {
	try {
		const cfgJson = await trpcGet("etimsCert.auth.getConfiguration");
		const cfgText = JSON.stringify(cfgJson);
		const tin = pickJsonString(cfgText, "kraPin");
		const bhf = pickJsonString(cfgText, "branchId");
		if (tin) CERT_TIN = tin;
		if (bhf) CERT_BHF_ID = bhf;
		const salesJson = await trpcGet("etimsCert.sales.getSalesTransactions", { lastReqDt: "20180101000000" });
		const rows = salesRows(salesJson);
		const sale = rows.find((r) => String(r.rcptTyCd ?? "S").toUpperCase() !== "R" && String(r.salesTyCd ?? "N").toUpperCase() !== "C");
		const cn = rows.find((r) => String(r.rcptTyCd ?? "").toUpperCase() === "R");
		if (sale?.invcNo != null) SALE_INVC_NO = Number(sale.invcNo);
		if (cn?.invcNo != null) CN_INVC_NO = Number(cn.invcNo);
	} catch (err) {
		console.warn(`Could not load cert session: ${err instanceof Error ? err.message : String(err)}`);
	}
	console.log(`Cert TIN=${CERT_TIN} bhf=${CERT_BHF_ID} sale=#${SALE_INVC_NO} credit=#${CN_INVC_NO}`);
}

function assertSandboxQr(kind: string, url: string | null) {
	const expectedPrefix = `https://etims-sbx.kra.go.ke/common/link/etims/receipt/indexEtimsReceiptData?Data=${CERT_TIN}${CERT_BHF_ID}`;
	if (!url?.startsWith(expectedPrefix)) {
		throw new Error(`${kind} QR is not the KRA sandbox Data= URL: ${url}`);
	}
	console.log(`${kind} QR: ${url}`);
}

async function createInvoice(params: { teamId: string; createdBy: string }) {
	const existing = await db.query.invoice.findFirst({
		where: sql`(${invoice.metadata}->>'etimsGoliveSale1') = 'true'`,
	});
	const now = new Date();
	const kra = saleKraFields();
	if (existing) {
		await db
			.update(invoice)
			.set({
				...kra,
				updatedAt: now,
				kraLastAttemptAt: now,
				customerDetails: {
					name: "Application Test Customer",
					email: "cert@nisccloud.com",
					phone: "0700000000",
					address: "Nairobi",
					city: "Nairobi",
					country: "Kenya",
					taxId: CERT_TIN,
				},
			})
			.where(eq(invoice.id, existing.id));
		console.log(
			`Updated invoice ${existing.invoiceNumber} (${existing.id}) ISSUED=${formatKraSdcDateTimeFull(SALE_FISCAL.data.sdcDateTime)}`,
		);
		const updated = await db.query.invoice.findFirst({ where: eq(invoice.id, existing.id) });
		if (!updated) throw new Error("Invoice fiscal update did not persist");
		return updated;
	}

	const invoiceId = crypto.randomUUID();
	const invoiceNumber = await nextInvoiceNumber();
	const verifyUrl = saleVerifyUrl();

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
		dueDate: null,
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
			taxId: CERT_TIN,
		},
		paymentDetails: NISC_INVOICE_BANK_PAYMENT_DETAILS,
		template: { logoUrl: COMPANY_LOGO_URL },
		metadata: GOLIVE_META,
		createdBy: params.createdBy,
		updatedBy: params.createdBy,
		createdAt: now,
		updatedAt: now,
		kraLastAttemptAt: now,
		kraAttemptCount: 1,
		...kra,
		kraQrCode: verifyUrl,
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
		reference: "CERT145638",
		status: "COMPLETED",
		method: "CASH",
		amount: TOTAL,
		currency: "KES",
		paidAt: parseKraSdcDateTime(SALE_FISCAL.data.sdcDateTime) ?? SALE_ISSUE_AT,
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

async function stampCreditNoteFromKra(row: typeof creditNote.$inferSelect) {
	const verifyUrl = cnVerifyUrl();
	const issuedAt = parseKraSdcDateTime(CN_FISCAL.data.sdcDateTime) ?? CN_ISSUE_AT;
	const now = new Date();
	await db
		.update(creditNote)
		.set({
			issuedAt,
			kraStatus: "SYNCED",
			kraError: null,
			kraSubmittedAt: issuedAt,
			kraLastAttemptAt: now,
			kraAttemptCount: sql`${creditNote.kraAttemptCount} + 1`,
			kraSignature: CN_FISCAL.data.rcptSign,
			kraReceiptNumber: String(CN_FISCAL.data.curRcptNo),
			kraVerificationUrl: verifyUrl,
			kraQrCode: verifyUrl,
			kraVerifiedDate: issuedAt,
			kraInvoiceNumber: String(CN_INVC_NO),
			kraSyncPayload: {
				invcNo: CN_INVC_NO,
				orgInvcNo: SALE_INVC_NO,
				rfdRsnCd: "06",
				tin: CERT_TIN,
				bhfId: CERT_BHF_ID,
				sdcId: CN_FISCAL.data.sdcId,
			},
			kraSyncResponse: CN_FISCAL,
			updatedAt: now,
		})
		.where(eq(creditNote.id, row.id));
	console.log(
		`Stamped credit note ${row.creditNumber} ISSUED=${formatKraSdcDateTimeFull(CN_FISCAL.data.sdcDateTime)}`,
	);
	const updated = await db.query.creditNote.findFirst({ where: eq(creditNote.id, row.id) });
	if (!updated) throw new Error("Credit note KRA stamp did not persist");
	return updated;
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
		return stampCreditNoteFromKra(existing);
	}

	const creditNoteId = crypto.randomUUID();
	const creditNumber = await nextCreditNoteNumber();
	const now = new Date();
	const issuedAt = parseKraSdcDateTime(CN_FISCAL.data.sdcDateTime) ?? CN_ISSUE_AT;

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
		issuedAt,
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
	return stampCreditNoteFromKra(created);
}

async function main() {
	await loadCertSession();
	await overlayFromKra(SALE_INVC_NO, SALE_FISCAL);
	await overlayFromKra(CN_INVC_NO, CN_FISCAL);
	assertSandboxQr("Invoice", saleVerifyUrl());
	assertSandboxQr("Credit note", cnVerifyUrl());

	const actor = await findActor();
	const teamRow = await findTeam();

	const inv = await createInvoice({
		teamId: teamRow.id,
		createdBy: actor.id,
	});

	const cn = await ensureCreditNote({
		invoiceId: inv.id,
		invoiceNumber: inv.invoiceNumber,
		teamId: inv.teamId,
		createdBy: actor.id,
	});

	await mkdir(OUT_DIR, { recursive: true });

	const invoiceDetail = await getInvoiceDetailForPdf(db, inv.id);
	assertSandboxQr("Invoice PDF", invoiceDetail.kraVerificationUrl ?? invoiceDetail.kraQrCode ?? null);
	const invoicePdf = await generateInvoicePdfBuffer(invoiceDetail);
	const invoiceName = sanitizeInvoicePdfFilename(inv.invoiceNumber ?? "INV-0001");
	const invoicePath = path.join(OUT_DIR, invoiceName);
	await writeFile(invoicePath, invoicePdf);

	const creditDetail = await getCreditNoteDetailForPdf(db, cn.id);
	assertSandboxQr("Credit note PDF", creditDetail.kraVerificationUrl ?? creditDetail.kraQrCode ?? null);
	const creditPdf = await generateCreditNotePdfBuffer(creditDetail);
	const creditName = sanitizeInvoicePdfFilename(cn.creditNumber ?? "CN-0004").replace(/^INV/i, "CN");
	const creditPath = path.join(OUT_DIR, creditName.startsWith("CN") ? creditName : `CN-${creditName}`);
	await writeFile(creditPath, creditPdf);

	const saleIssued = formatKraSdcDateTimeFull(SALE_FISCAL.data.sdcDateTime);
	const cnIssued = formatKraSdcDateTimeFull(CN_FISCAL.data.sdcDateTime);
	console.log("\nDone.");
	console.log(`Invoice ISSUED / SCU / TIS: ${saleIssued}`);
	console.log(`Credit note ISSUED / SCU / TIS: ${cnIssued}`);
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
