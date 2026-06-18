import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { pdfInvoiceMeta } from "../pdf-styles";
import type { InvoiceTerms } from "../types";

export const InvoiceTermsPdf: React.FC<InvoiceTerms> = ({
  invoiceNumber,
  issueDate,
  dueDate,
  originalInvoiceNumber,
  numberLabel = "INVOICE NO",
  showDueDate = true,
}) => (
  <View
    style={{
      paddingTop: 8,
      paddingBottom: 8,
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
      <View style={{ flex: 1 }} />
      <View style={{ flex: 1, alignItems: "flex-end" as const }}>
        <View style={pdfInvoiceMeta.rowTerms}>
          <Text style={pdfInvoiceMeta.label}>{numberLabel}</Text>
          <Text style={[pdfInvoiceMeta.value, { maxWidth: 160, textAlign: "right" }]} wrap>
            {invoiceNumber || "-"}
          </Text>
        </View>
        <View style={pdfInvoiceMeta.rowTerms}>
          <Text style={pdfInvoiceMeta.label}>ISSUED</Text>
          <Text wrap={false} style={pdfInvoiceMeta.value}>
            {issueDate
              ? format(
                  typeof issueDate === "string" ? new Date(issueDate) : issueDate,
                  "dd-MM-yyyy"
                )
              : "-"}
          </Text>
        </View>
        {originalInvoiceNumber ? (
          <View style={pdfInvoiceMeta.rowTerms}>
            <Text style={pdfInvoiceMeta.label}>ORIGINAL INVOICE</Text>
            <Text style={[pdfInvoiceMeta.value, { maxWidth: 160, textAlign: "right" }]} wrap>
              {originalInvoiceNumber}
            </Text>
          </View>
        ) : showDueDate ? (
          <View style={pdfInvoiceMeta.rowTerms}>
            <Text style={pdfInvoiceMeta.label}>DUE DATE</Text>
            <Text wrap={false} style={pdfInvoiceMeta.value}>
              {dueDate
                ? format(
                    typeof dueDate === "string" ? new Date(dueDate) : dueDate,
                    "dd-MM-yyyy"
                  )
                : "-"}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  </View>
);
