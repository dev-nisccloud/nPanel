import React from "react";
import { Page, Text } from "@react-pdf/renderer";
import { InvoicePageFooter } from "./components/invoice-page-footer";
import { PdfDetails } from "./components/pdf-details";
import { pdfContainers } from "./pdf-styles";
import type { EtimsFiscalFields } from "./types";
import { ensureEtimsPrintFields } from "../lib/etims-fiscal-fields";
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
	paymentDetails?: PaymentDetails;
	invoiceTerms: InvoiceTerms;
	etimsFiscal: EtimsFiscalFields | null;
	qrCodeDataUrl?: string;
	documentTitle?: string;
};

/**
 * Single A4 invoice page. Payment details and the KRA SCU footer repeat on every page.
 */
export function AgencyInvoicePdfPage({
	yourDetails,
	companyDetails,
	invoiceDetails,
	paymentDetails,
	invoiceTerms,
	etimsFiscal,
	qrCodeDataUrl,
	documentTitle,
}: AgencyInvoicePdfPageProps) {
	const isCreditNote = (documentTitle ?? "").toLowerCase().includes("credit");
	const fiscal = ensureEtimsPrintFields(etimsFiscal, {
		tisReceiptNumber: invoiceTerms.invoiceNumber ?? etimsFiscal?.tisReceiptNumber ?? null,
		tisIssuedAt: invoiceTerms.issueDate ?? null,
		originalCuInvoiceNo: invoiceTerms.originalCuInvoiceNo ?? null,
		itemCount: invoiceDetails.items.length,
		isCreditNote,
		sdcId: etimsFiscal?.sdcId ?? invoiceTerms.scuId ?? null,
	});

	return (
		<Page size="A4" style={pdfContainers.pageWithEtimsFooter}>
			<InvoicePageFooter
				fields={fiscal}
				qrCodeDataUrl={qrCodeDataUrl}
				paymentDetails={paymentDetails}
			/>
			<PdfDetails
				companyDetails={companyDetails}
				invoiceDetails={invoiceDetails}
				invoiceTerms={invoiceTerms}
				yourDetails={yourDetails}
				documentTitle={documentTitle}
			/>
			<Text
				fixed
				style={{
					position: "absolute",
					bottom: 4,
					right: 40,
					fontSize: 8,
					color: "#6b7280",
				}}
				render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
			/>
		</Page>
	);
}
