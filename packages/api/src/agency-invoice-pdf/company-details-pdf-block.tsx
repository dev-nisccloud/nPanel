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
import { pdfContainers, pdfInvoiceMeta, pdfPartyEmphasis } from "./pdf-styles";

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

function buildBillToLines(input: PdfCompanyDetailsFields): { name: string | null; rest: string } {
  const cityLine = [input.companyCity, input.companyState, input.companyZip]
    .filter((x) => x != null && String(x).trim() !== "")
    .join(", ");
  const rest = [
    input.email,
    input.companyAddress,
    cityLine || null,
    input.companyCountry,
    input.companyTaxId != null && String(input.companyTaxId).trim() !== ""
      ? `PIN: ${input.companyTaxId}`
      : null,
  ]
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v).trim())
    .join("\n");
  const name = input.companyName?.trim() || null;
  return { name, rest };
}

export function PdfCompanyDetailsBlock(props: PdfCompanyDetailsBlockProps) {
  const { name, rest } = buildBillToLines(props);
  const hasLabel = props.label != null && String(props.label).trim() !== "";
  if (!name && !rest && !hasLabel) {
    return null;
  }

  return (
    <View style={pdfContainers.CompanyDetails}>
      <View style={{ paddingTop: 4, paddingBottom: 4 }}>
        {hasLabel ? (
          <Text style={[pdfInvoiceMeta.label, { marginBottom: 4 }]}>{props.label}</Text>
        ) : null}
        {name || rest ? (
          <Text style={pdfInvoiceMeta.valueBillTo} wrap>
            {name ? (
              <Text style={pdfPartyEmphasis}>
                {name}
                {rest ? "\n" : ""}
              </Text>
            ) : null}
            {rest}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
