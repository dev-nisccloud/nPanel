export declare const digitaxBranchesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getETimsInfo: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: import("../../lib/digitax-client").DigiTaxBranch;
        meta: object;
    }>;
    getBranches: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            data: import("../../lib/digitax-client").DigiTaxBranch[];
        };
        meta: object;
    }>;
}>>;
