export declare const subscriptionsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: Record<string, never> | undefined;
        output: {
            raw: string;
            parsed: any;
        };
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: number;
            teamId?: string | undefined;
        };
        output: {
            raw: string;
            parsed: any;
        };
        meta: object;
    }>;
    getByTeamFilterIds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId: string;
            hostingSubType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
        };
        output: {
            hasServiceSubscriptions: boolean;
            raw: string;
            parsed: any;
        };
        meta: object;
    }>;
}>>;
