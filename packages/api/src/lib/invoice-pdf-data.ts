/**
 * Converts invoice API detail into a flat shape for server-side PDF generation.
 * Mirrors apps/web invoice-pdf-data (kept in API for workers and server routes).
 */
import type { InvoiceDetail } from "../routers/invoicing/schemas";

const COMPANY_LOGO_URL =
	"https://res.cloudinary.com/df5ntv9gb/image/upload/v1758621603/Nisc_Logo_Original_im5pgk.png";

export type InvoiceForPdfData = Pick<
	InvoiceDetail,
	| "fromDetails"
	| "customerDetails"
	| "paymentDetails"
	| "lineItems"
	| "note"
	| "discount"
	| "taxPercentage"
	| "currency"
	| "invoiceNumber"
	| "issueDate"
	| "dueDate"
	| "subtotal"
	| "tax"
	| "amount"
	| "customerName"
	| "customerEmail"
>;

export interface InvoicePdfLineItem {
	name: string;
	description?: string;
	quantity: number;
	price: string;
	total: string;
}

export interface InvoicePdfRenderData {
	logoUrl: string;
	fromName: string;
	fromEmail: string;
	fromAddress: string;
	fromCity: string;
	fromCountry: string;
	fromTaxId?: string;
	customerName: string;
	customerEmail?: string;
	customerAddress?: string;
	customerCity?: string;
	customerCountry?: string;
	customerTaxId?: string;
	invoiceNumber: string;
	issueDate: string;
	dueDate: string;
	currency: string;
	lineItems: InvoicePdfLineItem[];
	subtotal: string;
	tax: string;
	taxPercentage: number;
	total: string;
	paymentMethod: string;
	bankName?: string;
	branchName?: string;
	branchCode?: string;
	accountNumber?: string;
	accountName?: string;
	swiftCode?: string;
	qrCodeValue?: string;
}

function formatPdfDate(value: Date | string | null | undefined): string {
	if (!value) return "N/A";
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return "N/A";
	return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMoney(currency: string, amount: string): string {
	const n = Number.parseFloat(amount);
	if (Number.isNaN(n)) return `${currency} ${amount}`;
	return `${currency} ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function convertInvoiceDetailToPdfRenderData(invoice: InvoiceForPdfData): InvoicePdfRenderData {
	const from = (invoice.fromDetails ?? {}) as Record<string, unknown>;
	const customer = (invoice.customerDetails ?? {}) as Record<string, unknown>;
	const payment = (invoice.paymentDetails ?? {}) as Record<string, unknown>;
	const currency = invoice.currency ?? "KES";

	const lineItems: InvoicePdfLineItem[] = invoice.lineItems.map((item) => ({
		name: item.name ?? "Service",
		description: item.description ?? undefined,
		quantity: item.quantity ?? 1,
		price: item.price ?? "0",
		total: item.total ?? item.price ?? "0",
	}));

	const paymentMethodRaw = String(payment.paymentMethod ?? payment.method ?? "BANK_TRANSFER");
	const paymentMethod =
		paymentMethodRaw === "MPESA"
			? "M-Pesa"
			: paymentMethodRaw === "CHEQUE"
				? "Cheque"
				: "Bank transfer";

	return {
		logoUrl: COMPANY_LOGO_URL,
		fromName: String(from.name ?? "Nisc Cloud Limited"),
		fromEmail: String(from.email ?? "accounts@nisccloud.com"),
		fromAddress: String(from.address ?? ""),
		fromCity: String(from.city ?? "Nairobi"),
		fromCountry: String(from.country ?? "Kenya"),
		fromTaxId: from.taxId ? String(from.taxId) : undefined,
		customerName: String(customer.name ?? invoice.customerName ?? "Customer"),
		customerEmail: customer.email ? String(customer.email) : undefined,
		customerAddress: customer.address ? String(customer.address) : undefined,
		customerCity: customer.city ? String(customer.city) : undefined,
		customerCountry: customer.country ? String(customer.country) : undefined,
		customerTaxId: customer.taxId ? String(customer.taxId) : undefined,
		invoiceNumber: invoice.invoiceNumber ?? "Invoice",
		issueDate: formatPdfDate(invoice.issueDate),
		dueDate: formatPdfDate(invoice.dueDate),
		currency,
		lineItems,
		subtotal: invoice.subtotal ?? "0",
		tax: invoice.tax ?? "0",
		taxPercentage: invoice.taxPercentage ?? 16,
		total: invoice.amount ?? "0",
		paymentMethod,
		bankName: payment.bankName ? String(payment.bankName) : undefined,
		branchName: payment.branchName ? String(payment.branchName) : undefined,
		branchCode: payment.branchCode ? String(payment.branchCode) : undefined,
		accountNumber: payment.accountNumber ? String(payment.accountNumber) : undefined,
		accountName: payment.accountName ? String(payment.accountName) : undefined,
		swiftCode: payment.swiftCode ? String(payment.swiftCode) : undefined,
		qrCodeValue: payment.qrCodeValue ? String(payment.qrCodeValue) : undefined,
	};
}

export function sanitizeInvoicePdfFilename(invoiceNumber: string): string {
	return `${invoiceNumber.replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;
}

export { formatMoney };
