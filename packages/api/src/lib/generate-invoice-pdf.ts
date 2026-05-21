/**
 * Server-side invoice PDF generation (Nisc worker, API routes).
 * Uses React.createElement (no JSX) so the API package does not require react/jsx-runtime.
 */
import React from "react";
import {
	Document,
	Image,
	Page,
	Text,
	View,
	StyleSheet,
	renderToBuffer,
} from "@react-pdf/renderer";
import {
	convertInvoiceDetailToPdfRenderData,
	type InvoiceForPdfData,
	type InvoicePdfRenderData,
} from "./invoice-pdf-data";

const styles = StyleSheet.create({
	page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
	headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
	logo: { width: 120, height: 48, objectFit: "contain" },
	fromBlock: { maxWidth: 240, textAlign: "right" },
	sectionTitle: { fontSize: 9, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 },
	bold: { fontWeight: 700 },
	twoCol: {
		flexDirection: "row",
		marginBottom: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#e5e7eb",
		paddingBottom: 16,
	},
	col: { flex: 1 },
	tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: 6, marginTop: 8 },
	tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", padding: 6 },
	cellDesc: { flex: 3 },
	cellQty: { flex: 0.6, textAlign: "right" },
	cellPrice: { flex: 1, textAlign: "right" },
	cellTotal: { flex: 1, textAlign: "right" },
	totals: { marginTop: 12, alignItems: "flex-end" },
	totalLine: { flexDirection: "row", width: 200, justifyContent: "space-between", marginTop: 4 },
	payment: { marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
});

async function getQrCodeDataUrl(value: string): Promise<string | undefined> {
	try {
		const QRCodeUtil = await import("qrcode");
		return await QRCodeUtil.toDataURL(value, { width: 120, margin: 1 });
	} catch {
		return undefined;
	}
}

function buildInvoicePdfDocument(
	data: InvoicePdfRenderData,
	qrCodeDataUrl?: string,
): React.ReactElement {
	const lineRows = data.lineItems.map((item, i) =>
		React.createElement(
			View,
			{ key: `line-${i}`, style: styles.tableRow },
			React.createElement(
				View,
				{ style: styles.cellDesc },
				React.createElement(Text, { style: styles.bold }, item.name),
				item.description
					? React.createElement(Text, { style: { color: "#4b5563" } }, item.description)
					: null,
			),
			React.createElement(Text, { style: styles.cellQty }, String(item.quantity)),
			React.createElement(Text, { style: styles.cellPrice }, `${data.currency} ${item.price}`),
			React.createElement(Text, { style: styles.cellTotal }, `${data.currency} ${item.total}`),
		),
	);

	return React.createElement(
		Document,
		null,
		React.createElement(
			Page,
			{ size: "A4", style: styles.page },
			React.createElement(
				View,
				{ style: styles.headerRow },
				React.createElement(Image, { src: data.logoUrl, style: styles.logo }),
				React.createElement(
					View,
					{ style: styles.fromBlock },
					React.createElement(Text, { style: styles.bold }, data.fromName),
					React.createElement(Text, null, data.fromEmail),
					React.createElement(Text, null, data.fromAddress),
					React.createElement(Text, null, `${data.fromCity}, ${data.fromCountry}`),
					data.fromTaxId
						? React.createElement(Text, null, `Tax ID: ${data.fromTaxId}`)
						: null,
				),
			),
			React.createElement(
				Text,
				{ style: { fontSize: 22, fontWeight: 700, marginBottom: 16 } },
				"INVOICE",
			),
			React.createElement(
				View,
				{ style: styles.twoCol },
				React.createElement(
					View,
					{ style: styles.col },
					React.createElement(Text, { style: styles.sectionTitle }, "Bill to"),
					React.createElement(Text, { style: styles.bold }, data.customerName),
					data.customerEmail
						? React.createElement(Text, null, data.customerEmail)
						: null,
					data.customerAddress
						? React.createElement(Text, null, data.customerAddress)
						: null,
					data.customerCity || data.customerCountry
						? React.createElement(
								Text,
								null,
								[data.customerCity, data.customerCountry].filter(Boolean).join(", "),
							)
						: null,
					data.customerTaxId
						? React.createElement(Text, null, `Tax ID: ${data.customerTaxId}`)
						: null,
				),
				React.createElement(
					View,
					{ style: styles.col },
					React.createElement(
						Text,
						null,
						React.createElement(Text, { style: styles.bold }, "Invoice #: "),
						data.invoiceNumber,
					),
					React.createElement(
						Text,
						null,
						React.createElement(Text, { style: styles.bold }, "Issue date: "),
						data.issueDate,
					),
					React.createElement(
						Text,
						null,
						React.createElement(Text, { style: styles.bold }, "Due date: "),
						data.dueDate,
					),
				),
			),
			React.createElement(
				View,
				{ style: styles.tableHeader },
				React.createElement(Text, { style: styles.cellDesc }, "Description"),
				React.createElement(Text, { style: styles.cellQty }, "Qty"),
				React.createElement(Text, { style: styles.cellPrice }, "Price"),
				React.createElement(Text, { style: styles.cellTotal }, "Total"),
			),
			...lineRows,
			React.createElement(
				View,
				{ style: styles.totals },
				React.createElement(
					View,
					{ style: styles.totalLine },
					React.createElement(Text, null, "Subtotal"),
					React.createElement(Text, null, `${data.currency} ${data.subtotal}`),
				),
				React.createElement(
					View,
					{ style: styles.totalLine },
					React.createElement(Text, null, `Tax (${data.taxPercentage}%)`),
					React.createElement(Text, null, `${data.currency} ${data.tax}`),
				),
				React.createElement(
					View,
					{ style: [styles.totalLine, { marginTop: 8 }] },
					React.createElement(Text, { style: styles.bold }, "Total"),
					React.createElement(Text, { style: styles.bold }, `${data.currency} ${data.total}`),
				),
			),
			React.createElement(
				View,
				{ style: styles.payment },
				React.createElement(Text, { style: styles.sectionTitle }, "Payment details"),
				React.createElement(Text, null, `Method: ${data.paymentMethod}`),
				data.bankName ? React.createElement(Text, null, `Bank: ${data.bankName}`) : null,
				data.branchName ? React.createElement(Text, null, `Branch: ${data.branchName}`) : null,
				data.branchCode ? React.createElement(Text, null, `Branch code: ${data.branchCode}`) : null,
				data.accountName
					? React.createElement(Text, null, `Account name: ${data.accountName}`)
					: null,
				data.accountNumber
					? React.createElement(Text, null, `Account number: ${data.accountNumber}`)
					: null,
				data.swiftCode ? React.createElement(Text, null, `SWIFT: ${data.swiftCode}`) : null,
				qrCodeDataUrl
					? React.createElement(Image, {
							src: qrCodeDataUrl,
							style: { width: 80, height: 80, marginTop: 8 },
						})
					: null,
			),
		),
	);
}

export async function generateInvoicePdfBuffer(invoice: InvoiceForPdfData): Promise<Buffer> {
	const data = convertInvoiceDetailToPdfRenderData(invoice);
	const qrCodeDataUrl = data.qrCodeValue ? await getQrCodeDataUrl(data.qrCodeValue) : undefined;
	const doc = buildInvoicePdfDocument(data, qrCodeDataUrl);
	return await renderToBuffer(doc);
}
