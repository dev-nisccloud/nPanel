import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import { pdfTypography } from "../pdf-styles";
function PaymentFieldRow({ label, labelWidth, lineStyle, value, }) {
    return (_jsxs(View, { style: {
            flexDirection: "row",
            alignItems: "flex-start",
        }, children: [_jsx(View, { style: { width: labelWidth, paddingRight: 8 }, children: _jsx(Text, { style: { ...lineStyle, fontWeight: "bold" }, children: label }) }), _jsx(View, { style: { flex: 1, minWidth: 0 }, children: _jsx(Text, { style: lineStyle, wrap: true, children: value }) })] }));
}
export const PaymentDetailsPdf = ({ paymentMethod = "bank", bankName, accountNumber, accountName, branchName, branchCode, swiftCode, mpesaPaybillNumber, mpesaAccountNumber, mpesaInstructions, chequeDeliveryAddress, chequeInstructions, qrCodeValue, qrCodeDataUrl, compactLineItems = false, }) => {
    const lineText = compactLineItems
        ? pdfTypography.itemLineCompact
        : pdfTypography.itemDescription;
    const sectionTitleText = compactLineItems
        ? pdfTypography.itemLineHeaderCompact
        : pdfTypography.title;
    const labelColWidth = compactLineItems ? 88 : 128;
    const renderPaymentDetails = () => {
        if (paymentMethod === "bank") {
            return (_jsxs(View, { style: { flexDirection: "column", gap: 5 }, children: [_jsx(PaymentFieldRow, { label: "Bank Name", labelWidth: labelColWidth, lineStyle: lineText, value: bankName ? bankName : "-" }), _jsx(PaymentFieldRow, { label: "Account Number", labelWidth: labelColWidth, lineStyle: lineText, value: accountNumber ? accountNumber : "-" }), _jsx(PaymentFieldRow, { label: "Account Name", labelWidth: labelColWidth, lineStyle: lineText, value: accountName ? accountName : "-" }), branchName ? (_jsx(PaymentFieldRow, { label: "Branch Name", labelWidth: labelColWidth, lineStyle: lineText, value: branchName })) : null, branchCode ? (_jsx(PaymentFieldRow, { label: "Branch Code", labelWidth: labelColWidth, lineStyle: lineText, value: branchCode })) : null, swiftCode ? (_jsx(PaymentFieldRow, { label: "Swift Code", labelWidth: labelColWidth, lineStyle: lineText, value: swiftCode })) : null] }));
        }
        if (paymentMethod === "mpesa") {
            return (_jsxs(View, { style: { flexDirection: "column", gap: 5 }, children: [_jsx(PaymentFieldRow, { label: "Paybill Number", labelWidth: labelColWidth, lineStyle: lineText, value: mpesaPaybillNumber ? mpesaPaybillNumber : "-" }), mpesaAccountNumber ? (_jsx(PaymentFieldRow, { label: "Account Number", labelWidth: labelColWidth, lineStyle: lineText, value: mpesaAccountNumber })) : null, mpesaInstructions ? (_jsx(PaymentFieldRow, { label: "Instructions", labelWidth: labelColWidth, lineStyle: lineText, value: mpesaInstructions })) : null] }));
        }
        if (paymentMethod === "cheque") {
            return (_jsxs(View, { style: { flexDirection: "column", gap: 5 }, children: [chequeDeliveryAddress ? (_jsx(PaymentFieldRow, { label: "Delivery Address", labelWidth: labelColWidth, lineStyle: lineText, value: chequeDeliveryAddress })) : null, chequeInstructions ? (_jsx(PaymentFieldRow, { label: "Instructions", labelWidth: labelColWidth, lineStyle: lineText, value: chequeInstructions })) : null] }));
        }
        return null;
    };
    const getPaymentTitle = () => {
        switch (paymentMethod) {
            case "bank":
                return "Bank Details";
            case "mpesa":
                return "MPESA Details";
            case "cheque":
                return "Cheque Details";
            default:
                return "Payment Details";
        }
    };
    return (_jsxs(View, { style: {
            display: "flex",
            flexDirection: "row",
        }, children: [_jsxs(View, { style: {
                    flex: qrCodeDataUrl ? 1 : 2,
                    paddingLeft: 40,
                    paddingRight: 12,
                    paddingVertical: 16,
                    flexDirection: "column",
                }, children: [_jsx(Text, { style: { paddingBottom: 12, ...sectionTitleText }, children: getPaymentTitle() }), renderPaymentDetails()] }), qrCodeDataUrl ? (_jsxs(View, { style: {
                    flex: 1,
                    paddingLeft: 12,
                    paddingRight: 40,
                    paddingVertical: 16,
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "flex-start",
                }, children: [_jsx(Text, { style: { ...sectionTitleText, paddingBottom: 12 }, children: "eTIMS verification" }), _jsx(Image, { src: qrCodeDataUrl, style: {
                            width: 96,
                            height: 96,
                        } })] })) : null] }));
};
