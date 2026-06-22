import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Page } from "@react-pdf/renderer";
import { EtimsFiscalFooterPdf } from "./components/etims-fiscal-footer-pdf";
import { PdfDetails } from "./components/pdf-details";
import { pdfContainers } from "./pdf-styles";
/**
 * Single A4 invoice page with optional fixed KRA eTIMS fiscal footer on every page.
 */
export function AgencyInvoicePdfPage({ yourDetails, companyDetails, invoiceDetails, paymentDetails, invoiceTerms, etimsFiscal, qrCodeDataUrl, documentTitle, }) {
    const hasFiscalFooter = Boolean(etimsFiscal);
    return (_jsxs(Page, { size: "A4", style: hasFiscalFooter ? pdfContainers.pageWithEtimsFooter : pdfContainers.page, children: [etimsFiscal ? _jsx(EtimsFiscalFooterPdf, { fields: etimsFiscal }) : null, _jsx(PdfDetails, { companyDetails: companyDetails, invoiceDetails: invoiceDetails, invoiceTerms: invoiceTerms, paymentDetails: {
                    ...paymentDetails,
                    qrCodeDataUrl,
                }, yourDetails: yourDetails, documentTitle: documentTitle })] }));
}
