import { Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { InvoiceHeaderPdf } from "@/routes/agency.invoices/create/_components/form/header/invoiceHeaderPdf";
import { CompanyDetailsPdf } from "@/routes/agency.invoices/create/_components/form/companyDetails/companyDetailsPdf";
import { InvoiceDetailsPdf } from "@/routes/agency.invoices/create/_components/form/invoiceDetails/invoiceDetailsPdf";
import { pdfTypography, pdfUtils } from "@/lib/pdfStyles";
import type { formValuesToPreview } from "@/routes/agency.sales.service-orders/create/mapOrder";

type PreviewData = ReturnType<typeof formValuesToPreview>;

function formatDate(date?: string | Date) {
	if (!date) return "";
	const dateObj = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(dateObj.getTime())) return "";
	return format(dateObj, "do MMM yyyy");
}

export const ServiceOrderPdfDetails = ({
	yourDetails,
	companyDetails,
	orderDetails,
	orderTerms,
}: PreviewData) => (
	<View>
		<InvoiceHeaderPdf
			yourEmail={yourDetails.yourEmail}
			yourName={yourDetails.yourName}
			yourAddress={yourDetails.yourAddress}
			yourCity={yourDetails.yourCity}
			yourState={yourDetails.yourState}
			yourCountry={yourDetails.yourCountry}
			yourLogo={yourDetails.yourLogo}
			yourTaxId={yourDetails.yourTaxId}
			yourZip={yourDetails.yourZip}
			title="Service Order"
		/>
		{yourDetails.preparedBy ? (
			<Text style={{ ...pdfTypography.description, fontSize: 10, textAlign: "right", paddingRight: 40, paddingBottom: 8 }}>
				Prepared by: {yourDetails.preparedBy}
			</Text>
		) : null}
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
				<CompanyDetailsPdf
					email={companyDetails.email}
					companyName={companyDetails.companyName}
					companyAddress={companyDetails.companyAddress}
					companyCity={companyDetails.companyCity}
					companyState={companyDetails.companyState}
					companyCountry={companyDetails.companyCountry}
					companyTaxId={companyDetails.companyTaxId}
					companyZip={companyDetails.companyZip}
					label="Client"
				/>
				<View style={{ paddingHorizontal: 40, paddingBottom: 12 }}>
					{companyDetails.contactPerson ? <Text style={metaStyle}>{companyDetails.contactPerson}</Text> : null}
					{companyDetails.phone ? <Text style={metaStyle}>{companyDetails.phone}</Text> : null}
					{companyDetails.billingEmail ? <Text style={metaStyle}>{companyDetails.billingEmail}</Text> : null}
				</View>
			</View>
			<View style={{ flex: 1, minWidth: 0, paddingLeft: 20, paddingRight: 40, paddingVertical: 16 }}>
				<View style={{ alignItems: "flex-end" }}>
					<TermLine label="ORDER NO" value={orderTerms.orderNumber || "-"} />
					<TermLine label="ISSUED" value={formatDate(orderTerms.issueDate) || "-"} />
					<TermLine label="VALID UNTIL" value={formatDate(orderTerms.validUntil) || "-"} />
				</View>
			</View>
		</View>
		<View>
			<View style={pdfUtils.borderBottom}>
				<InvoiceDetailsPdf
					note={orderDetails.note}
					discount={orderDetails.discount}
					taxPercentage={orderDetails.taxPercentage}
					currency={orderDetails.currency}
					items={orderDetails.items.map((item) => ({
						...item,
						itemDescription: [item.serviceCategory, item.itemDescription, item.primaryDomain]
							.filter(Boolean)
							.join("\n"),
					}))}
				/>
			</View>
		</View>
		<View style={{ display: "flex", flexDirection: "row" }}>
			<View style={{ flex: 1, paddingHorizontal: 40, paddingVertical: 16 }}>
				<Text style={pdfTypography.title}>Payment terms</Text>
				<Text style={{ ...pdfTypography.description, marginTop: 6 }}>{orderTerms.paymentTerms || "-"}</Text>
			</View>
			<View style={{ flex: 1, paddingHorizontal: 40, paddingVertical: 16 }}>
				<Text style={pdfTypography.title}>Authorization</Text>
				<Text style={{ ...pdfTypography.description, marginTop: 6 }}>{orderTerms.clientSignatoryName}</Text>
				<Text style={pdfTypography.description}>{orderTerms.clientSignatoryTitle}</Text>
				<Text style={pdfTypography.description}>{formatDate(orderTerms.clientSignatoryDate)}</Text>
				<Text style={{ ...pdfTypography.description, marginTop: 8 }}>{orderTerms.niscSignatoryName}</Text>
				<Text style={pdfTypography.description}>{orderTerms.niscSignatoryTitle}</Text>
				<Text style={pdfTypography.description}>{formatDate(orderTerms.niscSignatoryDate)}</Text>
			</View>
		</View>
	</View>
);

function TermLine({ label, value }: { label: string; value: string }) {
	return (
		<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6, marginBottom: 8 }}>
			<Text style={{ ...pdfTypography.description, fontSize: 11, textTransform: "uppercase", color: "#6b7280" }}>{label}</Text>
			<Text style={{ fontSize: 12, fontWeight: "bold", color: "#111827" }}>{value}</Text>
		</View>
	);
}

const metaStyle = { ...pdfTypography.description, fontSize: 10 };
