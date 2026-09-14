/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import { pdfContainers, pdfTypography } from "@/lib/pdfStyles";
import type { YourDetails } from "@/routes/agency.invoices/create/types";

export const YourDetailsPDF: React.FC<YourDetails> = ({
  yourEmail,
  yourName,
  yourAddress,
  yourCity,
  yourState,
  yourCountry,
  yourLogo,
  yourTaxId,
  yourZip,
}) => (
  <View style={pdfContainers.YourDetails}>
    <Text style={{ ...pdfTypography.title, marginBottom: 14 }}>From</Text>

    <View style={pdfContainers.imageContainer}>
      {yourLogo && (
        <Image style={{ height: 40, borderRadius: 6 }} src={yourLogo} />
      )}
    </View>
    {yourName && <Text style={pdfTypography.text2xl}>{yourName}</Text>}
    {yourEmail && (
      <Text style={{ ...pdfTypography.description, marginBottom: 12 }}>
        {yourEmail}
      </Text>
    )}
    <View style={pdfTypography.description}>
      {yourAddress && <Text>{yourAddress}</Text>}
      {(yourCity || yourState || yourZip) && (
        <Text style={{ marginBottom: 2 }}>
          {yourCity}, {yourState} {yourZip}
        </Text>
      )}
      {yourCountry && <Text style={{ marginBottom: 4 }}>{yourCountry}</Text>}
      {yourTaxId && <Text>PIN: {yourTaxId}</Text>}
    </View>
  </View>
);

