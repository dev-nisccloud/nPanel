import { NiscBackupListResponse, LogEntry, LogItem } from "../../types/nisc-backup";
export declare const niscBackupLogsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
        output: NiscBackupListResponse<LogEntry>;
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: LogEntry;
        meta: object;
    }>;
    listItems: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            log_id: string;
            page?: number | undefined;
            limit?: number | undefined;
        };
        output: NiscBackupListResponse<LogItem>;
        meta: object;
    }>;
    getItem: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: LogItem;
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
