import { Download, JetBackupListResponse } from "../../types/jetbackup";
export declare const jetbackupDownloadsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
        output: JetBackupListResponse<Download>;
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: Download;
        meta: object;
    }>;
    manageNotes: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
            notes: string;
        };
        output: unknown;
        meta: object;
    }>;
    /** Queue a full backup snapshot for download (JetBackup Downloads API shape). */
    queueSnapshot: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            snapshot_id: string;
        };
        output: unknown;
        meta: object;
    }>;
}>>;
