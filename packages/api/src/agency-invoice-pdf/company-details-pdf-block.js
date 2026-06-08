import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Bill To block for invoice PDFs.
 *
 * Root cause of “huge gaps” between lines: React-PDF/Yoga lays out each child `View` as a
 * flex item; sibling rows can still get inflated cross-axis sizes. Stacking many `View`s
 * each wrapping one `Text` is unreliable.
 *
 * Fix: one `Text` node with newline-separated lines. Vertical rhythm is **only** `lineHeight`
 * inside that run (no flex between rows).
 */
import * as React from "react";
import { Text, View } from "@react-pdf/renderer";
import { pdfContainers, pdfInvoiceMeta } from "./pdf-styles";
function buildBillToBody(input) {
    const cityLine = [input.companyCity, input.companyState, input.companyZip]
        .filter((x) => x != null && String(x).trim() !== "")
        .join(", ");
    const parts = [
        input.companyName,
        input.email,
        input.companyAddress,
        cityLine || null,
        input.companyCountry,
        input.companyTaxId != null && String(input.companyTaxId).trim() !== ""
            ? `Tax ID: ${input.companyTaxId}`
            : null,
    ];
    return parts
        .filter((v) => v != null && String(v).trim() !== "")
        .map((v) => String(v).trim())
        .join("\n");
}
export function PdfCompanyDetailsBlock(props) {
    const body = buildBillToBody(props);
    const hasLabel = props.label != null && String(props.label).trim() !== "";
    if (!body && !hasLabel) {
        return null;
    }
    return (_jsx(View, { style: pdfContainers.CompanyDetails, children: _jsxs(View, { style: { paddingTop: 4, paddingBottom: 4 }, children: [hasLabel ? (_jsx(Text, { style: [pdfInvoiceMeta.label, { marginBottom: 4 }], children: props.label })) : null, body ? (_jsx(Text, { style: pdfInvoiceMeta.valueBillTo, wrap: true, children: body })) : null] }) }));
}
