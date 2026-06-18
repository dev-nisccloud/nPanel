import React from "react";
import { Document } from "@react-pdf/renderer";
import type { CreditNoteDetail } from "@npanel/api/routers/invoicing/schemas";
import { AgencyInvoicePdfPage } from "@npanel/api/agency-invoice-pdf/agency-invoice-pdf-page";
import { buildCreditNotePdfDetails } from "@npanel/api/agency-invoice-pdf/build-credit-note-pdf-details";

async function getEtimsQrCodeDataUrl(url: string | null | undefined): Promise<string | undefined> {
	if (!url) return undefined;
	try {
		const QRCodeUtil = await import("qrcode");
		return await QRCodeUtil.toDataURL(url, { width: 120, margin: 1 });
	} catch {
		return undefined;
	}
}

/** React-PDF document for credit notes (same layout as invoices). */
export async function buildAgencyCreditNotePdfDocument(creditNote: CreditNoteDetail) {
	const pdfData = buildCreditNotePdfDetails(creditNote);
	const etimsUrl = pdfData.etimsFiscal?.verificationUrl ?? pdfData.paymentDetails.etimsVerificationUrl;
	const qrCodeDataUrl = await getEtimsQrCodeDataUrl(etimsUrl);

	return (
		<Document>
			<AgencyInvoicePdfPage {...pdfData} qrCodeDataUrl={qrCodeDataUrl} />
		</Document>
	);
}
