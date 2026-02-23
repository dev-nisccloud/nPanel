import type {
	YourDetails,
	CompanyDetails,
	QuotationItemDetails,
	QuotationTerms,
	Item,
} from "@/app/(main)/agency/quotations/create/types";

const DEFAULT_LOGO = "https://1ris7itpac.ufs.sh/f/Djp547U8wumpWQzBihElLmSnxiqhFZB2ajbeTk0Y6XofJ4Mp";

/** Quotation shape as received from tRPC (dates may be serialized as strings). */
export type QuotationForPreview = {
	fromDetails?: unknown;
	customerDetails?: unknown;
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
	currency?: string;
	quotationNumber?: string | null;
	issueDate?: Date | string | null;
};

export function transformQuotationToPreviewData(quotation: QuotationForPreview): {
	yourDetails: YourDetails;
	companyDetails: CompanyDetails;
	quotationDetails: QuotationItemDetails;
	quotationTerms: QuotationTerms;
} {
	const fromDetails = quotation.fromDetails as Record<string, unknown> | null;
	const yourDetails: YourDetails = {
		yourName: fromDetails?.name as string | undefined,
		yourEmail: fromDetails?.email as string | undefined,
		yourAddress: fromDetails?.address as string | undefined,
		yourCity: fromDetails?.city as string | undefined,
		yourState: fromDetails?.state as string | undefined,
		yourCountry: fromDetails?.country as string | undefined,
		yourZip: fromDetails?.zip as string | undefined,
		yourTaxId: fromDetails?.taxId as string | undefined,
		yourLogo: (fromDetails?.logoUrl as string | undefined) || DEFAULT_LOGO,
	};

	const customerDetails = quotation.customerDetails as Record<string, unknown> | null;
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

	const items: Item[] = quotation.lineItems.map((lineItem) => ({
		id: lineItem.id,
		itemDescription: lineItem.description || lineItem.name || "",
		amount: lineItem.price ? parseFloat(lineItem.price) : undefined,
		qty: lineItem.quantity ?? undefined,
	}));

	const quotationDetails: QuotationItemDetails = {
		note: quotation.note ?? undefined,
		discount: quotation.discount ?? undefined,
		taxPercentage: quotation.taxPercentage ?? undefined,
		items,
		currency: quotation.currency ?? "KES",
	};

	const quotationTerms: QuotationTerms = {
		quotationNumber: quotation.quotationNumber ?? undefined,
		issueDate: quotation.issueDate
			? typeof quotation.issueDate === "string"
				? quotation.issueDate
				: quotation.issueDate
			: undefined,
	};

	return {
		yourDetails,
		companyDetails,
		quotationDetails,
		quotationTerms,
	};
}

/** Map quotation (from getById) to form default values for create/edit form. */
export function quotationToFormDefaultValues(quotation: QuotationForPreview): Record<string, unknown> {
	const preview = transformQuotationToPreviewData(quotation);
	const issueDateStr =
		preview.quotationTerms.issueDate instanceof Date
			? preview.quotationTerms.issueDate.toISOString().slice(0, 10)
			: preview.quotationTerms.issueDate
				? String(preview.quotationTerms.issueDate).slice(0, 10)
				: "";
	return {
		step: "1",
		yourEmail: preview.yourDetails.yourEmail ?? "",
		yourName: preview.yourDetails.yourName ?? "",
		yourAddress: preview.yourDetails.yourAddress ?? "",
		yourCity: preview.yourDetails.yourCity ?? "",
		yourState: preview.yourDetails.yourState ?? "",
		yourCountry: preview.yourDetails.yourCountry ?? "",
		yourLogo: preview.yourDetails.yourLogo ?? "",
		yourTaxId: preview.yourDetails.yourTaxId ?? "",
		yourZip: preview.yourDetails.yourZip ?? "",
		email: preview.companyDetails.email ?? "",
		companyName: preview.companyDetails.companyName ?? "",
		companyAddress: preview.companyDetails.companyAddress ?? "",
		companyCity: preview.companyDetails.companyCity ?? "",
		companyState: preview.companyDetails.companyState ?? "",
		companyCountry: preview.companyDetails.companyCountry ?? "",
		companyTaxId: preview.companyDetails.companyTaxId ?? "",
		companyZip: preview.companyDetails.companyZip ?? "",
		note: preview.quotationDetails.note ?? "",
		discount: preview.quotationDetails.discount ?? "",
		taxPercentage: preview.quotationDetails.taxPercentage ?? undefined,
		items:
			preview.quotationDetails.items?.length > 0
				? preview.quotationDetails.items.map((i) => ({
						itemDescription: i.itemDescription ?? "",
						amount: i.amount,
						qty: i.qty,
					}))
				: [{ itemDescription: "" }],
		quotationNo: preview.quotationTerms.quotationNumber ?? "",
		issueDate: issueDateStr,
		currency: preview.quotationDetails.currency ?? "KES",
	};
}
