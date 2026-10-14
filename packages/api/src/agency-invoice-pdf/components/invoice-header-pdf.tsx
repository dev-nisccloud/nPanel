/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import { resolvePdfLogoUrl } from "../../lib/company-branding";
import { pdfBrandingLogoBox, pdfPartyDetail, pdfPartyEmphasis } from "../pdf-styles";
import type { YourDetails } from "../types";

export const InvoiceHeaderPdf: React.FC<YourDetails & { documentTitle?: string }> = ({
  yourEmail,
  yourName,
  yourAddress,
  yourCity,
  yourState,
  yourCountry,
  yourLogo,
  yourLogoWidth,
  yourTaxId,
  yourZip,
  documentTitle = "Invoice",
}) => {
  const logoSrc = resolvePdfLogoUrl(yourLogo);
  const logoFrameW = yourLogoWidth ?? pdfBrandingLogoBox.width;
  const logoFrameH =
    (logoFrameW / pdfBrandingLogoBox.width) * pdfBrandingLogoBox.height;
  return (
  <View>
    {/* Top row: Logo on left, From on right */}
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 40,
        paddingRight: 40,
        justifyContent: "space-between",
      }}
    >
      {/* Logo on left */}
      <View style={{ justifyContent: "flex-start", alignItems: "flex-start" }}>
        {logoSrc ? (
          <View style={{ width: logoFrameW, height: logoFrameH }}>
            <Image
              src={logoSrc}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: 6,
              }}
            />
          </View>
        ) : null}
      </View>
      {/* From details on right */}
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        {yourName && (
          <Text style={{ ...pdfPartyEmphasis, marginBottom: 4 }}>
            {yourName}
          </Text>
        )}
        {yourEmail && (
          <Text style={{ ...pdfPartyDetail, marginBottom: 4 }}>
            {yourEmail}
          </Text>
        )}
        <View style={{ alignItems: "flex-end" }}>
          {yourAddress && <Text style={{ ...pdfPartyDetail, marginBottom: 2 }}>{yourAddress}</Text>}
          {(yourCity || yourState || yourZip) && (
            <Text style={{ ...pdfPartyDetail, marginBottom: 2 }}>
              {yourCity}, {yourState} {yourZip}
            </Text>
          )}
          {yourCountry && (
            <Text style={{ ...pdfPartyDetail, marginBottom: 2 }}>{yourCountry}</Text>
          )}
          {yourTaxId && <Text style={pdfPartyDetail}>PIN: {yourTaxId}</Text>}
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
        paddingTop: 4,
        paddingBottom: 2,
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
          ...pdfPartyEmphasis,
          paddingLeft: 16,
          paddingRight: 16,
          textTransform: "uppercase",
        }}
      >
        {documentTitle}
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


