export declare const niscEmailMarketingSesIdentitiesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            identityType?: "Domain" | "EmailAddress" | undefined;
            maxPages?: number | undefined;
        } | undefined;
        output: {
            identityType: "Domain" | "EmailAddress";
            identities: string[];
            count: number;
            truncated: boolean;
        };
        meta: object;
    }>;
}>>;
