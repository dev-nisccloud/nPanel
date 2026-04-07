export declare const metaPagesListRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get list of Facebook Pages managed by the user
     */
    getPages: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            fields?: string[] | undefined;
            accessToken?: string | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: any;
            meta: {
                retrieved_at: string;
                total_pages: any;
            };
        };
        meta: object;
    }>;
    /**
     * Get page token ID from page ID
     * Returns the database ID of the page token for a given Facebook page ID
     */
    getPageTokenId: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pageId: string;
        };
        output: {
            success: boolean;
            data: {
                pageTokenId: string;
                pageId: string;
                pageName: string | null;
            };
        };
        meta: object;
    }>;
    /**
     * Get a specific page by ID
     */
    getPage: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pageId: string;
            fields?: string[] | undefined;
            accessToken?: string | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: any;
            meta: {
                retrieved_at: string;
                page_id: string;
            };
        };
        meta: object;
    }>;
    /**
     * Get page insights/analytics
     */
    getPageInsights: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pageId: string;
            metrics?: string[] | undefined;
            period?: "day" | "week" | "days_28" | undefined;
            since?: string | undefined;
            until?: string | undefined;
            accessToken?: string | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: any;
            meta: {
                retrieved_at: string;
                page_id: string;
            };
        };
        meta: object;
    }>;
}>>;
