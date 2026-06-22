import type { YourDetails, CompanyDetails, InvoiceItemDetails, PaymentDetails, InvoiceTerms } from "../types";
export declare const PdfDetails: ({ yourDetails, companyDetails, invoiceDetails, paymentDetails, invoiceTerms, documentTitle, }: {
    yourDetails: YourDetails;
    companyDetails: CompanyDetails;
    invoiceDetails: InvoiceItemDetails;
    paymentDetails: PaymentDetails & {
        qrCodeDataUrl?: string;
    };
    invoiceTerms: InvoiceTerms;
    documentTitle?: string;
}) => import("react/jsx-runtime").JSX.Element;
