export declare const digitaxNoticesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            meta: {
                last_updated: string;
            };
            data: import("../../lib/digitax-client").DigiTaxNotice[];
        };
        meta: object;
    }>;
}>>;
