export declare const linkedinPagesListRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get list of LinkedIn Organizations managed by the user
     */
    getOrganizations: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accessToken?: string | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: any;
            meta: {
                retrieved_at: string;
                total_organizations: any;
            };
        };
        meta: object;
    }>;
    /**
     * Get organization token ID from organization ID
     * Returns the database ID of the organization token for a given LinkedIn organization ID
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
     * Get a specific organization by ID
     */
    getOrganization: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            orgId: string;
            accessToken?: string | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: any;
            meta: {
                retrieved_at: string;
                organization_id: string;
            };
        };
        meta: object;
    }>;
}>>;
