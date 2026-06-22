import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { getEtimsFiscalFooterFields } from "../../lib/etims-fiscal-fields";
const footerTextStyle = {
    fontSize: 6.5,
    color: "#374151",
    lineHeight: 1.35,
};
/**
 * KRA eTIMS fiscal text block — fixed footer on synced invoices (QR lives beside payment details).
 */
export const EtimsFiscalFooterPdf = ({ fields, fixed = true, }) => {
    const rows = getEtimsFiscalFooterFields(fields);
    return (_jsxs(View, { fixed: fixed, style: {
            position: "absolute",
            bottom: 20,
            left: 40,
            right: 40,
            borderTopWidth: 1,
            borderTopStyle: "solid",
            borderTopColor: "#e5e7eb",
            paddingTop: 8,
        }, children: [rows.length > 0 ? (_jsx(Text, { style: footerTextStyle, wrap: true, children: rows.map((row, index) => (_jsxs(React.Fragment, { children: [index > 0 ? _jsx(Text, { children: " | " }) : null, _jsxs(Text, { style: { fontWeight: "bold" }, children: [row.label, ": "] }), _jsx(Text, { children: row.value })] }, row.label))) })) : null, fields.verificationUrl ? (_jsx(Text, { style: {
                    fontSize: 6,
                    color: "#6b7280",
                    marginTop: 4,
                    lineHeight: 1.35,
                }, wrap: true, children: fields.verificationUrl })) : null] }));
};
