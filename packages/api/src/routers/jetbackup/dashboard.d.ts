import { DashboardDetails, SystemInfo } from "../../types/jetbackup";
export declare const jetbackupDashboardRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: DashboardDetails | null;
        meta: object;
    }>;
    testConnection: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            message: string;
            timestamp: string;
        };
        meta: object;
    }>;
    getInfo: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: SystemInfo | null;
        meta: object;
    }>;
    getStatistics: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            range?: string | undefined;
        };
        output: any;
        meta: object;
    }>;
}>>;
