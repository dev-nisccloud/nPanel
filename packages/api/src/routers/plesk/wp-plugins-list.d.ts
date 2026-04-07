export declare const wpPluginsListRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getByInstallationId: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: {
            data: any;
            metadata: {
                endpoint: string;
                timestamp: string;
                installationId: number;
                apiVersion: string;
                note: string;
            };
        };
        meta: object;
    }>;
    getCatalog: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
            page?: number | undefined;
            pageSize?: number | undefined;
            term?: string | undefined;
            compatible?: boolean | undefined;
            downloadCount?: number | undefined;
            rating?: number | undefined;
            lastUpdatedAt?: string | undefined;
        };
        output: {
            data: any;
            metadata: {
                endpoint: string;
                timestamp: string;
                installationId: number;
                filters: {
                    page?: number | undefined;
                    pageSize?: number | undefined;
                    term?: string | undefined;
                    compatible?: boolean | undefined;
                    downloadCount?: number | undefined;
                    rating?: number | undefined;
                    lastUpdatedAt?: string | undefined;
                };
                apiVersion: string;
                note: string;
            };
        };
        meta: object;
    }>;
}>>;
