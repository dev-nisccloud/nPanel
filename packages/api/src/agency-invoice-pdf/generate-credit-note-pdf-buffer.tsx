import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import type { CreditNoteDetail } from "../routers/invoicing/schemas";
import { AgencyInvoicePdfPage } from "./agency-invoice-pdf-page";
import { buildCreditNotePdfDetails } from "./build-credit-note-pdf-details";
import { registerAgencyInvoicePdfFonts } from "./register-fonts";

async function getQrCodeDataUrl(qrCodeValue: string): Promise<string | undefined> {
	try {
		const QRCodeUtil = await import("qrcode");
		return await QRCodeUtil.toDataURL(qrCodeValue, { width: 120, margin: 1 });
	} catch {
		return undefined;
	}
}

export async function generateAgencyCreditNotePdfBuffer(
	creditNote: CreditNoteDetail,
): Promise<Buffer> {
	await registerAgencyInvoicePdfFonts();

	const pdfData = buildCreditNotePdfDetails(creditNote);
	const etimsUrl = pdfData.etimsFiscal?.verificationUrl ?? pdfData.paymentDetails.etimsVerificationUrl;
	const qrCodeDataUrl = etimsUrl ? await getQrCodeDataUrl(etimsUrl) : undefined;

	const doc = (
		<Document>
			<AgencyInvoicePdfPage {...pdfData} qrCodeDataUrl={qrCodeDataUrl} />
		</Document>
	);

	return await renderToBuffer(doc);
}
