export declare const databasesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getBySiteId: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            siteId: number;
        };
        output: {
            raw: string;
            parsed: Record<string, unknown>;
        };
        meta: object;
    }>;
    getRelatedSites: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            siteId: number;
        };
        output: {
            relatedSites: Record<string, import("../../lib/plesk/database-related-site").RelatedSite>;
        };
        meta: object;
    }>;
    getConnectionInfo: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            siteId: number;
            databaseId: number;
            teamId?: string | undefined;
        };
        output: {
            databaseId: number;
            name: string;
            type: string;
            localHost: string;
            remoteHost: string;
            port: number;
            users: {
                id: number;
                login: string;
            }[];
            defaultUserId: number | null;
            defaultUserLogin: string | null;
        };
        meta: object;
    }>;
    getPhpMyAdminUrl: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            siteId: number;
            databaseId: number;
            teamId?: string | undefined;
        };
        output: {
            url: string;
        };
        meta: object;
    }>;
}>>;
