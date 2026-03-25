import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { pdfTypography } from "@/lib/pdfStyles";
import type { QuotationTerms } from "@/routes/agency.quotations/create/types";

export const QuotationTermsPdf: React.FC<QuotationTerms> = ({
	quotationNumber,
	issueDate,
}) => (
	<View style={{ paddingTop: 16, paddingBottom: 16 }}>
		<View
			style={{
				display: "flex",
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "flex-start" as const,
			}}
		>
			<View style={{ flex: 1 }} />
			<View style={{ flex: 1, alignItems: "flex-end" as const }}>
				<View style={lineStyle}>
					<Text style={labelStyle}>QUOTATION NO</Text>
					<Text wrap={false} style={valueStyle}>
						{quotationNumber || "-"}
					</Text>
				</View>
				<View style={lineStyle}>
					<Text style={labelStyle}>ISSUED</Text>
					<Text wrap={false} style={valueStyle}>
						{issueDate
							? format(
									typeof issueDate === "string" ? new Date(issueDate) : issueDate,
									"do MMM yyyy",
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

