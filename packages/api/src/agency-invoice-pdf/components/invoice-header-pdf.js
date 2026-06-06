import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import { pdfBrandingLogoBox, pdfTypography } from "../pdf-styles";
export const InvoiceHeaderPdf = ({ yourEmail, yourName, yourAddress, yourCity, yourState, yourCountry, yourLogo, yourLogoWidth, yourTaxId, yourZip, }) => {
    const logoFrameW = yourLogoWidth ?? pdfBrandingLogoBox.width;
    const logoFrameH = (logoFrameW / pdfBrandingLogoBox.width) * pdfBrandingLogoBox.height;
    return (_jsxs(View, { children: [_jsxs(View, { style: {
                    display: "flex",
                    flexDirection: "row",
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingLeft: 40,
                    paddingRight: 40,
                    justifyContent: "space-between",
                }, children: [_jsx(View, { style: { justifyContent: "flex-start", alignItems: "flex-start" }, children: yourLogo && (_jsx(View, { style: { width: logoFrameW, height: logoFrameH }, children: _jsx(Image, { src: yourLogo, style: {
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    borderRadius: 6,
                                } }) })) }), _jsxs(View, { style: { flex: 1, alignItems: "flex-end" }, children: [yourName && (_jsx(Text, { style: { ...pdfTypography.description, fontWeight: "bold", marginBottom: 4 }, children: yourName })), yourEmail && (_jsx(Text, { style: { ...pdfTypography.description, marginBottom: 4 }, children: yourEmail })), _jsxs(View, { style: { ...pdfTypography.description, alignItems: "flex-end" }, children: [yourAddress && _jsx(Text, { style: { marginBottom: 2 }, children: yourAddress }), (yourCity || yourState || yourZip) && (_jsxs(Text, { style: { marginBottom: 2 }, children: [yourCity, ", ", yourState, " ", yourZip] })), yourCountry && (_jsx(Text, { style: { marginBottom: 2 }, children: yourCountry })), yourTaxId && _jsxs(Text, { children: ["Tax ID:", yourTaxId] })] })] })] }), _jsxs(View, { style: {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    paddingLeft: 40,
                    paddingRight: 40,
                    paddingTop: 4,
                    paddingBottom: 2,
                }, children: [_jsx(View, { style: {
                            flex: 1,
                            borderTopWidth: 1,
                            borderTopStyle: "dashed",
                            borderTopColor: "#d1d5db",
                        } }), _jsx(Text, { style: {
                            paddingLeft: 16,
                            paddingRight: 16,
                            fontSize: 12,
                            fontWeight: "semibold",
                            color: "#374151",
                            textTransform: "uppercase",
                        }, children: "Invoice" }), _jsx(View, { style: {
                            flex: 1,
                            borderTopWidth: 1,
                            borderTopStyle: "dashed",
                            borderTopColor: "#d1d5db",
                        } })] })] }));
};
