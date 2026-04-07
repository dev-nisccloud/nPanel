export declare const openProviderTldRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get TLDs with query parameters (GET-style)
     */
    getTlds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            limit?: unknown;
            offset?: unknown;
            extensions?: string | undefined;
            status?: "ACT" | "INACT" | undefined;
            with_price?: unknown;
            with_description?: unknown;
            with_restrictions?: unknown;
        } | undefined;
        output: {
            success: boolean;
            data: {
                results: import("../../types/openprovider").OpenProviderTld[];
                total: number;
            };
            meta: {
                cached: boolean;
                fetched_at: string;
                total: number;
                limit: number | undefined;
                offset: number | undefined;
            };
        };
        meta: object;
    }>;
    /**
     * Get TLDs with request body (POST-style)
     */
    getTldsPost: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            limit?: number | undefined;
            offset?: number | undefined;
            extensions?: string[] | undefined;
            status?: "ACT" | "INACT" | undefined;
            with_price?: boolean | undefined;
            with_description?: boolean | undefined;
            with_restrictions?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: {
                results: import("../../types/openprovider").OpenProviderTld[];
                total: number;
            };
            meta: {
                cached: boolean;
                fetched_at: string;
                total: number;
                limit: number | undefined;
                offset: number | undefined;
            };
        };
        meta: object;
    }>;
    /**
     * Get popular TLD extensions
     */
    getPopularTlds: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            data: {
                results: import("../../types/openprovider").OpenProviderTld[];
                total: number;
            };
            meta: {
                cached: boolean;
                fetched_at: string;
                total: number;
                popular_extensions: string[];
            };
        };
        meta: object;
    }>;
    /**
     * Get TLD by extension
     */
    getTldByExtension: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            extension: string;
        };
        output: {
            success: boolean;
            data: import("../../types/openprovider").OpenProviderTld;
            meta: {
                cached: boolean;
                fetched_at: string;
            };
        };
        meta: object;
    }>;
    /**
     * Search TLDs by name pattern
     */
    searchTlds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pattern: string;
            limit?: number | undefined;
        };
        output: {
            success: boolean;
            data: {
                results: import("../../types/openprovider").OpenProviderTld[];
                total: number;
            };
            meta: {
                cached: boolean;
                fetched_at: string;
                search_pattern: string;
                filtered_count: number;
                returned_count: number;
            };
        };
        meta: object;
    }>;
}>>;
