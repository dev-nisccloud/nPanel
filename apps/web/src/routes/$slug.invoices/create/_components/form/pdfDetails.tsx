import { View } from "@react-pdf/renderer";
import { InvoiceHeaderPdf } from "./header/invoiceHeaderPdf";
import { InvoiceTermsPdf } from "./invoiceTerms/InvoiceTermsPdf";
import { CompanyDetailsPdf } from "./companyDetails/companyDetailsPdf";
import { InvoiceDetailsPdf } from "./invoiceDetails/invoiceDetailsPdf";
import { pdfUtils } from "@/lib/pdfStyles";
import type {
  YourDetails,
  CompanyDetails,
  InvoiceItemDetails,
  PaymentDetails,
  InvoiceTerms,
} from "@/routes/agency.invoices/create/types";

export const PdfDetails = ({
  yourDetails,
  companyDetails,
  invoiceDetails,
  invoiceTerms,
}: {
  yourDetails: YourDetails;
  companyDetails: CompanyDetails;
  invoiceDetails: InvoiceItemDetails;
  paymentDetails?: PaymentDetails & { qrCodeDataUrl?: string };
  invoiceTerms: InvoiceTerms;
}) => (
  <View>
    <InvoiceHeaderPdf {...yourDetails} />
    
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
          paddingRight: 20,
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
