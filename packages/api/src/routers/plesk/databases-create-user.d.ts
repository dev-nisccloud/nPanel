export declare const databasesCreateUserRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            siteId: number;
            databaseId: number;
            login: string;
            password: string;
            setAsDefault?: boolean | undefined;
        };
        output: {
            userId: number;
            login: string;
            password: string;
            databaseId: number;
            name: string;
            type: string;
            localHost: string;
            remoteHost: string;
            port: number;
        };
        meta: object;
    }>;
}>>;
