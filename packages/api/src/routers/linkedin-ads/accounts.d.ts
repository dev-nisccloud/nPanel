export declare const linkedInAdsAccountsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List all accessible LinkedIn ad accounts
     * Uses LinkedIn Marketing API to fetch accessible ad accounts
     */
    listAdAccounts: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            data: {
                id: string;
                name: string | null;
                currency: string | null;
                timezone: string | null;
                status: string | null;
                servingStatuses: string[];
                reference: string | null;
                type: string | null;
            }[];
            meta: {
                retrieved_at: string;
                total_accounts: number;
                paging: {
                    count?: number;
                    start?: number;
                    links?: Array<{
                        rel: string;
                        href: string;
                    }>;
                } | undefined;
            };
        } | {
            success: boolean;
            data: never[];
            meta: {
                retrieved_at: string;
                total_accounts: number;
                paging?: undefined;
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
                id: string;
                name: string | null;
                currency: string | null;
                timezone: string | null;
                status: string | null;
                servingStatuses: string[];
                reference: string | null;
                type: string | null;
            };
        };
        meta: object;
    }>;
}>>;
