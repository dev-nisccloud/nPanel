/**
 * Same PDF props as agency invoice details page (`buildInvoicePdfDetails` in agency.invoices.$id.tsx).
 */
import type { InvoiceDetail } from "../routers/invoicing/schemas";
import { ensureEtimsPrintFields, extractEtimsFiscalFieldsFromInvoice, formatKraSdcDateTimeDisplay } from "../lib/etims-fiscal-fields";
import { resolveInvoiceEtimsVerificationUrl } from "../lib/etims-receipt-url";
import { formatInvoiceLineItemForPdf, normalizeStoredInvoicePeriodDescription } from "../lib/nisc-order-invoice-line-items";
import type {
	YourDetails,
	CompanyDetails,
	InvoiceItemDetails,
	PaymentDetails,
	InvoiceTerms,
	EtimsFiscalFields,
} from "./types";

import { COMPANY_LOGO_URL } from "../lib/company-branding";
import { resolveLineEtimsTaxBand, taxBucketsFromKraPayload } from "./tis-receipt-totals";

export { COMPANY_LOGO_URL } from "../lib/company-branding";
export { resolveInvoiceEtimsVerificationUrl } from "../lib/etims-receipt-url";

export function buildInvoicePdfDetails(invoice: InvoiceDetail): {
	yourDetails: YourDetails;
	companyDetails: CompanyDetails;
	invoiceDetails: InvoiceItemDetails;
	paymentDetails: PaymentDetails;
	invoiceTerms: InvoiceTerms;
	etimsFiscal: EtimsFiscalFields | null;
} {
	const fromDetails = (invoice.fromDetails as Record<string, unknown> | null) ?? {};
	const customerDetails = (invoice.customerDetails as Record<string, unknown> | null) ?? {};

	const yourDetails: YourDetails = {
		yourName: fromDetails?.name as string | undefined,
		yourEmail: fromDetails?.email as string | undefined,
		yourAddress: fromDetails?.address as string | undefined,
		yourCity: fromDetails?.city as string | undefined,
		yourState: fromDetails?.state as string | undefined,
		yourCountry: fromDetails?.country as string | undefined,
		yourZip: fromDetails?.zip as string | undefined,
		yourTaxId: fromDetails?.taxId as string | undefined,
		yourLogo: COMPANY_LOGO_URL,
	};

	const companyDetails: CompanyDetails = {
		companyName: (customerDetails?.name as string | undefined) ?? invoice.customerName ?? undefined,
		email: (customerDetails?.email as string | undefined) ?? invoice.customerEmail ?? undefined,
		companyAddress: customerDetails?.address as string | undefined,
		companyCity: customerDetails?.city as string | undefined,
		companyState: customerDetails?.state as string | undefined,
		companyCountry: customerDetails?.country as string | undefined,
		companyZip: customerDetails?.zip as string | undefined,
		companyTaxId: customerDetails?.taxId as string | undefined,
	};

	const invoiceMeta =
		invoice.metadata && typeof invoice.metadata === "object"
			? (invoice.metadata as Record<string, unknown>)
			: {};
	const invoiceSource = typeof invoiceMeta.source === "string" ? invoiceMeta.source : null;

	const invoiceDetails: InvoiceItemDetails = {
		note: invoice.note ?? undefined,
		discount: invoice.discount ?? undefined,
		taxRate: invoice.taxPercentage != null ? String(invoice.taxPercentage) : undefined,
		items: (invoice.lineItems ?? []).map((li, index, lines) => {
			const lineMeta =
				li.metadata && typeof li.metadata === "object"
					? (li.metadata as Record<string, unknown>)
					: {};
			const billingCycle = lineMeta.billingCycle;
			const description = normalizeStoredInvoicePeriodDescription(li.description, {
				invoiceSource,
				lineSource: typeof lineMeta.source === "string" ? lineMeta.source : null,
			});
			return {
				id: li.id,
				itemDescription: formatInvoiceLineItemForPdf(
					li.name || "Service",
					description,
				),
				amount: li.price != null ? Number(li.price) : undefined,
				qty: li.quantity ?? undefined,
				billingCycle:
					typeof billingCycle === "string" && billingCycle !== "__unset__"
						? billingCycle
						: undefined,
				etimsTaxTyCd: resolveLineEtimsTaxBand({
					metadata: lineMeta,
					kraPayloads: [invoice.kraSyncPayload, invoice.kraSyncResponse],
					index,
					lineCount: lines.length,
				}),
			};
		}),
		currency: invoice.currency ?? "KES",
		compactLineItems: true,
		taxBuckets:
			taxBucketsFromKraPayload(invoice.kraSyncPayload) ??
			taxBucketsFromKraPayload(invoice.kraSyncResponse) ??
			undefined,
	};

	const storedSdcId =
		(invoice as InvoiceDetail & { etimsFiscal?: EtimsFiscalFields | null }).etimsFiscal?.sdcId ??
		null;
	const etimsFiscal =
		extractEtimsFiscalFieldsFromInvoice(invoice, {
			tisReceiptNumber: invoice.invoiceNumber,
			tisIssuedAt: invoice.issueDate,
			itemCount: invoiceDetails.items.length,
			sdcId: storedSdcId,
		}) ??
		ensureEtimsPrintFields(
			(invoice as InvoiceDetail & { etimsFiscal?: EtimsFiscalFields | null }).etimsFiscal,
			{
				tisReceiptNumber: invoice.invoiceNumber,
				tisIssuedAt: invoice.issueDate,
				itemCount: invoiceDetails.items.length,
				sdcId: storedSdcId,
			},
		);

	const invoiceTerms: InvoiceTerms = {
		invoiceNumber: invoice.invoiceNumber ?? undefined,
		scuId: etimsFiscal?.sdcId ?? undefined,
		issueDate: invoice.issueDate ?? undefined,
		issuedAtDisplay:
			formatKraSdcDateTimeDisplay(etimsFiscal.sdcDateTime) ??
			formatKraSdcDateTimeDisplay(invoice.issueDate) ??
			undefined,
		dueDate: invoice.dueDate ?? undefined,
		buyerPin: (customerDetails?.taxId as string | undefined) ?? undefined,
		status: invoice.status ?? undefined,
	};

	const storedPayment =
		invoice.paymentDetails &&
		typeof invoice.paymentDetails === "object" &&
		!Array.isArray(invoice.paymentDetails)
			? (invoice.paymentDetails as Record<string, unknown>)
			: {};
	const pickPayment = (...keys: string[]): string | undefined => {
		for (const key of keys) {
			const value = storedPayment[key];
			if (typeof value === "string" && value.trim()) return value.trim();
		}
		return undefined;
	};

	const paymentDetailsFormatted: PaymentDetails = {
		etimsVerificationUrl: etimsFiscal?.verificationUrl ?? resolveInvoiceEtimsVerificationUrl(invoice),
		bankName: pickPayment("bankName"),
		accountNumber: pickPayment("accountNumber"),
		accountName: pickPayment("accountName"),
		branchName: pickPayment("branchName"),
		branchCode: pickPayment("branchCode"),
		swiftCode: pickPayment("swiftCode"),
		mpesaPaybillNumber: pickPayment("mpesaPaybillNumber", "paybillNumber"),
		mpesaAccountNumber: pickPayment("mpesaAccountNumber"),
		mpesaInstructions: pickPayment("mpesaInstructions", "instructions"),
	};

	return {
		yourDetails,
		companyDetails,
		invoiceDetails,
		paymentDetails: paymentDetailsFormatted,
		invoiceTerms,
		etimsFiscal,
	};
}
