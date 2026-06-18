/**
 * Same PDF props as agency invoice details page (`buildInvoicePdfDetails` in agency.invoices.$id.tsx).
 */
import type { InvoiceDetail } from "../routers/invoicing/schemas";
import type { YourDetails, CompanyDetails, InvoiceItemDetails, PaymentDetails, InvoiceTerms } from "./types";
/** Hardcoded company logo URL (agency invoice details page). */
export declare const COMPANY_LOGO_URL = "https://1ris7itpac.ufs.sh/f/Djp547U8wumpc6W8YsByRo9NZiWnUlHKbYue0GmqwgTBEtJz";
export declare function buildInvoicePdfDetails(invoice: InvoiceDetail): {
    yourDetails: YourDetails;
    companyDetails: CompanyDetails;
    invoiceDetails: InvoiceItemDetails;
    paymentDetails: PaymentDetails;
    invoiceTerms: InvoiceTerms;
    etimsFiscal: import("../lib/etims-fiscal-fields").EtimsFiscalFields | null;
};
export { resolveInvoiceEtimsVerificationUrl } from "../lib/etims-receipt-url";
