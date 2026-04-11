/**
 * Bill To block for invoice PDFs.
 *
 * Root cause of “huge gaps” between lines: React-PDF/Yoga lays out each child `View` as a
 * flex item; sibling rows can still get inflated cross-axis sizes. Stacking many `View`s
 * each wrapping one `Text` is unreliable.
 *
 * Fix: one `Text` node with newline-separated lines. Vertical rhythm is **only** `lineHeight`
 * inside that run (no flex between rows).
 */
import * as React from "react";
import { Text, View } from "@react-pdf/renderer";
import { pdfContainers, pdfInvoiceMeta } from "@/lib/pdfStyles";

export type PdfCompanyDetailsFields = {
  email?: string;
  companyName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyCountry?: string;
  companyTaxId?: string;
  companyZip?: string;
};

export type PdfCompanyDetailsBlockProps = PdfCompanyDetailsFields & {
  /** Optional section title (e.g. quotations: “Quoted to”). */
  label?: string;
};

function buildBillToBody(input: PdfCompanyDetailsFields): string {
  const cityLine = [input.companyCity, input.companyState, input.companyZip]
    .filter((x) => x != null && String(x).trim() !== "")
    .join(", ");
  const parts: (string | null | undefined)[] = [
    input.companyName,
    input.email,
    input.companyAddress,
    cityLine || null,
    input.companyCountry,
    input.companyTaxId != null && String(input.companyTaxId).trim() !== ""
      ? `Tax ID: ${input.companyTaxId}`
      : null,
  ];
  return parts
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v).trim())
    .join("\n");
}

export function PdfCompanyDetailsBlock(props: PdfCompanyDetailsBlockProps) {
  const body = buildBillToBody(props);
  const hasLabel = props.label != null && String(props.label).trim() !== "";
  if (!body && !hasLabel) {
    return null;
  }

  return (
    <View style={pdfContainers.CompanyDetails}>
      <View style={{ paddingTop: 4, paddingBottom: 4 }}>
        {hasLabel ? (
          <Text style={[pdfInvoiceMeta.label, { marginBottom: 4 }]}>{props.label}</Text>
        ) : null}
        {body ? (
          <Text style={pdfInvoiceMeta.valueBillTo} wrap>
            {body}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
