import { Text, View } from "@react-pdf/renderer";
import { InvoiceHeaderPdf } from "./invoice-header-pdf";
import { InvoiceTermsPdf } from "./invoice-terms-pdf";
import { CompanyDetailsPdf } from "./company-details-pdf";
import { InvoiceDetailsPdf } from "./invoice-details-pdf";
import { pdfUtils } from "../pdf-styles";
import type {
	YourDetails,
	CompanyDetails,
	InvoiceItemDetails,
	InvoiceTerms,
} from "../types";

export const PdfDetails = ({
  yourDetails,
  companyDetails,
  invoiceDetails,
  invoiceTerms,
  documentTitle,
}: {
  yourDetails: YourDetails;
  companyDetails: CompanyDetails;
  invoiceDetails: InvoiceItemDetails;
  invoiceTerms: InvoiceTerms;
  documentTitle?: string;
}) => {
  const isCreditNote = (documentTitle ?? "").toLowerCase().includes("credit");

  return (
  <View>
    <InvoiceHeaderPdf {...yourDetails} documentTitle={documentTitle} />

    {isCreditNote ? (
      <View style={{ paddingHorizontal: 40, paddingBottom: 8 }}>
        {invoiceTerms.originalCuInvoiceNo ? (
          <Text style={{ fontSize: 9, fontWeight: "bold", color: "#111827", marginBottom: 4 }}>
            ORIGINAL CU INVOICE NO.#: {invoiceTerms.originalCuInvoiceNo}
          </Text>
        ) : null}
        <Text style={{ fontSize: 8, fontWeight: "bold", color: "#111827", textTransform: "uppercase" }}>
          Credit note is approved only for original sales receipt
        </Text>
        {invoiceTerms.buyerPin ? (
          <Text style={{ fontSize: 9, color: "#374151", marginTop: 4 }}>
            Buyer PIN: {invoiceTerms.buyerPin}
          </Text>
        ) : null}
      </View>
    ) : null}
    
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        borderBottomWidth: 1,
        borderBottomStyle: "dashed",
        borderBottomColor: "#e5e7eb",
        width: "100%",
      }}
    >
      <View 
        style={{ 
          flex: 1, 
          minWidth: 0,
          borderRightWidth: 1, 
          borderRightStyle: "dashed", 
          borderRightColor: "#e5e7eb",
          overflow: 'hidden',
        }}
      >
        <CompanyDetailsPdf {...companyDetails} />
      </View>
      <View
        style={{
          flex: 1,
          minWidth: 0,
          paddingLeft: 20,
          paddingRight: 40,
        }}
      >
        <InvoiceTermsPdf {...invoiceTerms} />
      </View>
    </View>
    
    <View style={pdfUtils.borderBottom}>
      <InvoiceDetailsPdf {...invoiceDetails} />
    </View>
  </View>
  );
};
