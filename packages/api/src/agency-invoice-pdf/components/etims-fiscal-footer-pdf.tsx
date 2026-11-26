/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import type { EtimsFiscalFields } from "../types";

type EtimsFiscalFooterPdfProps = {
	fields: EtimsFiscalFields;
	qrCodeDataUrl?: string;
	/** When true, repeats on every PDF page (react-pdf `fixed` prop). */
	fixed?: boolean;
	/** When false, the block flows inside a parent that is already fixed to the page. */
	positioned?: boolean;
};

const muted = { fontSize: 6.5, color: "#374151", lineHeight: 1.25 } as const;
const label = { ...muted, fontWeight: "bold" as const };
const heading = {
	fontSize: 7,
	fontWeight: "bold" as const,
	color: "#111827",
	textTransform: "uppercase" as const,
	marginBottom: 2,
	letterSpacing: 0.3,
};

function display(value: string | null | undefined): string {
	const v = value?.trim();
	return v ? v : "—";
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
	return (
		<Text style={muted} wrap>
			<Text style={label}>{k}: </Text>
			<Text>{display(v)}</Text>
		</Text>
	);
}

/**
 * KRA TIS spec v2.0 SCU Information + TIS Information block.
 * Labels always print; values are "—" when not yet provided.
 */
export const EtimsFiscalFooterPdf: React.FC<EtimsFiscalFooterPdfProps> = ({
	fields,
	qrCodeDataUrl,
	fixed = true,
	positioned = true,
}) => {
	const internal = fields.intrlDataDashed ?? fields.intrlData;
	const signature = fields.rcptSignDashed ?? fields.rcptSign;
	const scuDateTime =
		fields.sdcDateTimeDisplay?.trim() ||
		[fields.scuDate, fields.scuTime].filter(Boolean).join(" ");

	return (
		<View
			fixed={positioned ? fixed : undefined}
			style={
				positioned
					? {
							position: "absolute",
							bottom: 16,
							left: 40,
							right: 40,
							borderTopWidth: 1,
							borderTopStyle: "solid",
							borderTopColor: "#111827",
							paddingTop: 4,
						}
					: {
							borderTopWidth: 1,
							borderTopStyle: "solid",
							borderTopColor: "#111827",
							paddingTop: 4,
						}
			}
		>
			<View style={{ flexDirection: "row", alignItems: "flex-start" }}>
				<View style={{ flex: 1, paddingRight: 8 }}>
					<Text style={heading}>SCU Information</Text>
					<Row k="Date" v={scuDateTime} />
					<Row k="Control Unit Number" v={fields.sdcId} />
					<Row k="Invoice Number" v={fields.cuInvoiceNo} />
					<Row k="Internal Data" v={internal} />
					<Row k="Receipt Signature" v={signature} />
				</View>
				<View style={{ flex: 1, paddingRight: qrCodeDataUrl ? 8 : 0 }}>
					<Text style={heading}>TIS Information</Text>
					<Row k="Receipt Number" v={fields.tisReceiptNumber} />
					<Row k="Date" v={fields.tisDate} />
					<Row k="Time" v={fields.tisTime} />
				</View>
				{qrCodeDataUrl ? (
					<View style={{ width: 58, alignItems: "center" }}>
						<Image src={qrCodeDataUrl} style={{ width: 52, height: 52 }} />
					</View>
				) : null}
			</View>
		</View>
	);
};
