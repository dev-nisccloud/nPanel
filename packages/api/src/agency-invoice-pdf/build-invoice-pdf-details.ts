/**
 * Same PDF props as agency invoice details page (`buildInvoicePdfDetails` in agency.invoices.$id.tsx).
 */
import type { InvoiceDetail } from "../routers/invoicing/schemas";
import { extractEtimsFiscalFieldsFromInvoice } from "../lib/etims-fiscal-fields";
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
	const paymentDetails = (invoice.paymentDetails as Record<string, unknown> | null) ?? {};

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
		items: (invoice.lineItems ?? []).map((li) => {
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
			};
		}),
		currency: invoice.currency ?? "KES",
		compactLineItems: true,
	};

	const invoiceTerms: InvoiceTerms = {
		invoiceNumber: invoice.invoiceNumber ?? undefined,
		issueDate: invoice.issueDate ?? undefined,
		dueDate: invoice.dueDate ?? undefined,
	};

	const paymentMethodApi = paymentDetails?.paymentMethod;
	let paymentMethod: "bank" | "mpesa" | "cheque" | undefined;
	if (
		paymentMethodApi === "BANK_TRANSFER" ||
		paymentMethodApi === "bank_transfer" ||
		paymentMethodApi === "bank"
	) {
		paymentMethod = "bank";
	} else if (paymentMethodApi === "MPESA" || paymentMethodApi === "mpesa") {
		paymentMethod = "mpesa";
	} else if (paymentMethodApi === "CHEQUE" || paymentMethodApi === "cheque") {
		paymentMethod = "cheque";
	}
	if (!paymentMethod) paymentMethod = "mpesa";

	const paymentDetailsFormatted: PaymentDetails = {
		paymentMethod,
		currency: invoice.currency || "KES",
		etimsVerificationUrl: resolveInvoiceEtimsVerificationUrl(invoice),
		bankName: paymentMethod === "bank" ? (paymentDetails?.bankName as string | undefined) : undefined,
		accountNumber:
			paymentMethod === "bank" ? (paymentDetails?.accountNumber as string | undefined) : undefined,
		accountName:
			paymentMethod === "bank" ? (paymentDetails?.accountName as string | undefined) : undefined,
		branchName:
			paymentMethod === "bank" ? (paymentDetails?.branchName as string | undefined) : undefined,
		branchCode:
			paymentMethod === "bank" ? (paymentDetails?.branchCode as string | undefined) : undefined,
		swiftCode: paymentMethod === "bank" ? (paymentDetails?.swiftCode as string | undefined) : undefined,
		mpesaPaybillNumber:
			paymentMethod === "mpesa"
				? ((paymentDetails?.mpesaPaybillNumber as string | undefined) || "303030")
				: undefined,
		mpesaAccountNumber:
			paymentMethod === "mpesa"
				? ((paymentDetails?.mpesaAccountNumber as string | undefined) || "2052676528")
				: undefined,
		mpesaInstructions:
			paymentMethod === "mpesa"
				? ((paymentDetails?.mpesaInstructions as string | undefined) || "Absa Bank Kenya")
				: undefined,
		chequeDeliveryAddress:
			paymentMethod === "cheque"
				? (paymentDetails?.chequeDeliveryAddress as string | undefined)
				: undefined,
		chequeInstructions:
			paymentMethod === "cheque"
				? (paymentDetails?.chequeInstructions as string | undefined)
				: undefined,
	};

	return {
		yourDetails,
		companyDetails,
		invoiceDetails,
		paymentDetails: paymentDetailsFormatted,
		invoiceTerms,
		etimsFiscal:
			(invoice as InvoiceDetail & { etimsFiscal?: EtimsFiscalFields | null }).etimsFiscal ??
			extractEtimsFiscalFieldsFromInvoice(invoice),
	};
}
