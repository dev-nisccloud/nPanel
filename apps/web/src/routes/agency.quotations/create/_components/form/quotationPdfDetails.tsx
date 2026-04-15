import { View } from "@react-pdf/renderer";
import { InvoiceHeaderPdf } from "@/routes/agency.invoices/create/_components/form/header/invoiceHeaderPdf";
import { CompanyDetailsPdf } from "@/routes/agency.invoices/create/_components/form/companyDetails/companyDetailsPdf";
import { InvoiceDetailsPdf } from "@/routes/agency.invoices/create/_components/form/invoiceDetails/invoiceDetailsPdf";
import { QuotationTermsPdf } from "./quotationTerms/QuotationTermsPdf";
import { pdfUtils } from "@/lib/pdfStyles";
import type {
	YourDetails,
	CompanyDetails,
	QuotationItemDetails,
	QuotationTerms,
} from "@/routes/agency.quotations/create/types";

export const QuotationPdfDetails = ({
	yourDetails,
	companyDetails,
	quotationDetails,
	quotationTerms,
}: {
	yourDetails: YourDetails;
	companyDetails: CompanyDetails;
	quotationDetails: QuotationItemDetails;
	quotationTerms: QuotationTerms;
}) => (
	<View>
		<InvoiceHeaderPdf {...yourDetails} title="Quotation" />
		<View
			style={{
				display: "flex",
				flexDirection: "row",
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
					overflow: "hidden",
				}}
			>
				<CompanyDetailsPdf {...companyDetails} label="Quoted to" />
			</View>
			<View
				style={{
					flex: 1,
					minWidth: 0,
					paddingLeft: 20,
					paddingRight: 40,
				}}
			>
				<QuotationTermsPdf {...quotationTerms} />
			</View>
		</View>
		<View>
			<View style={pdfUtils.borderBottom}>
				<InvoiceDetailsPdf {...quotationDetails} />
			</View>
		</View>
	</View>
);

