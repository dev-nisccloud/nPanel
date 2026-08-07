export declare const subscriptionsCreateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            ownerId: number;
            hostingType?: "none" | "standard" | "vrt_hst" | undefined;
            ipAddress?: string | undefined;
            status?: number | undefined;
            description?: string | undefined;
            adminDescription?: string | undefined;
            planName?: string | undefined;
            planGuid?: string | undefined;
            planExternalId?: string | undefined;
            limitsXml?: string | undefined;
            permsXml?: string | undefined;
            prefsXml?: string | undefined;
            ipPoolXml?: string | undefined;
        };
        output: {
            raw: string;
            parsed: unknown;
        };
        meta: object;
    }>;
}>>;
