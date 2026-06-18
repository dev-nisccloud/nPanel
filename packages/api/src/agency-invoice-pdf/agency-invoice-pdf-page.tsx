import React from "react";
import { Page } from "@react-pdf/renderer";
import { EtimsFiscalFooterPdf } from "./components/etims-fiscal-footer-pdf";
import { PdfDetails } from "./components/pdf-details";
import { pdfContainers } from "./pdf-styles";
import type { EtimsFiscalFields } from "./types";
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
	paymentDetails: PaymentDetails;
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
	paymentDetails,
	invoiceTerms,
	etimsFiscal,
	qrCodeDataUrl,
	documentTitle,
}: AgencyInvoicePdfPageProps) {
	const hasFiscalFooter = Boolean(etimsFiscal);

	return (
		<Page
			size="A4"
			style={hasFiscalFooter ? pdfContainers.pageWithEtimsFooter : pdfContainers.page}
		>
			{etimsFiscal ? <EtimsFiscalFooterPdf fields={etimsFiscal} /> : null}
			<PdfDetails
				companyDetails={companyDetails}
				invoiceDetails={invoiceDetails}
				invoiceTerms={invoiceTerms}
				paymentDetails={{
					...paymentDetails,
					qrCodeDataUrl,
				}}
				yourDetails={yourDetails}
				documentTitle={documentTitle}
			/>
		</Page>
	);
}
