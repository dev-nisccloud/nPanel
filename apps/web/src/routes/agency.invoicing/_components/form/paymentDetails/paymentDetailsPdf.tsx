/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import { pdfTypography } from "@/lib/pdfStyles";
import type { PaymentDetails } from "@/routes/agency.invoicing/types";

interface PaymentDetailsPdfProps extends PaymentDetails {
  qrCodeDataUrl?: string;
  /** Match `InvoiceDetailsPdf` line / header typography (e.g. cron compact invoices). */
  compactLineItems?: boolean;
}

function PaymentFieldRow({
  label,
  labelWidth,
  lineStyle,
  value,
}: {
  label: string;
  labelWidth: number;
  lineStyle: typeof pdfTypography.itemDescription | typeof pdfTypography.itemLineCompact;
  value: string | number;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
      }}
    >
      <View style={{ width: labelWidth, paddingRight: 8 }}>
        <Text style={{ ...lineStyle, fontWeight: "bold" }}>{label}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={lineStyle} wrap>
          {value}
        </Text>
      </View>
    </View>
  );
}

export const PaymentDetailsPdf: React.FC<PaymentDetailsPdfProps> = ({
  paymentMethod = "bank",
  bankName,
  accountNumber,
  accountName,
  branchName,
  branchCode,
  swiftCode,
  mpesaPaybillNumber,
  mpesaAccountNumber,
  mpesaInstructions,
  chequeDeliveryAddress,
  chequeInstructions,
  qrCodeValue,
  qrCodeDataUrl,
  compactLineItems = false,
}) => {
  const lineText = compactLineItems
    ? pdfTypography.itemLineCompact
    : pdfTypography.itemDescription;
  const sectionTitleText = compactLineItems
    ? pdfTypography.itemLineHeaderCompact
    : pdfTypography.title;
  const labelColWidth = compactLineItems ? 88 : 128;

  const renderPaymentDetails = () => {
    if (paymentMethod === "bank") {
      return (
        <View style={{ flexDirection: "column", gap: 5 }}>
          <PaymentFieldRow
            label="Bank Name"
            labelWidth={labelColWidth}
            lineStyle={lineText}
            value={bankName ? bankName : "-"}
          />
          <PaymentFieldRow
            label="Account Number"
            labelWidth={labelColWidth}
            lineStyle={lineText}
            value={accountNumber ? accountNumber : "-"}
          />
          <PaymentFieldRow
            label="Account Name"
            labelWidth={labelColWidth}
            lineStyle={lineText}
            value={accountName ? accountName : "-"}
          />
          {branchName ? (
            <PaymentFieldRow
              label="Branch Name"
              labelWidth={labelColWidth}
              lineStyle={lineText}
              value={branchName}
            />
          ) : null}
          {branchCode ? (
            <PaymentFieldRow
              label="Branch Code"
              labelWidth={labelColWidth}
              lineStyle={lineText}
              value={branchCode}
            />
          ) : null}
          {swiftCode ? (
            <PaymentFieldRow
              label="Swift Code"
              labelWidth={labelColWidth}
              lineStyle={lineText}
              value={swiftCode}
            />
          ) : null}
        </View>
      );
    }

    if (paymentMethod === "mpesa") {
      return (
        <View style={{ flexDirection: "column", gap: 5 }}>
          <PaymentFieldRow
            label="Paybill Number"
            labelWidth={labelColWidth}
            lineStyle={lineText}
            value={mpesaPaybillNumber ? mpesaPaybillNumber : "-"}
          />
          {mpesaAccountNumber ? (
            <PaymentFieldRow
              label="Account Number"
              labelWidth={labelColWidth}
              lineStyle={lineText}
              value={mpesaAccountNumber}
            />
          ) : null}
          {mpesaInstructions ? (
            <PaymentFieldRow
              label="Instructions"
              labelWidth={labelColWidth}
              lineStyle={lineText}
              value={mpesaInstructions}
            />
          ) : null}
        </View>
      );
    }

    if (paymentMethod === "cheque") {
      return (
        <View style={{ flexDirection: "column", gap: 5 }}>
          {chequeDeliveryAddress ? (
            <PaymentFieldRow
              label="Delivery Address"
              labelWidth={labelColWidth}
              lineStyle={lineText}
              value={chequeDeliveryAddress}
            />
          ) : null}
          {chequeInstructions ? (
            <PaymentFieldRow
              label="Instructions"
              labelWidth={labelColWidth}
              lineStyle={lineText}
              value={chequeInstructions}
            />
          ) : null}
        </View>
      );
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

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
      }}
    >
      <View
        style={{
          flex: 1,
          paddingLeft: 40,
          paddingRight: 12,
          paddingVertical: 16,
          flexDirection: "column",
        }}
      >
        <Text style={{ paddingBottom: 12, ...sectionTitleText }}>
          {getPaymentTitle()}
        </Text>
        {renderPaymentDetails()}
      </View>
      <View
        style={{
          flex: 1,
          paddingLeft: 40,
          paddingRight: 12,
          paddingVertical: 16,
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        {qrCodeDataUrl ? (
          <Image
            src={qrCodeDataUrl}
            style={{
              width: 96,
              height: 96,
            }}
          />
        ) : (
          <View
            style={{
              width: 96,
              height: 96,
              backgroundColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...lineText, color: "#9ca3af" }}>QR Code</Text>
          </View>
        )}
      </View>
    </View>
  );
};
