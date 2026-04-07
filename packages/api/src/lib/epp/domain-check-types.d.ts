/**
 * Normalized shapes for KENIC EPP domain check responses.
 * Derived from real fee:chkData and domain:chkData so UI and other callers can use a stable structure.
 */
/** Fee for one operation (create/renew/transfer/restore). */
export interface DomainCheckFeeItem {
    description?: string;
    amount: number;
    currency: string;
    refundable?: boolean;
    gracePeriod?: string;
}
/** One domain in the normalized check result. */
export interface DomainCheckResultItem {
    domain: string;
    available: boolean;
    /** Present when available is false (e.g. "The domain exists"). */
    reason?: string;
    /** Set when withFee was true and server returned fee data. */
    currency?: string;
    /** Fee class from registry (e.g. "standard", "premium"). */
    feeClass?: string;
    createFee?: DomainCheckFeeItem;
    renewFee?: DomainCheckFeeItem;
    transferFee?: DomainCheckFeeItem;
    restoreFee?: DomainCheckFeeItem;
}
/** Normalized domain check response (array of domains with availability and optional fees). */
export type DomainCheckNormalized = DomainCheckResultItem[];
/**
 * Build normalized domain check result from parsed EPP response.
 * Merges resData (availability) and extension fee:chkData (fees) by domain name.
 */
export declare function normalizeDomainCheckResponse(parsed: Record<string, unknown>): DomainCheckNormalized;
