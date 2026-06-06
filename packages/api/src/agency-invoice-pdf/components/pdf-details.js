import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from "@react-pdf/renderer";
import { InvoiceHeaderPdf } from "./invoice-header-pdf";
import { InvoiceTermsPdf } from "./invoice-terms-pdf";
import { CompanyDetailsPdf } from "./company-details-pdf";
import { InvoiceDetailsPdf } from "./invoice-details-pdf";
import { PaymentDetailsPdf } from "./payment-details-pdf";
import { pdfUtils } from "../pdf-styles";
export const PdfDetails = ({ yourDetails, companyDetails, invoiceDetails, paymentDetails, invoiceTerms, }) => (_jsxs(View, { children: [_jsx(InvoiceHeaderPdf, { ...yourDetails }), _jsxs(View, { style: {
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                borderBottomWidth: 1,
                borderBottomStyle: "dashed",
                borderBottomColor: "#e5e7eb",
                width: "100%",
            }, children: [_jsx(View, { style: {
                        flex: 1,
                        minWidth: 0,
                        borderRightWidth: 1,
                        borderRightStyle: "dashed",
                        borderRightColor: "#e5e7eb",
                        overflow: 'hidden',
                    }, children: _jsx(CompanyDetailsPdf, { ...companyDetails }) }), _jsx(View, { style: {
                        flex: 1,
                        minWidth: 0,
                        paddingLeft: 20,
                        paddingRight: 40,
                    }, children: _jsx(InvoiceTermsPdf, { ...invoiceTerms }) })] }), _jsxs(View, { children: [_jsx(View, { style: pdfUtils.borderBottom, children: _jsx(InvoiceDetailsPdf, { ...invoiceDetails }) }), _jsx(View, { children: _jsx(PaymentDetailsPdf, { ...paymentDetails, compactLineItems: invoiceDetails.compactLineItems }) })] })] }));
