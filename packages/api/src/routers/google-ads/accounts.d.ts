export declare const googleAdsAccountsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List all accessible Google Ads accounts (customers)
     * Uses Google Ads API to fetch accessible customer accounts
     */
    listAccessibleAccounts: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            forceRefresh?: boolean | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                customerId: string;
                accountName: string | null;
                currencyCode: string | null;
                timeZone: string | null;
                status: string;
                resourceName: string;
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
     * Get account details for a specific Google Ads customer
     * Fetches account metadata from API and stores/updates in database
     */
    getAccountDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
        };
        output: {
            success: boolean;
            data: {
                customerId: string;
                accountName: any;
                currencyCode: any;
                timeZone: any;
                status: "ACTIVE" | "PAUSED" | "REMOVED";
            };
            meta: {
                retrieved_at: string;
                account_id: string;
            };
        };
        meta: object;
    }>;
}>>;
