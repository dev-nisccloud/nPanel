import { LogEntry, LogItem, JetBackupListResponse } from "../../types/jetbackup";
export declare const jetbackupLogsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
            type?: number | undefined;
            username?: string | undefined;
        };
        output: JetBackupListResponse<LogEntry> | null;
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: LogEntry | null;
        meta: object;
    }>;
    listItems: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            log_id: string;
            page?: number | undefined;
            limit?: number | undefined;
        };
        output: JetBackupListResponse<LogItem> | null;
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: any;
        meta: object;
    }>;
}>>;
