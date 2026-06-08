/**
 * Converts invoice API detail into a flat shape for server-side PDF generation.
 * Mirrors apps/web invoice-pdf-data (kept in API for workers and server routes).
 */
import type { InvoiceDetail } from "../routers/invoicing/schemas";
export type InvoiceForPdfData = Pick<InvoiceDetail, "fromDetails" | "customerDetails" | "paymentDetails" | "lineItems" | "note" | "discount" | "taxPercentage" | "currency" | "invoiceNumber" | "issueDate" | "dueDate" | "subtotal" | "tax" | "amount" | "customerName" | "customerEmail">;
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
declare function formatMoney(currency: string, amount: string): string;
export declare function convertInvoiceDetailToPdfRenderData(invoice: InvoiceForPdfData): InvoicePdfRenderData;
export declare function sanitizeInvoicePdfFilename(invoiceNumber: string): string;
export { formatMoney };
