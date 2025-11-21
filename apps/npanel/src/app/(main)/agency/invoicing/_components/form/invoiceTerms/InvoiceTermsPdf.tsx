import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { pdfTypography } from "@/lib/pdfStyles";
import type { InvoiceTerms } from "@/app/(main)/agency/invoicing/types";

export const InvoiceTermsPdf: React.FC<InvoiceTerms> = ({
  invoiceNumber,
  issueDate,
  dueDate,
}) => (
  <View
    style={{
      paddingTop: 16,
      paddingBottom: 16,
    }}
  >
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between" as const,
        alignItems: "flex-start" as const,
      }}
    >
      <View style={{ flex: 1 }} /> {/* Spacer for left side */}
      <View style={{ flex: 1, alignItems: "flex-end" as const }}>
        <View style={lineStyle}>
          <Text style={labelStyle}>INVOICE NO</Text>
          <Text wrap={false} style={valueStyle}>
            {invoiceNumber || "-"}
          </Text>
        </View>
        <View style={lineStyle}>
          <Text style={labelStyle}>ISSUED</Text>
          <Text wrap={false} style={valueStyle}>
            {issueDate
              ? format(
                  typeof issueDate === "string" ? new Date(issueDate) : issueDate,
                  "do MMM yyyy"
                )
              : "-"}
          </Text>
        </View>
        <View style={lineStyle}>
          <Text style={labelStyle}>DUE DATE</Text>
          <Text wrap={false} style={valueStyle}>
            {dueDate
              ? format(
                  typeof dueDate === "string" ? new Date(dueDate) : dueDate,
                  "do MMM yyyy"
                )
              : "-"}
          </Text>
        </View>
      </View>
    </View>
  </View>
);

const lineStyle = {
  display: "flex" as const,
  flexDirection: "row" as const,
  alignItems: "center" as const,
  justifyContent: "flex-end" as const,
  gap: 6,
  marginBottom: 8,
};

const labelStyle = {
  ...pdfTypography.description,
  fontSize: 11,
  textTransform: "uppercase" as const,
  color: "#6b7280",
};

const valueStyle = {
  fontSize: 12,
  fontWeight: "bold" as const,
  color: "#111827",
};
