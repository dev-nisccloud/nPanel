/**
 * KENIC supported TLDs.
 * Use for domain search filters, routing, or validation.
 */
export declare const kenicTldsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List all TLDs supported by KENIC (e.g. .ke, .co.ke, .or.ke).
     * These are the only TLDs that can be checked/registered via the KENIC EPP integration.
     */
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: Record<string, never> | undefined;
        output: {
            tlds: string[];
        };
        meta: object;
    }>;
}>>;
