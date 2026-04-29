export declare const wordpressRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            domain?: string | undefined;
            installationIds?: number[] | undefined;
            sortBy?: "title" | "version" | "displayTitle" | "ownerName" | undefined;
            sortOrder?: "asc" | "desc" | undefined;
        } | undefined;
        output: {
            data: any[];
            metadata: {
                endpoint: string;
                timestamp: string;
                totalInstallations: number;
                apiVersion: string;
                filters: {
                    domain: string | null;
                    installationIds: number[] | null;
                    sortBy: "title" | "version" | "displayTitle" | "ownerName";
                    sortOrder: "asc" | "desc";
                };
                note: string;
            };
        };
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: number;
        };
        output: {
            data: any;
            metadata: {
                endpoint: string;
                timestamp: string;
                totalInstallations: number;
                apiVersion: string;
                note: string;
            };
        };
        meta: object;
    }>;
}>>;
