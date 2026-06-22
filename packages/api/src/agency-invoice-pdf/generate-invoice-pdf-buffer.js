import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Agency invoice PDF - same layout as agency.invoices.$id download (PdfDetails + buildInvoicePdfDetails).
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { AgencyInvoicePdfPage } from "./agency-invoice-pdf-page";
import { buildInvoicePdfDetails } from "./build-invoice-pdf-details";
import { registerAgencyInvoicePdfFonts } from "./register-fonts";
async function getQrCodeDataUrl(qrCodeValue) {
    try {
        const QRCodeUtil = await import("qrcode");
        return await QRCodeUtil.toDataURL(qrCodeValue, { width: 120, margin: 1 });
    }
    catch {
        return undefined;
    }
}
export async function generateAgencyInvoicePdfBuffer(invoice) {
    await registerAgencyInvoicePdfFonts();
    const pdfData = buildInvoicePdfDetails(invoice);
    const etimsUrl = pdfData.etimsFiscal?.verificationUrl ?? pdfData.paymentDetails.etimsVerificationUrl;
    const qrCodeDataUrl = etimsUrl ? await getQrCodeDataUrl(etimsUrl) : undefined;
    const doc = (_jsx(Document, { children: _jsx(AgencyInvoicePdfPage, { ...pdfData, qrCodeDataUrl: qrCodeDataUrl }) }));
    return await renderToBuffer(doc);
}
