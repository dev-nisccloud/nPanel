import React from "react";
import { Document } from "@react-pdf/renderer";
import type { InvoiceDetail } from "@npanel/api/routers/invoicing/schemas";
import { AgencyInvoicePdfPage } from "@npanel/api/agency-invoice-pdf/agency-invoice-pdf-page";
import { buildInvoicePdfDetails } from "@npanel/api/agency-invoice-pdf/build-invoice-pdf-details";

async function getEtimsQrCodeDataUrl(url: string | null | undefined): Promise<string | undefined> {
	if (!url) return undefined;
	try {
		const QRCodeUtil = await import("qrcode");
		return await QRCodeUtil.toDataURL(url, { width: 120, margin: 1 });
	} catch {
		return undefined;
	}
}

/** React-PDF document for agency invoices (fixed eTIMS fiscal footer when KRA-synced). */
export async function buildAgencyInvoicePdfDocument(invoice: InvoiceDetail) {
	const pdfData = buildInvoicePdfDetails(invoice);
	const etimsUrl = pdfData.etimsFiscal?.verificationUrl ?? pdfData.paymentDetails.etimsVerificationUrl;
	const qrCodeDataUrl = await getEtimsQrCodeDataUrl(etimsUrl);

	return (
		<Document>
			<AgencyInvoicePdfPage {...pdfData} qrCodeDataUrl={qrCodeDataUrl} />
		</Document>
	);
}
