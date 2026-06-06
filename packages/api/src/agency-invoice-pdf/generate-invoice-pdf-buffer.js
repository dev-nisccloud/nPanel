import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Agency invoice PDF - same layout as agency.invoices.$id download (PdfDetails + buildInvoicePdfDetails).
 */
import React from "react";
import { Document, Page, renderToBuffer } from "@react-pdf/renderer";
import { buildInvoicePdfDetails } from "./build-invoice-pdf-details";
import { PdfDetails } from "./components/pdf-details";
import { pdfContainers } from "./pdf-styles";
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
    const qrCodeDataUrl = pdfData.paymentDetails.qrCodeValue
        ? await getQrCodeDataUrl(pdfData.paymentDetails.qrCodeValue)
        : undefined;
    const doc = (_jsx(Document, { children: _jsx(Page, { size: "A4", style: pdfContainers.page, children: _jsx(PdfDetails, { companyDetails: pdfData.companyDetails, invoiceDetails: pdfData.invoiceDetails, invoiceTerms: pdfData.invoiceTerms, paymentDetails: {
                    ...pdfData.paymentDetails,
                    qrCodeDataUrl,
                }, yourDetails: pdfData.yourDetails }) }) }));
    return await renderToBuffer(doc);
}
