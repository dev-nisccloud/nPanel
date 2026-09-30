import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { pdfTypography } from "@/lib/pdfStyles";
import type { InvoiceTerms } from "@/routes/agency.invoices/create/types";

export const InvoiceTermsPdf: React.FC<InvoiceTerms> = ({
  invoiceNumber,
  issueDate,
  issuedAtDisplay,
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
        justifyContent: "space-between",
        alignItems: "flex-start" as const,
      }}
    >
      <View style={{ flex: 1 }} /> {/* Spacer for left side */}
      <View style={{ flex: 1, alignItems: "flex-end" as const }}>
        <View style={lineStyle}>
          <Text style={labelStyle}>INVOICE NO</Text>
          <Text style={[valueStyle, { maxWidth: 160, textAlign: "right" }]} wrap>
            {invoiceNumber || "-"}
          </Text>
        </View>
        <View style={lineStyle}>
          <Text style={labelStyle}>ISSUED</Text>
          <Text wrap={false} style={valueStyle}>
            {issuedAtDisplay?.trim()
              ? issuedAtDisplay
              : issueDate
                ? format(
                    typeof issueDate === "string" ? new Date(issueDate) : issueDate,
                    "dd-MM-yyyy HH:mm:ss",
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
                  "dd-MM-yyyy"
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

