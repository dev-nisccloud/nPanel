export declare const niscEmailMarketingQuotaRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    status: import("@trpc/server").TRPCQueryProcedure<{
        input: Record<string, never> | undefined;
        output: {
            windowStart: Date;
            windowEnd: Date;
            maxSendRate: number;
            max24HourSend: number;
            sentLast24HoursAtStart: number;
            reservedEmails: number;
            remainingEmails: number;
        };
        meta: object;
    }>;
}>>;
