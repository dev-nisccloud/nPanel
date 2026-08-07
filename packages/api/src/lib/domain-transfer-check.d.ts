/** User-facing transfer check status for the UI. */
export type TransferStatus = "available" | "locked" | "ready" | "pending_check" | "reserved" | "unavailable";
export type TransferProvider = "kenic" | "openprovider";
export type CheckTransferResult = {
    transferStatus: TransferStatus;
    transferrable: boolean;
    provider: TransferProvider | null;
    domain: string;
    name: string | null;
    extension: string | null;
    price: number | null;
    currency: string | null;
    createPrice?: number | null;
    createCurrency?: string | null;
    error: string | null;
};
export declare function parseTransferDomain(input: string): {
    name: string;
    extension: string;
    full: string;
} | null;
/**
 * Check if a domain can be transferred and resolve provider pricing.
 * Shared by the domain transfer page and storefront cart upsell quotes.
 */
export declare function checkDomainTransferEligibility(domain: string): Promise<CheckTransferResult>;
