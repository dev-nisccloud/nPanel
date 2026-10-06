import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice } from "@npanel/db/schema/invoicing";
import { niscOrder } from "@npanel/db/schema/nisc-orders";
import { niscProduct } from "@npanel/db/schema/products";
import {
	groupDomainBundleItemsForInvoice,
	buildDomainBundleKraItemName,
	parseDomainBundleMetadata,
} from "./domain-bundle-order";
import { isInvoiceKraSynced } from "./invoice-kra-status";

export type KraTaxBand = "A" | "B" | "C" | "D" | "E";

export type KraSalesItemInput = {
	itemSeq: number;
	itemCd: string;
	itemClsCd: string;
	itemNm: string;
	pkgUnitCd: string;
	pkg: number;
	qtyUnitCd: string;
	qty: number;
	prc: number;
	splyAmt: number;
	dcRt: number;
	dcAmt: number;
	taxTyCd: KraTaxBand;
	taxblAmt: number;
	taxAmt: number;
	totAmt: number;
};

export type KraSalesTransactionInput = Record<string, unknown> & {
	itemList: KraSalesItemInput[];
};

type EtimsProductFields = {
	itemCd: string;
	itemClsCd: string;
	itemNm: string;
	taxTyCd: KraTaxBand;
	pkgUnitCd: string;
	qtyUnitCd: string;
};

type InvoiceLineRow = {
	name: string | null;
	total: string | null;
	price: string | null;
	metadata: unknown;
};

const TAX_RATES: Record<KraTaxBand, number> = {
	A: 0,
	B: 16,
	C: 0,
	D: 0,
	E: 0,
};

const KRA_ELIGIBLE_INVOICE_STATUSES = new Set(["SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"]);

export function parseInvoiceNumberForKra(invoiceNumber: string | null | undefined): number | null {
	if (!invoiceNumber) return null;
	const match = invoiceNumber.match(/^INV-(\d+)$/i);
	if (!match) return null;
	const num = Number.parseInt(match[1] ?? "", 10);
	return Number.isNaN(num) ? null : num;
}

function roundMoney(value: number): number {
	return Math.round(value * 100) / 100;
}

function parseMoney(value: string | number | null | undefined): number {
	if (value == null) return 0;
	const n = typeof value === "number" ? value : Number.parseFloat(String(value));
	return Number.isFinite(n) ? n : 0;
}

function normalizeTaxBand(value: string | null | undefined): KraTaxBand {
	const band = (value ?? "B").trim().toUpperCase();
	if (band === "A" || band === "B" || band === "C" || band === "D" || band === "E") {
		return band;
	}
	return "B";
}

function readMainProductIdFromLineMetadata(metadata: unknown): string | null {
	if (!metadata || typeof metadata !== "object") return null;
	const meta = metadata as Record<string, unknown>;
	const id =
		typeof meta.niscProductId === "string"
			? meta.niscProductId
			: typeof meta.mainProductId === "string"
				? meta.mainProductId
				: typeof meta.productId === "string"
					? meta.productId
					: null;
	return id?.trim() ? id.trim() : null;
}

function readKraItemNameFromLineMetadata(
	metadata: unknown,
	lineName: string | null | undefined,
): string | undefined {
	if (metadata && typeof metadata === "object") {
		const meta = metadata as Record<string, unknown>;
		if (typeof meta.kraItemNm === "string" && meta.kraItemNm.trim()) {
			return meta.kraItemNm.trim();
		}
		if (meta.isDomainBundle === true && Array.isArray(meta.bundleDomains)) {
			const domains = meta.bundleDomains.filter(
				(d): d is string => typeof d === "string" && d.trim().length > 0,
			);
			if (domains.length > 0) {
				return buildDomainBundleKraItemName(domains);
			}
		}
		const bundle = parseDomainBundleMetadata(metadata);
		if (bundle?.domains.length) {
			return buildDomainBundleKraItemName(bundle.domains);
		}
	}
	return lineName?.trim() || undefined;
}

function toEtimsProductFields(
	product: {
		name: string;
		serviceType?: string | null;
		etimsItemCd?: string | null;
		etimsItemClsCd?: string | null;
		etimsTaxTyCd?: string | null;
		etimsPkgUnitCd?: string | null;
		etimsQtyUnitCd?: string | null;
	},
	itemNmOverride?: string,
): EtimsProductFields | null {
	if (!product.etimsItemCd?.trim() || !product.etimsItemClsCd?.trim()) {
		return null;
	}
	const taxTyCd = normalizeTaxBand(product.etimsTaxTyCd);
	return {
		itemCd: product.etimsItemCd.trim(),
		itemClsCd: product.etimsItemClsCd.trim(),
		itemNm: (itemNmOverride ?? product.name).trim().slice(0, 200),
		taxTyCd,
		pkgUnitCd: product.etimsPkgUnitCd?.trim() || "OU",
		qtyUnitCd: product.etimsQtyUnitCd?.trim() || "U",
	};
}

function buildLineTaxAmounts(taxblAmt: number, taxTyCd: KraTaxBand) {
	const rate = TAX_RATES[taxTyCd];
	const taxAmt = roundMoney((taxblAmt * rate) / 100);
	return { taxAmt, totAmt: taxblAmt };
}

function buildKraSalesItem(
	seq: number,
	product: EtimsProductFields,
	taxblAmt: number,
): KraSalesItemInput {
	const qty = 1;
	const prc = roundMoney(taxblAmt);
	const splyAmt = prc;
	const { taxAmt, totAmt } = buildLineTaxAmounts(taxblAmt, product.taxTyCd);
	return {
		itemSeq: seq,
		itemCd: product.itemCd,
		itemClsCd: product.itemClsCd,
		itemNm: product.itemNm,
		pkgUnitCd: product.pkgUnitCd,
		pkg: qty,
		qtyUnitCd: product.qtyUnitCd,
		qty,
		prc,
		splyAmt,
		dcRt: 0,
		dcAmt: 0,
		taxTyCd: product.taxTyCd,
		taxblAmt,
		taxAmt,
		totAmt,
	};
}

async function loadEtimsFieldsForMainProduct(
	productId: string,
	itemNmOverride?: string,
): Promise<EtimsProductFields | null> {
	const product = await db.query.niscProduct.findFirst({
		where: eq(niscProduct.id, productId),
		columns: {
			id: true,
			name: true,
			serviceType: true,
			etimsItemCd: true,
			etimsItemClsCd: true,
			etimsTaxTyCd: true,
			etimsPkgUnitCd: true,
			etimsQtyUnitCd: true,
		},
	});
	if (!product) return null;
	return toEtimsProductFields(product, itemNmOverride);
}

/** Fallback when line metadata is missing: derive main product ids from linked Nisc order. */
async function resolveMainProductIdsFromNiscOrder(invoiceId: string): Promise<string[]> {
	const order = await db.query.niscOrder.findFirst({
		where: eq(niscOrder.invoiceId, invoiceId),
		with: {
			orderItems: {
				columns: {
					productId: true,
					itemPrice: true,
					itemSubtotal: true,
					primaryDomain: true,
					description: true,
					metadata: true,
					billingCycle: true,
				},
				with: {
					product: {
						columns: {
							id: true,
							name: true,
							serviceType: true,
						},
					},
					productPlan: {
						columns: { name: true },
					},
				},
			},
		},
	});

	if (!order?.orderItems?.length) return [];

	const { bundleGroups, nonBundleItems } = groupDomainBundleItemsForInvoice(order.orderItems);
	const productIds: string[] = [];

	for (const group of bundleGroups) {
		const lead = group.leadItem;
		const productId = lead.productId?.trim() || lead.product?.id?.trim();
		if (productId) {
			productIds.push(productId);
		}
	}

	for (const item of nonBundleItems) {
		const productId = item.productId?.trim() || item.product?.id?.trim();
		if (productId) productIds.push(productId);
	}

	return productIds;
}

async function resolveEtimsFieldsForInvoiceLine(
	line: InvoiceLineRow,
	invoiceId: string,
	lineIndex: number,
	fallbackProductIds: string[],
): Promise<EtimsProductFields | null> {
	const itemNmOverride = readKraItemNameFromLineMetadata(line.metadata, line.name);

	const mainProductId = readMainProductIdFromLineMetadata(line.metadata);
	if (mainProductId) {
		return loadEtimsFieldsForMainProduct(mainProductId, itemNmOverride);
	}

	const fallbackProductId = fallbackProductIds[lineIndex];
	if (fallbackProductId) {
		return loadEtimsFieldsForMainProduct(fallbackProductId, itemNmOverride);
	}

	return null;
}

function formatKraDateTime(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return (
		`${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
		`${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
	);
}

function formatKraDate(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function aggregateTaxBands(items: KraSalesItemInput[]) {
	const bands: KraTaxBand[] = ["A", "B", "C", "D", "E"];
	const taxbl: Record<KraTaxBand, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
	const tax: Record<KraTaxBand, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
	for (const item of items) {
		taxbl[item.taxTyCd] += item.taxblAmt;
		tax[item.taxTyCd] += item.taxAmt;
	}
	return {
		taxblAmtA: roundMoney(taxbl.A),
		taxblAmtB: roundMoney(taxbl.B),
		taxblAmtC: roundMoney(taxbl.C),
		taxblAmtD: roundMoney(taxbl.D),
		taxblAmtE: roundMoney(taxbl.E),
		taxRtA: TAX_RATES.A,
		taxRtB: TAX_RATES.B,
		taxRtC: TAX_RATES.C,
		taxRtD: TAX_RATES.D,
		taxRtE: TAX_RATES.E,
		taxAmtA: roundMoney(tax.A),
		taxAmtB: roundMoney(tax.B),
		taxAmtC: roundMoney(tax.C),
		taxAmtD: roundMoney(tax.D),
		taxAmtE: roundMoney(tax.E),
		totTaxblAmt: roundMoney(bands.reduce((s, b) => s + taxbl[b], 0)),
		totTaxAmt: roundMoney(bands.reduce((s, b) => s + tax[b], 0)),
	};
}

export type BuildKraTransactionResult =
	| { ok: true; transaction: KraSalesTransactionInput }
	| { ok: false; reason: string };

/**
 * Build KRA saveTrnsSalesOsdc payload from invoice lines.
 * Each line maps to the main nisc_product (service + add-ons total on the line amount).
 */
export async function buildKraSalesTransactionForInvoice(
	invoiceId: string,
): Promise<BuildKraTransactionResult> {
	const inv = await db.query.invoice.findFirst({
		where: eq(invoice.id, invoiceId),
		with: {
			lineItems: {
				orderBy: (li, { asc }) => [asc(li.position)],
			},
		},
	});

	if (!inv) {
		return { ok: false, reason: "Invoice not found" };
	}

	if (!KRA_ELIGIBLE_INVOICE_STATUSES.has(inv.status)) {
		return { ok: false, reason: `Invoice status ${inv.status} is not eligible for KRA sync` };
	}

	if ((inv.currency ?? "KES").toUpperCase() !== "KES") {
		return { ok: false, reason: `Currency ${inv.currency} is not supported for KRA sync` };
	}

	const lines = inv.lineItems ?? [];
	if (lines.length === 0) {
		return { ok: false, reason: "Invoice has no line items" };
	}

	const fallbackProductIds = await resolveMainProductIdsFromNiscOrder(invoiceId);
	const itemList: KraSalesItemInput[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		// Ex-VAT total for the service line (main product + add-ons when collapsed).
		const taxblAmt = parseMoney(line.total ?? line.price);
		if (taxblAmt <= 0) {
			return { ok: false, reason: `Line ${i + 1} has no taxable amount` };
		}

		const productFields = await resolveEtimsFieldsForInvoiceLine(
			line,
			invoiceId,
			i,
			fallbackProductIds,
		);
		if (!productFields) {
			return {
				ok: false,
				reason: `Line ${i + 1} (${line.name ?? "unnamed"}) has no KRA eTIMS mapping for its main product`,
			};
		}

		itemList.push(buildKraSalesItem(i + 1, productFields, taxblAmt));
	}

	const invcNo = parseInvoiceNumberForKra(inv.invoiceNumber);
	if (invcNo == null) {
		return { ok: false, reason: `Invalid invoice number for KRA: ${inv.invoiceNumber ?? "missing"}` };
	}

	const issueDate = inv.issueDate ?? inv.createdAt ?? new Date();
	const dt14 = formatKraDateTime(issueDate);
	const salesDt = formatKraDate(issueDate);

	const customer = (inv.customerDetails ?? {}) as Record<string, unknown>;
	const custTin =
		typeof customer.taxId === "string" && customer.taxId.trim().length > 0
			? customer.taxId.trim()
			: null;
	const custNm = (inv.customerName ?? customer.name ?? "Customer").toString().slice(0, 60);

	const taxBands = aggregateTaxBands(itemList);
	const trdInvcNo = (inv.invoiceNumber ?? inv.id).slice(0, 50);

	const transaction: KraSalesTransactionInput = {
		trdInvcNo,
		invcNo,
		orgInvcNo: 0,
		custTin,
		custNm,
		salesTyCd: "N",
		rcptTyCd: "S",
		pmtTyCd: "07",
		salesSttsCd: "02",
		cfmDt: dt14,
		salesDt,
		stockRlsDt: null,
		totItemCnt: itemList.length,
		...taxBands,
		totAmt: taxBands.totTaxblAmt,
		prchrAcptcYn: "N",
		remark: null,
		regrId: "system",
		regrNm: "nPanel",
		modrId: "system",
		modrNm: "nPanel",
		receipt: {
			custTin,
			rcptPbctDt: dt14,
			trdeNm: "Nisc Cloud Limited",
			prchrAcptcYn: "N",
		},
		itemList,
	};

	return { ok: true, transaction };
}

export type KraRefundReasonCode = "01" | "02" | "03" | "04" | "05" | "06";

export function parseCreditNoteNumberForKra(creditNumber: string | null | undefined): number | null {
	if (!creditNumber) return null;
	const match = creditNumber.match(/^CN-(\d+)$/i);
	if (!match) return null;
	const num = Number.parseInt(match[1] ?? "", 10);
	return Number.isNaN(num) ? null : num;
}

/**
 * Build KRA saveTrnsSalesOsdc credit note (rcptTyCd=R) from a synced invoice.
 */
export async function buildKraCreditNoteTransactionForInvoice(
	invoiceId: string,
	creditNoteId: string,
	rfdRsnCd: KraRefundReasonCode,
): Promise<BuildKraTransactionResult> {
	const inv = await db.query.invoice.findFirst({
		where: eq(invoice.id, invoiceId),
		with: {
			lineItems: {
				orderBy: (li, { asc }) => [asc(li.position)],
			},
			creditNote: true,
		},
	});

	if (!inv) {
		return { ok: false, reason: "Invoice not found" };
	}

	if (!isInvoiceKraSynced(inv.kraStatus)) {
		return { ok: false, reason: "Original invoice must be synced to KRA before issuing a credit note" };
	}

	const cn = inv.creditNote;
	if (!cn || cn.id !== creditNoteId) {
		return { ok: false, reason: "Credit note not found for this invoice" };
	}

	if ((inv.currency ?? "KES").toUpperCase() !== "KES") {
		return { ok: false, reason: `Currency ${inv.currency} is not supported for KRA sync` };
	}

	const orgInvcNo = parseInvoiceNumberForKra(inv.invoiceNumber);
	if (orgInvcNo == null) {
		return { ok: false, reason: `Invalid original invoice number for KRA: ${inv.invoiceNumber ?? "missing"}` };
	}

	const invcNo = parseCreditNoteNumberForKra(cn.creditNumber);
	if (invcNo == null) {
		return { ok: false, reason: `Invalid credit note number for KRA: ${cn.creditNumber ?? "missing"}` };
	}

	const lines = inv.lineItems ?? [];
	if (lines.length === 0) {
		return { ok: false, reason: "Invoice has no line items" };
	}

	const fallbackProductIds = await resolveMainProductIdsFromNiscOrder(invoiceId);
	const itemList: KraSalesItemInput[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		const taxblAmt = parseMoney(line.total ?? line.price);
		if (taxblAmt <= 0) {
			return { ok: false, reason: `Line ${i + 1} has no taxable amount` };
		}

		const productFields = await resolveEtimsFieldsForInvoiceLine(
			line,
			invoiceId,
			i,
			fallbackProductIds,
		);
		if (!productFields) {
			return {
				ok: false,
				reason: `Line ${i + 1} (${line.name ?? "unnamed"}) has no KRA eTIMS mapping for its main product`,
			};
		}

		itemList.push(buildKraSalesItem(i + 1, productFields, taxblAmt));
	}

	const issueDate = cn.issuedAt ?? new Date();
	const dt14 = formatKraDateTime(issueDate);
	const salesDt = formatKraDate(issueDate);

	const customer = (inv.customerDetails ?? {}) as Record<string, unknown>;
	const custTin =
		typeof customer.taxId === "string" && customer.taxId.trim().length > 0
			? customer.taxId.trim()
			: null;
	const custNm = (inv.customerName ?? customer.name ?? "Customer").toString().slice(0, 60);

	const taxBands = aggregateTaxBands(itemList);
	const trdInvcNo = (cn.creditNumber ?? cn.id).slice(0, 50);

	const transaction: KraSalesTransactionInput = {
		trdInvcNo,
		invcNo,
		orgInvcNo,
		custTin,
		custNm,
		salesTyCd: "N",
		rcptTyCd: "R",
		pmtTyCd: "07",
		salesSttsCd: "02",
		cfmDt: dt14,
		salesDt,
		stockRlsDt: null,
		rfdDt: dt14,
		rfdRsnCd: rfdRsnCd,
		totItemCnt: itemList.length,
		...taxBands,
		totAmt: taxBands.totTaxblAmt,
		prchrAcptcYn: "N",
		remark: cn.reason?.slice(0, 400) ?? null,
		regrId: "system",
		regrNm: "nPanel",
		modrId: "system",
		modrNm: "nPanel",
		receipt: {
			custTin,
			rcptPbctDt: dt14,
			trdeNm: "Nisc Cloud Limited",
			prchrAcptcYn: "N",
		},
		itemList,
	};

	return { ok: true, transaction };
}

/** Main nisc product id on the invoice line (service; add-ons roll into line total). */
export function buildNiscInvoiceLineMetadata(input: {
	productId: string;
	serviceType?: string | null;
	kraItemNm?: string;
	isDomainBundle?: boolean;
	bundleDomains?: string[];
}): Record<string, unknown> | undefined {
	const productId = input.productId?.trim();
	if (!productId) return undefined;
	return {
		niscProductId: productId,
		mainProductId: productId,
		...(input.serviceType ? { serviceType: input.serviceType } : {}),
		...(input.kraItemNm ? { kraItemNm: input.kraItemNm } : {}),
		...(input.isDomainBundle ? { isDomainBundle: true } : {}),
		...(input.bundleDomains?.length ? { bundleDomains: input.bundleDomains } : {}),
	};
}
