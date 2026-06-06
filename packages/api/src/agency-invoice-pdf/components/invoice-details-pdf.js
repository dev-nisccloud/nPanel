import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { currencyList } from "../currency-map";
import { pdfTypography, pdfUtils } from "../pdf-styles";
const hasLineAmount = (amount) => amount !== undefined && amount !== null && `${amount}` !== "";
function LineItemDescriptionCell({ text, lineStyle, compactLineItems, }) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const body = lines.length > 0 ? lines : [text];
    return (_jsx(View, { style: { flex: 1, minWidth: 0, paddingRight: 12 }, children: body.map((line, index) => (_jsx(Text, { wrap: true, style: {
                ...lineStyle,
                ...(index > 0 ? { marginTop: compactLineItems ? 2 : 4 } : {}),
            }, children: line }, `${index}-${line.slice(0, 24)}`))) }));
}
export const InvoiceDetailsPdf = ({ note, discount, taxRate, items, currency = "KES", compactLineItems = false, }) => {
    const lineText = compactLineItems
        ? pdfTypography.itemLineCompact
        : pdfTypography.itemDescription;
    const headerText = compactLineItems
        ? pdfTypography.itemLineHeaderCompact
        : pdfTypography.title;
    const totalsText = compactLineItems
        ? { ...pdfTypography.itemDescription, fontSize: 8, fontWeight: "medium" }
        : pdfTypography.itemDescription;
    const currencyType = currency;
    const currencyDetails = currencyList.find((currency) => currency.value.toLowerCase() === currencyType.toLowerCase())?.details;
    const itemsNormalized = items.map((item) => ({
        ...item,
        amount: item.amount !== undefined &&
            item.amount !== null &&
            `${item.amount}` !== ""
            ? roundMoney2(Number(item.amount))
            : item.amount,
    }));
    const subtotal = roundMoney2(calculateTotalAmount(itemsNormalized));
    const discountAmount = roundMoney2(subtotal - (discount ? +discount : 0));
    const taxAmount = roundMoney2(discountAmount * ((taxRate ? +taxRate : 0) / 100));
    const totalAmount = roundMoney2(discountAmount + taxAmount);
    return (_jsxs(View, { children: [_jsxs(View, { style: pdfUtils.flexRowItemCenter, children: [_jsx(View, { style: {
                            flex: 1,
                            paddingHorizontal: 40,
                            paddingVertical: compactLineItems ? 6 : 16,
                        }, children: _jsx(Text, { style: headerText, children: "Description" }) }), _jsxs(View, { style: {
                            flex: 1,
                            ...pdfUtils.flexRowItemCenter,
                            // Match body rows: numeric block uses the same left inset so QTY lines up.
                            paddingLeft: compactLineItems ? 48 : 80,
                            paddingRight: 40,
                            paddingVertical: compactLineItems ? 6 : 16,
                        }, children: [_jsx(View, { style: { flex: 1 }, children: _jsx(Text, { style: headerText, children: "QTY" }) }), _jsx(View, { style: { flex: 1 }, children: _jsx(Text, { style: headerText, children: "Price" }) }), _jsx(View, { style: { flex: 1, textAlign: "right" }, children: _jsx(Text, { style: headerText, children: "Amount" }) })] })] }), itemsNormalized.map(({ itemDescription, amount, qty }, index) => {
                const containerStyle = {
                    marginHorizontal: 40,
                    paddingVertical: compactLineItems ? 5 : 14,
                    ...pdfUtils.borderBottom,
                    ...pdfUtils.flexRowItemCenter,
                };
                const borderStyle = index === 0 ? pdfUtils.borderTop : {};
                return (_jsxs(View, { style: {
                        ...containerStyle,
                        ...borderStyle,
                    }, children: [_jsx(LineItemDescriptionCell, { text: itemDescription ?? "", lineStyle: lineText, compactLineItems: !!compactLineItems }), _jsxs(View, { style: {
                                flex: 1,
                                ...pdfUtils.flexRowItemCenter,
                                paddingLeft: compactLineItems ? 48 : 80,
                            }, children: [_jsx(Text, { style: { flex: 1, ...lineText }, children: qty ? qty : "-" }), _jsx(Text, { style: {
                                        flex: 1,
                                        ...lineText,
                                        flexWrap: "wrap",
                                        maxWidth: 80,
                                    }, children: hasLineAmount(amount) ? formatPdfMoney(Number(amount)) : "" }), _jsxs(Text, { style: {
                                        flex: 1,
                                        ...lineText,
                                        textAlign: "right",
                                        flexWrap: "wrap",
                                        maxWidth: 120,
                                    }, children: [currencyDetails?.currencySymbol, hasLineAmount(amount)
                                            ? formatPdfMoney((qty ? +qty : 1) * Number(amount))
                                            : ""] })] })] }, index));
            }), _jsxs(View, { style: pdfUtils.flexRowItemCenter, children: [_jsx(View, { style: { flex: 1, paddingTop: 24 }, children: note && (_jsxs(View, { style: { paddingHorizontal: 40 }, children: [_jsx(Text, { style: headerText, children: "Note" }), _jsx(Text, { style: lineText, children: note })] })) }), _jsxs(View, { style: { flex: 1 }, children: [_jsxs(View, { style: {
                                    marginHorizontal: 40,
                                    paddingVertical: compactLineItems ? 5 : 14,
                                    ...pdfUtils.flexRowItemCenter,
                                    ...pdfUtils.borderBottom,
                                }, children: [_jsx(Text, { style: { ...totalsText, flex: 1 }, children: "Subtotal" }), _jsxs(Text, { style: {
                                            ...totalsText,
                                            flex: 1,
                                            textAlign: "right",
                                        }, children: [currencyDetails?.currencySymbol, formatPdfMoney(subtotal)] })] }), discount && (_jsxs(View, { style: {
                                    marginHorizontal: 40,
                                    paddingVertical: compactLineItems ? 5 : 14,
                                    ...pdfUtils.flexRowItemCenter,
                                    ...pdfUtils.borderBottom,
                                }, children: [_jsx(Text, { style: { ...totalsText, flex: 1 }, children: "Discount" }), _jsxs(Text, { style: {
                                            ...totalsText,
                                            flex: 1,
                                            textAlign: "right",
                                        }, children: [currencyDetails?.currencySymbol, discount ? formatPdfMoney(+discount) : ""] })] })), taxRate && (_jsxs(View, { style: {
                                    marginHorizontal: 40,
                                    paddingVertical: compactLineItems ? 5 : 14,
                                    ...pdfUtils.flexRowItemCenter,
                                    ...pdfUtils.borderBottom,
                                }, children: [_jsxs(Text, { style: { ...totalsText, flex: 1 }, children: ["Tax (", taxRate, ")%"] }), _jsxs(Text, { style: {
                                            ...totalsText,
                                            flex: 1,
                                            textAlign: "right",
                                        }, children: [currencyDetails?.currencySymbol, formatPdfMoney(taxAmount)] })] })), _jsxs(View, { style: {
                                    marginHorizontal: 40,
                                    paddingVertical: compactLineItems ? 5 : 14,
                                    ...pdfUtils.flexRowItemCenter,
                                }, children: [_jsx(Text, { style: { ...totalsText, flex: 1 }, children: "Amount" }), _jsxs(Text, { style: {
                                            ...totalsText,
                                            flex: 1,
                                            textAlign: "right",
                                            fontWeight: "bold",
                                            flexWrap: "wrap",
                                        }, children: [currencyDetails?.currencySymbol, formatPdfMoney(totalAmount)] })] })] })] })] }));
};
const calculateTotalAmount = (items) => items.reduce((total, item) => {
    const quantity = item.qty ? +item.qty : 1;
    const amount = hasLineAmount(item.amount) ? +item.amount : 0;
    return total + quantity * amount;
}, 0);
const roundMoney2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const addCommasToNumber = (number) => {
    const fixed = roundMoney2(number);
    let numberString = fixed.toFixed(2);
    const parts = numberString.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
};
const formatPdfMoney = (n) => addCommasToNumber(n);
