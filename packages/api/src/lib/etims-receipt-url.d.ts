import type { InvoiceDetail } from "../routers/invoicing/schemas";
/** Only KRA eTIMS verification URLs are valid for invoice PDF QR codes. */
export declare function resolveInvoiceEtimsVerificationUrl(invoice: Pick<InvoiceDetail, "kraStatus" | "kraVerificationUrl" | "kraQrCode">): string | undefined;
/**
 * KRA public receipt verification URL (OSCUs/VSCU spec v2.0).
 */
export declare function buildEtimsReceiptVerifyUrl(params: {
    tin: string;
    bhfId: string;
    rcptSign: string;
    isSandbox?: boolean;
}): string | null;
export declare function extractRcptSignFromKraResponse(data: unknown): string | null;
export declare function parseKraSdcDateTime(value: string | null | undefined): Date | null;
