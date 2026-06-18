import { View } from "@react-pdf/renderer";
import { InvoiceHeaderPdf } from "./invoice-header-pdf";
import { InvoiceTermsPdf } from "./invoice-terms-pdf";
import { CompanyDetailsPdf } from "./company-details-pdf";
import { InvoiceDetailsPdf } from "./invoice-details-pdf";
import { PaymentDetailsPdf } from "./payment-details-pdf";
import { pdfUtils } from "../pdf-styles";
import type {
	YourDetails,
	CompanyDetails,
	InvoiceItemDetails,
	PaymentDetails,
	InvoiceTerms,
} from "../types";

export const PdfDetails = ({
  yourDetails,
  companyDetails,
  invoiceDetails,
  paymentDetails,
  invoiceTerms,
  documentTitle,
}: {
  yourDetails: YourDetails;
  companyDetails: CompanyDetails;
  invoiceDetails: InvoiceItemDetails;
  paymentDetails: PaymentDetails & { qrCodeDataUrl?: string };
  invoiceTerms: InvoiceTerms;
  documentTitle?: string;
}) => (
  <View>
    {/* New header: Logo on left, From on right, then document title separator */}
    <InvoiceHeaderPdf {...yourDetails} documentTitle={documentTitle} />
    
    {/* Bill To section on left, Invoice number and dates on right */}
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
    
    {/* Invoice details and payment details remain the same */}
    <View>
      <View style={pdfUtils.borderBottom}>
        <InvoiceDetailsPdf {...invoiceDetails} />
      </View>
      <View>
        <PaymentDetailsPdf
          {...paymentDetails}
          compactLineItems={invoiceDetails.compactLineItems}
        />
      </View>
    </View>
  </View>
);

