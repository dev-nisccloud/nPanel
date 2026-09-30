export type EtimsReceiptUrlSource = {
    kraStatus?: string | null;
    kraVerificationUrl?: string | null;
    kraQrCode?: string | null;
    kraSignature?: string | null;
    kraSyncResponse?: unknown;
    kraSyncPayload?: unknown;
    fromDetails?: unknown;
};
/** True when the value is a KRA public receipt URL (Receipt or the spec typo Recept). */
export declare function isEtimsReceiptVerifyUrl(url: string | null | undefined): boolean;
/**
 * KRA public receipt verification URL (OSCU/VSCU spec v2.0).
 * Query string is PIN + branch + receipt signature with no separators.
 */
export declare function buildEtimsReceiptVerifyUrl(params: {
    tin: string;
    bhfId: string;
    rcptSign: string;
    isSandbox?: boolean;
}): string | null;
export declare function extractOscuIdentityForReceiptUrl(invoice: EtimsReceiptUrlSource): {
    tin: string;
    bhfId: string;
    rcptSign: string;
} | null;
/**
 * Invoice / credit-note QR payload. Always the KRA receipt URL.
 */
export declare function resolveInvoiceEtimsVerificationUrl(invoice: EtimsReceiptUrlSource, opts?: {
    isSandbox?: boolean;
}): string | undefined;
export declare function extractRcptSignFromKraResponse(data: unknown): string | null;
export declare function parseKraSdcDateTime(value: string | Date | null | undefined): Date | null;
export declare function kraSdcDateTimeToCompact(value: string | Date | null | undefined): string | null;
