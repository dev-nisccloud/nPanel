import { DashboardDetails, SystemInfo } from "../../types/jetbackup";
export declare const jetbackupDashboardRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: DashboardDetails;
        meta: object;
    }>;
    testConnection: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            message: string;
            timestamp: string;
            system: {
                version: string;
                tier: string;
                type: string;
                disableui: boolean;
                dr: boolean;
                agreement_panel: boolean;
                agreement: boolean;
                licenseIssue: boolean;
            } | null;
            data: SystemInfo | null;
        };
        meta: object;
    }>;
    getInfo: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: SystemInfo;
        meta: object;
    }>;
    getStatistics: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            range?: string | undefined;
        };
        output: unknown;
        meta: object;
    }>;
    listShowcase: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
}>>;
