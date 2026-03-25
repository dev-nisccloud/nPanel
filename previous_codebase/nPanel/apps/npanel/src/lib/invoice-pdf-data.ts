/**
 * Converts invoice data (from API getById / getInvoiceDetailForPdf) to the shape
 * expected by PdfDetails. Shared by the invoice view page and server-side PDF generation.
 */
import type {
	YourDetails,
	CompanyDetails,
	InvoiceItemDetails,
	PaymentDetails,
	InvoiceTerms,
} from "@/app/(main)/agency/invoices/create/types";

const COMPANY_LOGO_URL = "https://1ris7itpac.ufs.sh/f/Djp547U8wumpWQzBihElLmSnxiqhFZB2ajbeTk0Y6XofJ4Mp";

export interface InvoiceForPdfData {
	fromDetails?: Record<string, unknown> | null;
	customerDetails?: Record<string, unknown> | null;
	paymentDetails?: Record<string, unknown> | null;
	lineItems: Array<{
		id: string;
		name?: string | null;
		description?: string | null;
		price?: string | null;
		quantity?: number | null;
	}>;
	note?: string | null;
	discount?: string | null;
	taxPercentage?: number | null;
	currency?: string | null;
	invoiceNumber?: string | null;
	issueDate?: Date | string | null;
	dueDate?: Date | string | null;
}

export interface InvoicePdfData {
	yourDetails: YourDetails;
	companyDetails: CompanyDetails;
	invoiceDetails: InvoiceItemDetails;
	paymentDetails: PaymentDetails;
	invoiceTerms: InvoiceTerms;
}

export function convertInvoiceToPdfData(invoice: InvoiceForPdfData): InvoicePdfData {
	const fromDetails = invoice.fromDetails as Record<string, unknown> | undefined;
	const customerDetails = invoice.customerDetails as Record<string, unknown> | undefined;
	const paymentDetails = invoice.paymentDetails as Record<string, unknown> | undefined;

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
		companyName: customerDetails?.name as string | undefined,
		email: customerDetails?.email as string | undefined,
		companyAddress: customerDetails?.address as string | undefined,
		companyCity: customerDetails?.city as string | undefined,
		companyState: customerDetails?.state as string | undefined,
		companyCountry: customerDetails?.country as string | undefined,
		companyZip: customerDetails?.zip as string | undefined,
		companyTaxId: customerDetails?.taxId as string | undefined,
	};

	const invoiceDetails: InvoiceItemDetails = {
		note: invoice.note ?? undefined,
		discount: invoice.discount ?? undefined,
		taxPercentage: invoice.taxPercentage ?? undefined,
		currency: invoice.currency ?? undefined,
		items: invoice.lineItems.map((item) => ({
			id: item.id,
			itemDescription: item.description
				? `${item.name || "Service"}. ${item.description}`
				: (item.name || "Service"),
			amount: item.price ? Number(item.price) : undefined,
			qty: item.quantity ?? undefined,
		})),
	};

	const paymentMethodApi = paymentDetails?.paymentMethod;
	let paymentMethod: "bank" | "mpesa" | "cheque" = "bank";
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

	const paymentDetailsFormatted: PaymentDetails = {
		paymentMethod,
		currency: invoice.currency || "KES",
		qrCodeValue: (paymentDetails?.qrCodeValue as string) || "www.nisccloud.com",
		bankName: paymentMethod === "bank" ? (paymentDetails?.bankName as string) : undefined,
		accountNumber: paymentMethod === "bank" ? (paymentDetails?.accountNumber as string) : undefined,
		accountName: paymentMethod === "bank" ? (paymentDetails?.accountName as string) : undefined,
		branchName: paymentMethod === "bank" ? (paymentDetails?.branchName as string) : undefined,
		branchCode: paymentMethod === "bank" ? (paymentDetails?.branchCode as string) : undefined,
		swiftCode: paymentMethod === "bank" ? (paymentDetails?.swiftCode as string) : undefined,
		mpesaPaybillNumber:
			paymentMethod === "mpesa"
				? ((paymentDetails?.mpesaPaybillNumber as string) || "303030")
				: undefined,
		mpesaAccountNumber:
			paymentMethod === "mpesa"
				? ((paymentDetails?.mpesaAccountNumber as string) || "2052676528")
				: undefined,
		mpesaInstructions:
			paymentMethod === "mpesa"
				? (paymentDetails?.mpesaInstructions as string)
				: undefined,
		chequeDeliveryAddress:
			paymentMethod === "cheque"
				? (paymentDetails?.chequeDeliveryAddress as string)
				: undefined,
		chequeInstructions:
			paymentMethod === "cheque" ? (paymentDetails?.chequeInstructions as string) : undefined,
	};

	const invoiceTerms: InvoiceTerms = {
		invoiceNumber: invoice.invoiceNumber ?? undefined,
		issueDate: invoice.issueDate
			? typeof invoice.issueDate === "string"
				? new Date(invoice.issueDate)
				: invoice.issueDate
				: undefined,
		dueDate: invoice.dueDate
			? typeof invoice.dueDate === "string"
				? new Date(invoice.dueDate)
				: invoice.dueDate
				: undefined,
	};

	return {
		yourDetails,
		companyDetails,
		invoiceDetails,
		paymentDetails: paymentDetailsFormatted,
		invoiceTerms,
	};
}
