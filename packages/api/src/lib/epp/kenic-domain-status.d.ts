export type KenicPortfolioStatus = "ACTIVE" | "EXPIRED" | "PENDING" | "SUSPENDED" | "TRANSFERRING";
/**
 * Map KENIC/CoCCA EPP domain statuses to portfolio display status.
 * Locked domains often lose `active`/`ok` and only show clientTransferProhibited  still ACTIVE.
 */
export declare function mapKenicEppStatusesToPortfolioStatus(statuses: Array<{
    status?: string;
}>, exDate?: string | null): KenicPortfolioStatus;
export declare function isKenicTransferLocked(statuses: Array<{
    status?: string;
}>): boolean;
export declare function isKenicServerTransferLocked(statuses: Array<{
    status?: string;
}>): boolean;
