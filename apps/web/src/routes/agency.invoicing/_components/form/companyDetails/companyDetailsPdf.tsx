"use client";

import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { pdfContainers, pdfTypography } from "@/lib/pdfStyles";
import type { CompanyDetails } from "@/routes/agency.invoicing/types";

export const CompanyDetailsPdf: React.FC<CompanyDetails> = ({
  email,
  companyName,
  companyAddress,
  companyCity,
  companyState,
  companyCountry,
  companyTaxId,
  companyZip,
}) => (
  <View style={[pdfContainers.CompanyDetails, { paddingTop: 8, paddingBottom: 16 }]}>
    {companyName && (
      <Text 
        style={{ 
          ...pdfTypography.description, 
          fontWeight: "bold", 
          marginTop: 4,
          marginBottom: 6,
        }}
        wrap
      >
        {companyName}
      </Text>
    )}
    {email && (
      <Text 
        style={{ 
          ...pdfTypography.description, 
          marginTop: 4,
          marginBottom: 6,
        }}
        wrap
      >
        {email}
      </Text>
    )}
    <View style={{ ...pdfTypography.description, marginTop: 4 }}>
      {companyAddress && (
        <Text 
          style={{ 
            marginTop: 4,
            marginBottom: 4,
          }} 
          wrap
        >
          {companyAddress}
        </Text>
      )}
      {(companyCity || companyState || companyZip) && (
        <Text 
          style={{ 
            marginTop: 4,
            marginBottom: 4,
          }} 
          wrap
        >
          {[companyCity, companyState, companyZip].filter(Boolean).join(", ")}
        </Text>
      )}
      {companyCountry && (
        <Text 
          style={{ 
            marginTop: 4,
            marginBottom: 4,
          }} 
          wrap
        >
          {companyCountry}
        </Text>
      )}
      {companyTaxId && (
        <Text 
          style={{ 
            marginTop: 4,
          }}
          wrap
        >
          Tax ID: {companyTaxId}
        </Text>
      )}
    </View>
  </View>
);

