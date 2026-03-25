/**
 * Server-only: generate invoice PDF as Buffer. Used by the NISC worker to attach PDF to the Invoice success email.
 */
import { Document, Page } from "@react-pdf/renderer";
import { renderToBuffer } from "@npanel/invoice";
import type { InvoiceForPdfData } from "./invoice-pdf-data";
import { convertInvoiceToPdfData } from "./invoice-pdf-data";
import { PdfDetails } from "@/routes/agency.invoices.create._components/form/pdfDetails";
import { pdfContainers } from "@/lib/pdfStyles";

async function getQrCodeDataUrl(qrCodeValue: string): Promise<string | undefined> {
	try {
		const QRCodeUtil = await import("qrcode");
		return await QRCodeUtil.toDataURL(qrCodeValue, { width: 120, margin: 1 });
	} catch {
		return undefined;
	}
}

/**
 * Renders the given invoice (API InvoiceDetail / InvoiceForPdfData shape) to a PDF buffer.
 * Uses the same layout and styling as the manual invoice download.
 */
export async function generateInvoicePdfBuffer(invoice: InvoiceForPdfData): Promise<Buffer> {
	const pdfData = convertInvoiceToPdfData(invoice);
	const qrCodeDataUrl = pdfData.paymentDetails.qrCodeValue
		? await getQrCodeDataUrl(pdfData.paymentDetails.qrCodeValue)
		: undefined;

	const doc = (
		<Document>
			<Page size="A4" style={pdfContainers.page}>
				<PdfDetails
					companyDetails={pdfData.companyDetails}
					invoiceDetails={pdfData.invoiceDetails}
					invoiceTerms={pdfData.invoiceTerms}
					paymentDetails={{
						...pdfData.paymentDetails,
						qrCodeDataUrl,
					}}
					yourDetails={pdfData.yourDetails}
				/>
			</Page>
		</Document>
	);

	return await renderToBuffer(doc);
}

