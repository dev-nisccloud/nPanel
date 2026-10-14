import React from "react";
import { Page, Text } from "@react-pdf/renderer";
import { InvoicePageFooter } from "./components/invoice-page-footer";
import { PdfDetails } from "./components/pdf-details";
import { pdfContainers } from "./pdf-styles";
import type { EtimsFiscalFields } from "./types";
import { ensureEtimsPrintFields } from "../lib/etims-fiscal-fields";
import { isKraCopyReceiptLabel, isKraCopySalesType } from "../lib/etims-scu-print";
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
	const isCopyReceipt =
		Boolean(invoiceDetails.isCopyReceipt) ||
		isKraCopySalesType(etimsFiscal?.salesTyCd) ||
		isKraCopyReceiptLabel(etimsFiscal?.receiptLabel);
	const fiscal = ensureEtimsPrintFields(etimsFiscal, {
		tisReceiptNumber: invoiceTerms.invoiceNumber ?? etimsFiscal?.tisReceiptNumber ?? null,
		tisIssuedAt: invoiceTerms.issueDate ?? null,
		originalCuInvoiceNo: invoiceTerms.originalCuInvoiceNo ?? null,
		itemCount: invoiceDetails.items.length,
		isCreditNote,
		sdcId: etimsFiscal?.sdcId ?? invoiceTerms.scuId ?? null,
		salesTyCd: etimsFiscal?.salesTyCd,
	});

	return (
		<Page size="A4" style={pdfContainers.pageWithEtimsFooter}>
			{isCopyReceipt ? (
				<Text
					fixed
					style={{
						position: "absolute",
						top: 320,
						left: 40,
						right: 40,
						textAlign: "center",
						fontSize: 72,
						fontWeight: "bold",
						color: "#9ca3af",
						opacity: 0.16,
						letterSpacing: 10,
						transform: "rotate(-28deg)",
					}}
				>
					COPY
				</Text>
			) : null}
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
