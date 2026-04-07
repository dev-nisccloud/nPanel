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
            type: "mysql" | "postgresql" | "mssql";
            dbServerId?: number | undefined;
        };
        output: {
            raw: string;
            parsed: any;
            databaseId: any;
        };
        meta: object;
    }>;
}>>;
