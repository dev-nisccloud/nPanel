import React from "react";
import { Page } from "@react-pdf/renderer";
import { EtimsFiscalFooterPdf } from "./components/etims-fiscal-footer-pdf";
import { PdfDetails } from "./components/pdf-details";
import { pdfContainers } from "./pdf-styles";
import type { EtimsFiscalFields } from "./types";
import { emptyEtimsFiscalFields } from "../lib/etims-fiscal-fields";
import type {
	YourDetails,
	CompanyDetails,
	InvoiceItemDetails,
	PaymentDetails,
	InvoiceTerms,
} from "./types";

export type AgencyInvoicePdfPageProps = {
	yourDetails: YourDetails;
	companyDetails: CompanyDetails;
	invoiceDetails: InvoiceItemDetails;
	/** Kept for caller compatibility; bank/M-Pesa is no longer printed (KRA SCU footer occupies this space). */
	paymentDetails?: PaymentDetails;
	invoiceTerms: InvoiceTerms;
	etimsFiscal: EtimsFiscalFields | null;
	qrCodeDataUrl?: string;
	documentTitle?: string;
};

/**
 * Single A4 invoice page with optional fixed KRA eTIMS fiscal footer on every page.
 */
export function AgencyInvoicePdfPage({
	yourDetails,
	companyDetails,
	invoiceDetails,
	invoiceTerms,
	etimsFiscal,
	qrCodeDataUrl,
	documentTitle,
}: AgencyInvoicePdfPageProps) {
	const isCreditNote = (documentTitle ?? "").toLowerCase().includes("credit");
	const fiscal = etimsFiscal ?? emptyEtimsFiscalFields({
		tisReceiptNumber: invoiceTerms.invoiceNumber ?? null,
		tisIssuedAt: invoiceTerms.issueDate ?? null,
		originalCuInvoiceNo: invoiceTerms.originalCuInvoiceNo ?? null,
		itemCount: invoiceDetails.items.length,
		isCreditNote,
	});

	return (
		<Page size="A4" style={pdfContainers.pageWithEtimsFooter}>
			<EtimsFiscalFooterPdf fields={fiscal} qrCodeDataUrl={qrCodeDataUrl} />
			<PdfDetails
				companyDetails={companyDetails}
				invoiceDetails={invoiceDetails}
				invoiceTerms={invoiceTerms}
				yourDetails={yourDetails}
				documentTitle={documentTitle}
			/>
		</Page>
	);
}
