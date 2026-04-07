export declare const subdomainsDeleteRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id?: number | undefined;
            name?: string | undefined;
        };
        output: {
            success: boolean;
            deletedId: any;
            filterId: any;
            message: string;
        };
        meta: object;
    }>;
}>>;
