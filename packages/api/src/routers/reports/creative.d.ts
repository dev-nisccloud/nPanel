export declare const creativeReportsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getProductionStats: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from?: unknown;
            to?: unknown;
            limit?: number | undefined;
        };
        output: {
            id: string;
            period: string;
            date: Date;
            assetsCreated: number;
            assetsApproved: number;
            versionsCreated: number;
            avgVelocityDays: number | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: object;
    }>;
    sync: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            period?: "MONTHLY" | "DAILY" | undefined;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
}>>;
