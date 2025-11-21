import type { InvoiceDetail } from "@/app/(main)/agency/invoices/create/api/schemas";
import type {
	YourDetails,
	CompanyDetails,
	InvoiceItemDetails,
	PaymentDetails,
	InvoiceTerms,
	Item,
} from "@/app/(main)/agency/invoices/create/types";

export function transformInvoiceToPreviewData(
	invoice: InvoiceDetail
): {
	yourDetails: YourDetails;
	companyDetails: CompanyDetails;
	invoiceDetails: InvoiceItemDetails;
	paymentDetails: PaymentDetails;
	invoiceTerms: InvoiceTerms;
} {
	// Extract fromDetails (your details)
	const fromDetails = invoice.fromDetails as Record<string, unknown> | null;
	const defaultLogoUrl = "https://1ris7itpac.ufs.sh/f/Djp547U8wumpWQzBihElLmSnxiqhFZB2ajbeTk0Y6XofJ4Mp";
	const yourDetails: YourDetails = {
		yourName: fromDetails?.name as string | undefined,
		yourEmail: fromDetails?.email as string | undefined,
		yourAddress: fromDetails?.address as string | undefined,
		yourCity: fromDetails?.city as string | undefined,
		yourState: fromDetails?.state as string | undefined,
		yourCountry: fromDetails?.country as string | undefined,
		yourZip: fromDetails?.zip as string | undefined,
		yourTaxId: fromDetails?.taxId as string | undefined,
		yourLogo: (fromDetails?.logoUrl as string | undefined) || defaultLogoUrl,
	};

	// Extract customerDetails (company details)
	const customerDetails = invoice.customerDetails as Record<string, unknown> | null;
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

	// Transform line items to Item format
	const items: Item[] = invoice.lineItems.map((lineItem) => ({
		id: lineItem.id,
		itemDescription: lineItem.description || lineItem.name || "",
		amount: lineItem.price ? parseFloat(lineItem.price) : undefined,
		qty: lineItem.quantity || undefined,
	}));

	// Build invoice details
	const invoiceDetails: InvoiceItemDetails = {
		note: invoice.note || undefined,
		discount: invoice.discount || undefined,
		taxPercentage: invoice.taxPercentage || undefined,
		items,
		currency: invoice.currency || "KES",
	};

	// Extract paymentDetails
	const paymentDetailsData = invoice.paymentDetails as Record<string, unknown> | null;
	
	// Map payment method from API format to preview format
	let paymentMethod: "bank" | "mpesa" | "cheque" = "bank";
	if (paymentDetailsData?.method) {
		const method = String(paymentDetailsData.method).toLowerCase();
		if (method === "mpesa") {
			paymentMethod = "mpesa";
		} else if (method === "cheque") {
			paymentMethod = "cheque";
		}
	}

	const paymentDetails: PaymentDetails = {
		paymentMethod,
		currency: invoice.currency || "KES",
		qrCodeValue: paymentDetailsData?.qrCodeValue as string | undefined,
		// Bank transfer fields
		bankName: paymentDetailsData?.bankName as string | undefined,
		accountNumber: paymentDetailsData?.accountNumber as string | undefined,
		accountName: paymentDetailsData?.accountName as string | undefined,
		routingCode: paymentDetailsData?.routingCode as string | undefined,
		swiftCode: paymentDetailsData?.swiftCode as string | undefined,
		ifscCode: paymentDetailsData?.ifscCode as string | undefined,
		// MPESA fields
		mpesaPaybillNumber: paymentDetailsData?.paybillNumber as string | undefined,
		mpesaAccountNumber: paymentDetailsData?.accountNumber as string | undefined,
		mpesaInstructions: paymentDetailsData?.instructions as string | undefined,
		// Cheque fields
		chequeDeliveryAddress: paymentDetailsData?.deliveryAddress as string | undefined,
		chequeInstructions: paymentDetailsData?.instructions as string | undefined,
	};

	// Build invoice terms
	const invoiceTerms: InvoiceTerms = {
		invoiceNumber: invoice.invoiceNumber || undefined,
		issueDate: invoice.issueDate
			? typeof invoice.issueDate === "string"
				? invoice.issueDate
				: invoice.issueDate.toISOString().split("T")[0]
			: undefined,
		dueDate: invoice.dueDate
			? typeof invoice.dueDate === "string"
				? invoice.dueDate
				: invoice.dueDate.toISOString().split("T")[0]
			: undefined,
	};

	return {
		yourDetails,
		companyDetails,
		invoiceDetails,
		paymentDetails,
		invoiceTerms,
	};
}

