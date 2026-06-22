import type { EtimsFiscalFields } from "./types";
import type { YourDetails, CompanyDetails, InvoiceItemDetails, PaymentDetails, InvoiceTerms } from "./types";
export type AgencyInvoicePdfPageProps = {
    yourDetails: YourDetails;
    companyDetails: CompanyDetails;
    invoiceDetails: InvoiceItemDetails;
    paymentDetails: PaymentDetails;
    invoiceTerms: InvoiceTerms;
    etimsFiscal: EtimsFiscalFields | null;
    qrCodeDataUrl?: string;
    documentTitle?: string;
};
/**
 * Single A4 invoice page with optional fixed KRA eTIMS fiscal footer on every page.
 */
export declare function AgencyInvoicePdfPage({ yourDetails, companyDetails, invoiceDetails, paymentDetails, invoiceTerms, etimsFiscal, qrCodeDataUrl, documentTitle, }: AgencyInvoicePdfPageProps): import("react/jsx-runtime").JSX.Element;
