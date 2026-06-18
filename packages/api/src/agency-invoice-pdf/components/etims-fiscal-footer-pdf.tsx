import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { getEtimsFiscalFooterFields } from "../../lib/etims-fiscal-fields";
import type { EtimsFiscalFields } from "../types";

type EtimsFiscalFooterPdfProps = {
	fields: EtimsFiscalFields;
	/** When true, repeats on every PDF page (react-pdf `fixed` prop). */
	fixed?: boolean;
};

const footerTextStyle = {
	fontSize: 6.5,
	color: "#374151",
	lineHeight: 1.35,
} as const;

/**
 * KRA eTIMS fiscal text block — fixed footer on synced invoices (QR lives beside payment details).
 */
export const EtimsFiscalFooterPdf: React.FC<EtimsFiscalFooterPdfProps> = ({
	fields,
	fixed = true,
}) => {
	const rows = getEtimsFiscalFooterFields(fields);

	return (
		<View
			fixed={fixed}
			style={{
				position: "absolute",
				bottom: 20,
				left: 40,
				right: 40,
				borderTopWidth: 1,
				borderTopStyle: "solid",
				borderTopColor: "#e5e7eb",
				paddingTop: 8,
			}}
		>
			{rows.length > 0 ? (
				<Text style={footerTextStyle} wrap>
					{rows.map((row, index) => (
						<React.Fragment key={row.label}>
							{index > 0 ? <Text> | </Text> : null}
							<Text style={{ fontWeight: "bold" }}>{row.label}: </Text>
							<Text>{row.value}</Text>
						</React.Fragment>
					))}
				</Text>
			) : null}
			{fields.verificationUrl ? (
				<Text
					style={{
						fontSize: 6,
						color: "#6b7280",
						marginTop: 4,
						lineHeight: 1.35,
					}}
					wrap
				>
					{fields.verificationUrl}
				</Text>
			) : null}
		</View>
	);
};
