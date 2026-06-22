import type { CreditNoteDetail, InvoiceDetail } from "../routers/invoicing/schemas";
export type EtimsFiscalFields = {
    rcptSign: string;
    intrlData: string | null;
    curRcptNo: string | null;
    totRcptNo: string | null;
    sdcDateTime: string | null;
    /** Human-readable control unit date-time for the PDF footer. */
    sdcDateTimeDisplay: string | null;
    verificationUrl: string | null;
};
/** Format KRA `yyyyMMddHHmmss` for display on the invoice footer. */
export declare function formatKraSdcDateTimeDisplay(value: string | null | undefined): string | null;
/**
 * Mandatory KRA eTIMS receipt fields for printing on customer invoices.
 * Returns null when the invoice is not KRA-synced or fiscal data is missing.
 */
export declare function extractEtimsFiscalFieldsFromInvoice(invoice: Pick<InvoiceDetail, "kraStatus" | "kraSignature" | "kraReceiptNumber" | "kraVerificationUrl" | "kraQrCode" | "kraSyncResponse" | "kraVerifiedDate">): EtimsFiscalFields | null;
/** KRA fiscal footer fields for credit notes (same shape as invoices). */
export declare function extractEtimsFiscalFieldsFromCreditNote(creditNote: Pick<CreditNoteDetail, "kraStatus" | "kraSignature" | "kraReceiptNumber" | "kraVerificationUrl" | "kraQrCode" | "kraSyncResponse" | "kraVerifiedDate">): EtimsFiscalFields | null;
export type EtimsFiscalFooterField = {
    label: string;
    value: string;
};
/** Fiscal footer fields in display order (labels rendered bold with a colon). */
export declare function getEtimsFiscalFooterFields(fields: Pick<EtimsFiscalFields, "sdcDateTime" | "sdcDateTimeDisplay" | "intrlData" | "rcptSign">): EtimsFiscalFooterField[];
/** @deprecated Use {@link getEtimsFiscalFooterFields} for styled rendering. */
export declare function formatEtimsFiscalFooterPrimaryLine(fields: Pick<EtimsFiscalFields, "sdcDateTime" | "sdcDateTimeDisplay" | "intrlData" | "rcptSign">): string;
