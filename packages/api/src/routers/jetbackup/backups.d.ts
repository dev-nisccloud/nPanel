import { BackupSnapshot, BackupItem, JetBackupListResponse } from "../../types/jetbackup";
export declare const jetbackupBackupsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
            destination_id?: string | undefined;
        };
        output: JetBackupListResponse<BackupSnapshot> | null;
        meta: object;
    }>;
    listForAccount: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            type: number;
            username?: string | undefined;
            contains?: number | undefined;
            destination_id?: string | undefined;
        };
        output: JetBackupListResponse<BackupSnapshot> | null;
        meta: object;
    }>;
    getItems: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            parent_id: string;
            type: number;
        };
        output: JetBackupListResponse<BackupItem> | null;
        meta: object;
    }>;
    addQueueItems: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            items: {
                parent_id: string;
                type: number;
                item_id?: string | undefined;
                username?: string | undefined;
            }[];
        };
        output: any;
        meta: object;
    }>;
    manageLock: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
            lock: number;
        };
        output: any;
        meta: object;
    }>;
}>>;
