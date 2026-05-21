/**
 * Agency invoice PDF — same layout as agency.invoices.$id download (PdfDetails + buildInvoicePdfDetails).
 */
import React from "react";
import { Document, Page, renderToBuffer } from "@react-pdf/renderer";
import type { InvoiceDetail } from "../routers/invoicing/schemas";
import { buildInvoicePdfDetails } from "./build-invoice-pdf-details";
import { PdfDetails } from "./components/pdf-details";
import { pdfContainers } from "./pdf-styles";
import { registerAgencyInvoicePdfFonts } from "./register-fonts";

async function getQrCodeDataUrl(qrCodeValue: string): Promise<string | undefined> {
	try {
		const QRCodeUtil = await import("qrcode");
		return await QRCodeUtil.toDataURL(qrCodeValue, { width: 120, margin: 1 });
	} catch {
		return undefined;
	}
}

export async function generateAgencyInvoicePdfBuffer(invoice: InvoiceDetail): Promise<Buffer> {
	await registerAgencyInvoicePdfFonts();

	const pdfData = buildInvoicePdfDetails(invoice);
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
