export declare const metaAdsAccountsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List all accessible Meta ad accounts
     * Uses Meta Marketing API to fetch accessible ad accounts
     */
    listAdAccounts: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            forceRefresh?: boolean | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                id: string;
                accountId: string;
                accountName: string | null;
                currency: string | null;
                timezone: string | null;
                status: string;
                spendLimit: string | null;
                amountSpent: string | null;
                balance: string | null;
                updatedAt: Date;
            }[];
            meta: {
                retrieved_at: string;
                total_accounts: number;
                source: string;
            };
        } | {
            success: boolean;
            data: {
                id: string;
                accountId: string;
                accountName: string | null;
                currency: string | null;
                timezone: string | null;
                status: "ACTIVE" | "CLOSED" | "DISABLED" | "UNSETTLED" | "PENDING_REVIEW" | "IN_GRACE_PERIOD" | "PENDING_CLOSURE";
                spendLimit: string | null;
                amountSpent: string | null;
                balance: string | null;
                updatedAt: string;
            }[];
            meta: {
                retrieved_at: string;
                total_accounts: number;
                source: string;
            };
        };
        meta: object;
    }>;
    /**
     * Get ad account details
     */
    getAccountDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accountId: string;
        };
        output: {
            success: boolean;
            data: {
                status: "ACTIVE" | "CLOSED" | "DISABLED" | "UNSETTLED" | "PENDING_REVIEW" | "IN_GRACE_PERIOD" | "PENDING_CLOSURE";
                account_id: string;
                name?: string;
                currency?: string;
                timezone_name?: string;
                account_status?: number;
                spend_cap?: string;
                amount_spent?: string;
                balance?: string;
            };
        };
        meta: object;
    }>;
}>>;
