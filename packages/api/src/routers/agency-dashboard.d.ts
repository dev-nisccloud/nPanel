export declare const agencyDashboardRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Count customer vs agency user accounts for the agency dashboard card,
     * including active / inactive status breakdowns.
     */
    getAccountCounts: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            customers: {
                total: number;
                active: number;
                inactive: number;
            };
            agency: {
                total: number;
                active: number;
                inactive: number;
            };
            total: number;
        };
        meta: object;
    }>;
    /**
     * Get media buying platforms connection status
     */
    getMediaBuyingPlatforms: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            platforms: {
                name: string;
                key: string;
                connected: boolean;
                accountCount: number;
            }[];
            totalConnected: number;
        };
        meta: object;
    }>;
    /**
     * Get hosting subscriptions summary from Plesk
     */
    getHostingSubscriptions: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            total: number;
            active: number;
            suspended: number;
            cancelled: number;
            expired: number;
            pending: number;
            inactive: number;
        };
        meta: object;
    }>;
}>>;
