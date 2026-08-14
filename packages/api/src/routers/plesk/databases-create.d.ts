export declare const databasesCreateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            siteId: number;
            name: string;
            username: string;
            type?: "mysql" | "postgresql" | "mssql" | undefined;
            dbServerId?: number | undefined;
            password?: string | undefined;
        };
        output: {
            databaseId: number;
            userId: number;
            name: string;
            username: string;
            password: string;
            type: string;
            localHost: string;
            remoteHost: string;
            port: number;
        };
        meta: object;
    }>;
}>>;
