export type Item = {
    id?: string;
    itemDescription: string;
    amount?: number;
    qty?: number;
};
export type YourDetails = {
    yourEmail?: string;
    yourName?: string;
    yourAddress?: string;
    yourCity?: string;
    yourState?: string;
    yourCountry?: string;
    yourLogo?: string;
    /** Optional logo frame width in pt (height scales with auth 3:1 box). Default matches `pdfBrandingLogoBox`. */
    yourLogoWidth?: number;
    yourTaxId?: string;
    yourZip?: string;
};
export type CompanyDetails = {
    email?: string;
    companyName?: string;
    companyAddress?: string;
    companyCity?: string;
    companyState?: string;
    companyCountry?: string;
    companyTaxId?: string;
    companyZip?: string;
};
export type InvoiceItemDetails = {
    note?: string;
    discount?: string;
    taxRate?: string;
    items: Item[];
    currency?: string;
    /** Smaller, bold line typography (e.g. cron-generated media buying PDFs). */
    compactLineItems?: boolean;
};
export type PaymentMethod = "bank" | "mpesa" | "cheque";
export type PaymentDetails = {
    paymentMethod?: PaymentMethod;
    currency?: string;
    /** KRA eTIMS receipt verification URL  the only QR source rendered on PDFs. */
    etimsVerificationUrl?: string;
    /** @deprecated Bank/marketing QR values must not appear on fiscal PDFs. */
    qrCodeValue?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    branchName?: string;
    branchCode?: string;
    swiftCode?: string;
    mpesaPaybillNumber?: string;
    mpesaAccountNumber?: string;
    mpesaInstructions?: string;
    chequeDeliveryAddress?: string;
    chequeInstructions?: string;
};
export type InvoiceTerms = {
    invoiceNumber?: string;
    issueDate?: string | Date;
    issuedAtDisplay?: string;
    dueDate?: string | Date;
    /** Shown on credit notes instead of due date */
    originalInvoiceNumber?: string;
    /** Meta label for the document number row (default: INVOICE NO) */
    numberLabel?: string;
    /** When false, due date row is hidden (credit notes) */
    showDueDate?: boolean;
};
export type { EtimsFiscalFields } from "../lib/etims-fiscal-fields";
