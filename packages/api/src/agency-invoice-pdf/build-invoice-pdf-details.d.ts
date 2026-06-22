/**
 * Same PDF props as agency invoice details page (`buildInvoicePdfDetails` in agency.invoices.$id.tsx).
 */
import type { InvoiceDetail } from "../routers/invoicing/schemas";
import type { YourDetails, CompanyDetails, InvoiceItemDetails, PaymentDetails, InvoiceTerms, EtimsFiscalFields } from "./types";
export { COMPANY_LOGO_URL } from "../lib/company-branding";
export { resolveInvoiceEtimsVerificationUrl } from "../lib/etims-receipt-url";
export declare function buildInvoicePdfDetails(invoice: InvoiceDetail): {
    yourDetails: YourDetails;
    companyDetails: CompanyDetails;
    invoiceDetails: InvoiceItemDetails;
    paymentDetails: PaymentDetails;
    invoiceTerms: InvoiceTerms;
    etimsFiscal: EtimsFiscalFields | null;
};
