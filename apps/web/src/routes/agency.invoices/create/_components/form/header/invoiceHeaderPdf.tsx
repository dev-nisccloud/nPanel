/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import { pdfBrandingLogoBox, pdfTypography } from "@/lib/pdfStyles";
import type { YourDetails } from "@/routes/agency.invoices/create/types";

export const InvoiceHeaderPdf: React.FC<YourDetails & { title?: string }> = ({
  yourEmail,
  yourName,
  yourAddress,
  yourCity,
  yourState,
  yourCountry,
  yourLogo,
  yourTaxId,
  yourZip,
  title = "Invoice",
}) => {
  const logoFrameW = pdfBrandingLogoBox.width;
  const logoFrameH = pdfBrandingLogoBox.height;
  return (
  <View>
    {/* Top row: Logo on left, From on right */}
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 40,
        paddingRight: 40,
        justifyContent: "space-between",
      }}
    >
      {/* Logo on left */}
      <View style={{ justifyContent: "flex-start", alignItems: "flex-start" }}>
        {yourLogo && (
          <View style={{ width: logoFrameW, height: logoFrameH }}>
            <Image
              src={yourLogo}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: 6,
              }}
            />
          </View>
        )}
      </View>
      {/* From details on right */}
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        {yourName && (
          <Text style={{ ...pdfTypography.description, fontWeight: "bold", marginBottom: 4 }}>
            {yourName}
          </Text>
        )}
        {yourEmail && (
          <Text style={{ ...pdfTypography.description, marginBottom: 4 }}>
            {yourEmail}
          </Text>
        )}
        <View style={{ ...pdfTypography.description, alignItems: "flex-end" }}>
          {yourAddress && <Text style={{ marginBottom: 2 }}>{yourAddress}</Text>}
          {(yourCity || yourState || yourZip) && (
            <Text style={{ marginBottom: 2 }}>
              {yourCity}, {yourState} {yourZip}
            </Text>
          )}
          {yourCountry && (
            <Text style={{ marginBottom: 2 }}>{yourCountry}</Text>
          )}
          {yourTaxId && <Text>PIN: {yourTaxId}</Text>}
        </View>
      </View>
    </View>
    {/* Separator with INVOICE in the middle */}
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 40,
        paddingRight: 40,
        paddingTop: 8,
        paddingBottom: 4,
      }}
    >
      <View
        style={{
          flex: 1,
          borderTopWidth: 1,
          borderTopStyle: "dashed",
          borderTopColor: "#d1d5db",
        }}
      />
      <Text
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          fontSize: 12,
          fontWeight: "semibold",
          color: "#374151",
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
      <View
        style={{
          flex: 1,
          borderTopWidth: 1,
          borderTopStyle: "dashed",
          borderTopColor: "#d1d5db",
        }}
      />
    </View>
  </View>
  );
};


