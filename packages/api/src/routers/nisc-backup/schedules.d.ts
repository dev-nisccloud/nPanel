import { NiscBackupListResponse, Schedule } from "../../types/nisc-backup";
export declare const niscBackupSchedulesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            search?: string | undefined;
            orderby?: string | undefined;
            order?: "asc" | "desc" | undefined;
        };
        output: NiscBackupListResponse<Schedule>;
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: Schedule;
        meta: object;
    }>;
    manage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            action: "create" | "modify";
            _id?: string | undefined;
            name?: string | undefined;
            cron?: string | undefined;
            enabled?: number | undefined;
        };
        output: unknown;
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
}>>;
