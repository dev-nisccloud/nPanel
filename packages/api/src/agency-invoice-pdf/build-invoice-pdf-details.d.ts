/**
 * Same PDF props as agency invoice details page (`buildInvoicePdfDetails` in agency.invoices.$id.tsx).
 */
import type { InvoiceDetail } from "../routers/invoicing/schemas";
import type { YourDetails, CompanyDetails, InvoiceItemDetails, PaymentDetails, InvoiceTerms } from "./types";
/** Hardcoded company logo URL (agency invoice details page). */
export declare const COMPANY_LOGO_URL = "https://1ris7itpac.ufs.sh/f/Djp547U8wump3qA5tI0B0YR5y2nLQfpSevIHluzKDEZ9mr1s";
export declare function buildInvoicePdfDetails(invoice: InvoiceDetail): {
    yourDetails: YourDetails;
    companyDetails: CompanyDetails;
    invoiceDetails: InvoiceItemDetails;
    paymentDetails: PaymentDetails;
    invoiceTerms: InvoiceTerms;
};
