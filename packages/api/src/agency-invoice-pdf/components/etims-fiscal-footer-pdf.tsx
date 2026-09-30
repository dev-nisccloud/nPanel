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
	const counter = `${display(fields.curRcptNo)}/${display(fields.totRcptNo)} ${display(fields.receiptLabel)}`;

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
							paddingTop: 8,
						}
					: {
							borderTopWidth: 1,
							borderTopStyle: "solid",
							borderTopColor: "#111827",
							paddingTop: 8,
						}
			}
		>
			<View style={{ flexDirection: "row", alignItems: "flex-start" }}>
				<View style={{ flex: 1, paddingRight: qrCodeDataUrl ? 12 : 0 }}>
					<Text style={heading}>SCU Information</Text>
					<Text style={muted}>
						<Text style={label}>Date: </Text>
						<Text>{display(fields.scuDate)}    </Text>
						<Text style={label}>Time: </Text>
						<Text>{display(fields.scuTime)}</Text>
					</Text>
					<Row k="CU ID" v={fields.sdcId} />
					<Row k="CU INVOICE NO." v={fields.cuInvoiceNo} />
					<Row k="Receipt Counter" v={counter} />
					<View style={{ marginTop: 2 }}>
						<Text style={label}>Internal Data:</Text>
						<Text style={muted} wrap>
							{display(internal)}
						</Text>
					</View>
					<View style={{ marginTop: 2 }}>
						<Text style={label}>Receipt Signature:</Text>
						<Text style={muted} wrap>
							{display(signature)}
						</Text>
					</View>
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
				<Row k="Receipt Number" v={fields.tisReceiptNumber} />
				<Text style={muted}>
					<Text style={label}>Date: </Text>
					<Text>{display(fields.tisDate)}    </Text>
					<Text style={label}>Time: </Text>
					<Text>{display(fields.tisTime)}</Text>
				</Text>
			</View>
		</View>
	);
};
