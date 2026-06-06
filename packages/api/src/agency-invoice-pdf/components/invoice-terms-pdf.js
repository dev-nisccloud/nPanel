import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { pdfInvoiceMeta } from "../pdf-styles";
export const InvoiceTermsPdf = ({ invoiceNumber, issueDate, dueDate, }) => (_jsx(View, { style: {
        paddingTop: 8,
        paddingBottom: 8,
    }, children: _jsxs(View, { style: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
        }, children: [_jsx(View, { style: { flex: 1 } }), _jsxs(View, { style: { flex: 1, alignItems: "flex-end" }, children: [_jsxs(View, { style: pdfInvoiceMeta.rowTerms, children: [_jsx(Text, { style: pdfInvoiceMeta.label, children: "INVOICE NO" }), _jsx(Text, { style: [pdfInvoiceMeta.value, { maxWidth: 160, textAlign: "right" }], wrap: true, children: invoiceNumber || "-" })] }), _jsxs(View, { style: pdfInvoiceMeta.rowTerms, children: [_jsx(Text, { style: pdfInvoiceMeta.label, children: "ISSUED" }), _jsx(Text, { wrap: false, style: pdfInvoiceMeta.value, children: issueDate
                                    ? format(typeof issueDate === "string" ? new Date(issueDate) : issueDate, "dd-MM-yyyy")
                                    : "-" })] }), _jsxs(View, { style: pdfInvoiceMeta.rowTerms, children: [_jsx(Text, { style: pdfInvoiceMeta.label, children: "DUE DATE" }), _jsx(Text, { wrap: false, style: pdfInvoiceMeta.value, children: dueDate
                                    ? format(typeof dueDate === "string" ? new Date(dueDate) : dueDate, "dd-MM-yyyy")
                                    : "-" })] })] })] }) }));
