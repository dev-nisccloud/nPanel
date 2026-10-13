import type { InvoiceDetail } from "@/routes/agency.invoices/create/api/schemas";
import { DEFAULT_INVOICE_LOGO } from "@/routes/agency.invoices/create/constants";
import { formatInvoiceLineItemForPdf, normalizeStoredInvoicePeriodDescription } from "@npanel/api/lib/nisc-order-invoice-line-items";
import { resolveInvoiceEtimsVerificationUrl } from "@npanel/api/agency-invoice-pdf/build-invoice-pdf-details";
import { resolveLineEtimsTaxBand, taxBucketsFromKraPayload } from "@npanel/api/agency-invoice-pdf/tis-receipt-totals";
import type {
	YourDetails,
	CompanyDetails,
	InvoiceItemDetails,
	PaymentDetails,
	InvoiceTerms,
	Item,
} from "@/routes/agency.invoices/create/types";

/** Web invoice preview  payment details + optional eTIMS verification QR only. */
export function transformInvoiceToPreviewData(invoice: InvoiceDetail): {
	yourDetails: YourDetails;
	companyDetails: CompanyDetails;
	invoiceDetails: InvoiceItemDetails;
	paymentDetails: PaymentDetails;
	invoiceTerms: InvoiceTerms;
} {
	const fromDetails = invoice.fromDetails as Record<string, unknown> | null;

	const yourDetails: YourDetails = {
		yourName: fromDetails?.name as string | undefined,
		yourEmail: fromDetails?.email as string | undefined,
		yourAddress: fromDetails?.address as string | undefined,
		yourCity: fromDetails?.city as string | undefined,
		yourState: fromDetails?.state as string | undefined,
		yourCountry: fromDetails?.country as string | undefined,
		yourZip: fromDetails?.zip as string | undefined,
		yourTaxId: fromDetails?.taxId as string | undefined,
		yourLogo: DEFAULT_INVOICE_LOGO,
	};

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

	const invoiceMeta =
		invoice.metadata && typeof invoice.metadata === "object"
			? (invoice.metadata as Record<string, unknown>)
			: {};
	const invoiceSource = typeof invoiceMeta.source === "string" ? invoiceMeta.source : null;

	const items: Item[] = invoice.lineItems.map((lineItem, index, lines) => {
		const lineMeta =
			lineItem.metadata && typeof lineItem.metadata === "object" && !Array.isArray(lineItem.metadata)
				? (lineItem.metadata as Record<string, unknown>)
				: {};
		const description = normalizeStoredInvoicePeriodDescription(lineItem.description, {
			invoiceSource,
			lineSource: typeof lineMeta.source === "string" ? lineMeta.source : null,
		});
		const billingCycle = lineMeta.billingCycle;
		const etimsTaxTyCd = resolveLineEtimsTaxBand({
			metadata: lineMeta,
			kraPayloads: [
				(invoice as { kraSyncPayload?: unknown }).kraSyncPayload,
				(invoice as { kraSyncResponse?: unknown }).kraSyncResponse,
			],
			index,
			lineCount: lines.length,
		});
		return {
			id: lineItem.id,
			itemDescription: formatInvoiceLineItemForPdf(
				lineItem.name?.trim() || "Service",
				description,
			),
			amount: lineItem.price ? parseFloat(lineItem.price) : undefined,
			qty: lineItem.quantity || undefined,
			...(typeof billingCycle === "string" && billingCycle !== "__unset__" ? { billingCycle } : {}),
			...(etimsTaxTyCd ? { etimsTaxTyCd } : {}),
		};
	});

	const invoiceDetails: InvoiceItemDetails = {
		note: invoice.note || undefined,
		discount: invoice.discount || undefined,
		taxPercentage: invoice.taxPercentage || undefined,
		taxRate: invoice.taxPercentage != null ? String(invoice.taxPercentage) : undefined,
		items,
		currency: invoice.currency || "KES",
		taxBuckets:
			taxBucketsFromKraPayload((invoice as { kraSyncPayload?: unknown }).kraSyncPayload) ??
			taxBucketsFromKraPayload((invoice as { kraSyncResponse?: unknown }).kraSyncResponse) ??
			undefined,
	};

	const paymentDetailsData = invoice.paymentDetails as Record<string, unknown> | null;
	const paymentMethodApi = paymentDetailsData?.paymentMethod;
	let paymentMethod: "bank" | "mpesa" | "cheque" = "mpesa";
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

	const paymentDetails: PaymentDetails = {
		paymentMethod,
		currency: invoice.currency || "KES",
		etimsVerificationUrl: resolveInvoiceEtimsVerificationUrl(invoice),
		bankName: paymentMethod === "bank" ? (paymentDetailsData?.bankName as string | undefined) : undefined,
		accountNumber:
			paymentMethod === "bank" ? (paymentDetailsData?.accountNumber as string | undefined) : undefined,
		accountName:
			paymentMethod === "bank" ? (paymentDetailsData?.accountName as string | undefined) : undefined,
		branchName:
			paymentMethod === "bank" ? (paymentDetailsData?.branchName as string | undefined) : undefined,
		branchCode:
			paymentMethod === "bank" ? (paymentDetailsData?.branchCode as string | undefined) : undefined,
		swiftCode:
			paymentMethod === "bank" ? (paymentDetailsData?.swiftCode as string | undefined) : undefined,
		mpesaPaybillNumber:
			paymentMethod === "mpesa"
				? ((paymentDetailsData?.mpesaPaybillNumber as string | undefined) || "303030")
				: undefined,
		mpesaAccountNumber:
			paymentMethod === "mpesa"
				? ((paymentDetailsData?.mpesaAccountNumber as string | undefined) || "2052676528")
				: undefined,
		mpesaInstructions:
			paymentMethod === "mpesa"
				? ((paymentDetailsData?.mpesaInstructions as string | undefined) || "Absa Bank Kenya")
				: undefined,
		chequeDeliveryAddress:
			paymentMethod === "cheque"
				? (paymentDetailsData?.chequeDeliveryAddress as string | undefined)
				: undefined,
		chequeInstructions:
			paymentMethod === "cheque"
				? (paymentDetailsData?.chequeInstructions as string | undefined)
				: undefined,
	};

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
