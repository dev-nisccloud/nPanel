/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import type { EtimsFiscalFields } from "../types";

type EtimsFiscalFooterPdfProps = {
	fields: EtimsFiscalFields;
	qrCodeDataUrl?: string;
	/** When true, repeats on every PDF page (react-pdf `fixed` prop). */
	fixed?: boolean;
};

const muted = { fontSize: 7, color: "#374151", lineHeight: 1.35 } as const;
const label = { ...muted, fontWeight: "bold" as const };
const heading = {
	fontSize: 8,
	fontWeight: "bold" as const,
	color: "#111827",
	textTransform: "uppercase" as const,
	marginBottom: 4,
	letterSpacing: 0.4,
};

function Row({ k, v }: { k: string; v: string }) {
	return (
		<Text style={muted} wrap>
			<Text style={label}>{k}: </Text>
			<Text>{v}</Text>
		</Text>
	);
}

/**
 * KRA TIS spec v2.0 SCU Information + TIS Information block.
 * Replaces bank/M-Pesa payment details on fiscal invoices and credit notes.
 */
export const EtimsFiscalFooterPdf: React.FC<EtimsFiscalFooterPdfProps> = ({
	fields,
	qrCodeDataUrl,
	fixed = true,
}) => {
	const internal = fields.intrlDataDashed ?? fields.intrlData;
	const signature = fields.rcptSignDashed ?? fields.rcptSign;
	const scuDate = fields.scuDate;
	const scuTime = fields.scuTime;
	const cuId = fields.sdcId;
	const invoiceNo = fields.cuInvoiceNo;

	return (
		<View
			fixed={fixed}
			style={{
				position: "absolute",
				bottom: 16,
				left: 40,
				right: 40,
				borderTopWidth: 1,
				borderTopStyle: "solid",
				borderTopColor: "#111827",
				paddingTop: 8,
			}}
		>
			<View style={{ flexDirection: "row", alignItems: "flex-start" }}>
				<View style={{ flex: 1, paddingRight: qrCodeDataUrl ? 12 : 0 }}>
					<Text style={heading}>SCU Information</Text>
					{scuDate || scuTime ? (
						<Text style={muted}>
							{scuDate ? <Text style={label}>Date: </Text> : null}
							{scuDate ? <Text>{scuDate}    </Text> : null}
							{scuTime ? <Text style={label}>Time: </Text> : null}
							{scuTime ? <Text>{scuTime}</Text> : null}
						</Text>
					) : fields.sdcDateTimeDisplay ? (
						<Row k="Date" v={fields.sdcDateTimeDisplay} />
					) : null}
					{cuId ? <Row k="CU ID" v={cuId} /> : null}
					{invoiceNo ? <Row k="Invoice No." v={invoiceNo} /> : null}
					{internal ? (
						<View style={{ marginTop: 2 }}>
							<Text style={label}>Internal Data:</Text>
							<Text style={muted} wrap>
								{internal}
							</Text>
						</View>
					) : null}
					{signature ? (
						<View style={{ marginTop: 2 }}>
							<Text style={label}>Receipt Signature:</Text>
							<Text style={muted} wrap>
								{signature}
							</Text>
						</View>
					) : null}
				</View>
				{qrCodeDataUrl ? (
					<View style={{ width: 72, alignItems: "center" }}>
						<Image src={qrCodeDataUrl} style={{ width: 64, height: 64 }} />
					</View>
				) : null}
			</View>

			<View
				style={{
					marginTop: 8,
					borderTopWidth: 1,
					borderTopStyle: "dashed",
					borderTopColor: "#d1d5db",
					paddingTop: 6,
				}}
			>
				<Text style={heading}>TIS Information</Text>
				{fields.tisReceiptNumber ? (
					<Row k="Receipt Number" v={fields.tisReceiptNumber} />
				) : null}
				{fields.tisDate || fields.tisTime ? (
					<Text style={muted}>
						{fields.tisDate ? <Text style={label}>Date: </Text> : null}
						{fields.tisDate ? <Text>{fields.tisDate}    </Text> : null}
						{fields.tisTime ? <Text style={label}>Time: </Text> : null}
						{fields.tisTime ? <Text>{fields.tisTime}</Text> : null}
					</Text>
				) : null}
			</View>
		</View>
	);
};
