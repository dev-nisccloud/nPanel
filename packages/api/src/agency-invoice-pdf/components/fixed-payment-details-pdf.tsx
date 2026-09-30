import React from "react";
import { Text, View } from "@react-pdf/renderer";
import type { PaymentDetails } from "../types";

/** Company settlement details printed on every invoice page when an invoice has none of its own. */
export const INVOICE_PDF_PAYMENT_DEFAULTS = {
	bankName: "Absa Bank Plc",
	accountNumber: "2052676528",
	accountName: "Nisc Cloud Limited",
	branchName: "Hurlingham",
	branchCode: "045",
	swiftCode: "BARCKENX",
	mpesaPaybillNumber: "303030",
	mpesaAccountNumber: "2052676528",
} as const;

const line = { fontSize: 8, color: "#4b5563", lineHeight: 1.35 } as const;
const heading = {
	fontSize: 8,
	fontWeight: "bold" as const,
	color: "#111827",
	textTransform: "uppercase" as const,
	marginBottom: 3,
	letterSpacing: 0.3,
};

function shown(value: string | null | undefined, fallback: string): string {
	const trimmed = value?.trim();
	return trimmed ? trimmed : fallback;
}

function Line({ label, value }: { label: string; value: string }) {
	return (
		<Text style={line}>
			<Text style={{ fontWeight: "bold", color: "#374151" }}>{label}: </Text>
			<Text>{value}</Text>
		</Text>
	);
}

/** Bank and M-Pesa, side by side. Always printed; missing fields fall back to the company defaults. */
export function FixedPaymentDetailsPdf({ paymentDetails }: { paymentDetails?: PaymentDetails }) {
	const bank = INVOICE_PDF_PAYMENT_DEFAULTS;
	return (
		<View
			style={{
				flexDirection: "row",
				borderTopWidth: 1,
				borderTopStyle: "dashed",
				borderTopColor: "#d1d5db",
				paddingTop: 6,
				paddingBottom: 8,
			}}
		>
			<View style={{ flex: 1, paddingRight: 10 }}>
				<Text style={heading}>Bank</Text>
				<Line label="Bank Name" value={shown(paymentDetails?.bankName, bank.bankName)} />
				<Line label="Account Number" value={shown(paymentDetails?.accountNumber, bank.accountNumber)} />
				<Line label="Account Name" value={shown(paymentDetails?.accountName, bank.accountName)} />
				<Line label="Branch" value={shown(paymentDetails?.branchName, bank.branchName)} />
				<Line label="Branch Code" value={shown(paymentDetails?.branchCode, bank.branchCode)} />
				<Line label="Swift Code" value={shown(paymentDetails?.swiftCode, bank.swiftCode)} />
			</View>
			<View style={{ width: 1, backgroundColor: "#e5e7eb" }} />
			<View style={{ flex: 1, paddingLeft: 10 }}>
				<Text style={heading}>M-Pesa</Text>
				<Line
					label="Paybill Number"
					value={shown(paymentDetails?.mpesaPaybillNumber, bank.mpesaPaybillNumber)}
				/>
				<Line
					label="Account Number"
					value={shown(paymentDetails?.mpesaAccountNumber, bank.mpesaAccountNumber)}
				/>
				{paymentDetails?.mpesaInstructions?.trim() ? (
					<Line label="Instructions" value={paymentDetails.mpesaInstructions.trim()} />
				) : null}
			</View>
		</View>
	);
}
