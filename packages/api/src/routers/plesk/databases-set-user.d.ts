export declare const databasesSetUserRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            siteId: number;
            databaseId: number;
            userId: number;
            password?: string | undefined;
            passwordType?: "plain" | "crypt" | undefined;
            role?: "readWrite" | "readOnly" | "writeOnly" | undefined;
            acl?: string[] | undefined;
            allowAccessFrom?: string[] | undefined;
        };
        output: {
            raw: string;
            parsed: Record<string, unknown>;
        };
        meta: object;
    }>;
}>>;
