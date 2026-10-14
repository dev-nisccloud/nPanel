export type EtimsReceiptUrlSource = {
    kraStatus?: string | null;
    kraVerificationUrl?: string | null;
    kraQrCode?: string | null;
    kraSignature?: string | null;
    kraSyncResponse?: unknown;
    kraSyncPayload?: unknown;
    fromDetails?: unknown;
};
export type EtimsReceiptUrlOpts = {
    isSandbox?: boolean;
    tin?: string | null;
    bhfId?: string | null;
};
export type EtimsReceiptIdentity = {
    tin: string;
    bhfId: string;
    rcptSign: string;
    isSandbox?: boolean;
};
/** True when the value is a KRA public receipt URL (Receipt or the spec typo Recept). */
export declare function isEtimsReceiptVerifyUrl(url: string | null | undefined): boolean;
/**
 * KRA public receipt verification URL.
 * Query string is PIN + branch + receipt signature with no separators.
 */
export declare function buildEtimsReceiptVerifyUrl(params: {
    tin: string;
    bhfId: string;
    rcptSign: string;
    isSandbox?: boolean;
}): string | null;
export declare function parseEtimsReceiptVerifyUrl(url: string | null | undefined): EtimsReceiptIdentity | null;
export declare function normalizeEtimsReceiptVerifyUrl(url: string | null | undefined): string | null;
export declare function extractOscuIdentityForReceiptUrl(invoice: EtimsReceiptUrlSource, opts?: EtimsReceiptUrlOpts): {
    tin: string;
    bhfId: string;
    rcptSign: string;
} | null;
/**
 * Invoice / credit-note QR payload. Always the same KRA receipt URL the
 * verify button opens.
 */
export declare function resolveInvoiceEtimsVerificationUrl(invoice: EtimsReceiptUrlSource, opts?: EtimsReceiptUrlOpts): string | undefined;
export declare function extractRcptSignFromKraResponse(data: unknown): string | null;
export declare function parseKraSdcDateTime(value: string | Date | null | undefined): Date | null;
export declare function kraSdcDateTimeToCompact(value: string | Date | null | undefined): string | null;
