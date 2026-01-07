/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import { pdfTypography, pdfUtils } from "@/lib/pdfStyles";
import type { PaymentDetails } from "@/app/(main)/agency/invoicing/types";

interface PaymentDetailsPdfProps extends PaymentDetails {
  qrCodeDataUrl?: string;
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
}) => {

  const renderPaymentDetails = () => {
    if (paymentMethod === "bank") {
      return (
        <View style={{ flexDirection: "column", gap: 5 }}>
          <View style={pdfUtils.flexRowItemCenter}>
            <Text style={pdfTypography.paymentTitle}>Bank Name</Text>
            <Text
              style={{
                flex: 1,
                ...pdfTypography.itemDescription,
                paddingLeft: 44.5,
              }}
            >
              {bankName ? bankName : "-"}
            </Text>
          </View>
          <View style={pdfUtils.flexRowItemCenter}>
            <Text style={pdfTypography.paymentTitle}>Account Number</Text>
            <Text
              style={{
                flex: 1,
                ...pdfTypography.itemDescription,
                paddingLeft: 14,
              }}
            >
              {accountNumber ? accountNumber : "-"}
            </Text>
          </View>
          <View style={pdfUtils.flexRowItemCenter}>
            <Text style={pdfTypography.paymentTitle}>Account Name</Text>
            <Text
              style={{
                flex: 1,
                ...pdfTypography.itemDescription,
                paddingLeft: 26,
              }}
            >
              {accountName ? accountName : "-"}
            </Text>
          </View>
          {branchName && (
            <View style={pdfUtils.flexRowItemCenter}>
              <Text style={pdfTypography.paymentTitle}>Branch Name</Text>
              <Text
                style={{
                  flex: 1,
                  ...pdfTypography.itemDescription,
                  paddingLeft: 35,
                }}
              >
                {branchName}
              </Text>
            </View>
          )}
          {branchCode && (
            <View style={pdfUtils.flexRowItemCenter}>
              <Text style={pdfTypography.paymentTitle}>Branch Code</Text>
              <Text
                style={{
                  flex: 1,
                  ...pdfTypography.itemDescription,
                  paddingLeft: 38,
                }}
              >
                {branchCode}
              </Text>
            </View>
          )}
          {swiftCode && (
            <View style={pdfUtils.flexRowItemCenter}>
              <Text style={pdfTypography.paymentTitle}>Swift Code</Text>
              <Text
                style={{
                  flex: 1,
                  ...pdfTypography.itemDescription,
                  paddingLeft: 45,
                }}
              >
                {swiftCode}
              </Text>
            </View>
          )}
        </View>
      );
    }

    if (paymentMethod === "mpesa") {
      return (
        <View style={{ flexDirection: "column", gap: 5 }}>
          <View style={pdfUtils.flexRowItemCenter}>
            <Text style={pdfTypography.paymentTitle}>Paybill Number</Text>
            <Text
              style={{
                flex: 1,
                ...pdfTypography.itemDescription,
                paddingLeft: 20,
              }}
            >
              {mpesaPaybillNumber ? mpesaPaybillNumber : "-"}
            </Text>
          </View>
          {mpesaAccountNumber && (
            <View style={pdfUtils.flexRowItemCenter}>
              <Text style={pdfTypography.paymentTitle}>Account Number</Text>
              <Text
                style={{
                  flex: 1,
                  ...pdfTypography.itemDescription,
                  paddingLeft: 20,
                }}
              >
                {mpesaAccountNumber}
              </Text>
            </View>
          )}
          {mpesaInstructions && (
            <View style={{ flexDirection: "column", gap: 2 }}>
              <Text style={pdfTypography.paymentTitle}>Instructions</Text>
              <Text
                style={{
                  ...pdfTypography.itemDescription,
                  paddingLeft: 0,
                }}
              >
                {mpesaInstructions}
              </Text>
            </View>
          )}
        </View>
      );
    }

    if (paymentMethod === "cheque") {
      return (
        <View style={{ flexDirection: "column", gap: 5 }}>
          {chequeDeliveryAddress && (
            <View style={{ flexDirection: "column", gap: 2 }}>
              <Text style={pdfTypography.paymentTitle}>Delivery Address</Text>
              <Text
                style={{
                  ...pdfTypography.itemDescription,
                  paddingLeft: 0,
                }}
              >
                {chequeDeliveryAddress}
              </Text>
            </View>
          )}
          {chequeInstructions && (
            <View style={{ flexDirection: "column", gap: 2 }}>
              <Text style={pdfTypography.paymentTitle}>Instructions</Text>
              <Text
                style={{
                  ...pdfTypography.itemDescription,
                  paddingLeft: 0,
                }}
              >
                {chequeInstructions}
              </Text>
            </View>
          )}
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
        <Text style={{ paddingBottom: 12, ...pdfTypography.title }}>
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
            <Text style={{ fontSize: 10, color: "#9ca3af" }}>QR Code</Text>
          </View>
        )}
      </View>
    </View>
  );
};
