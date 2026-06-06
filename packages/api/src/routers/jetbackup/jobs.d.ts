import { BackupJob, CloneJob, JetBackupListResponse } from "../../types/jetbackup";
export declare const jetbackupJobsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    listBackup: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            search?: string | undefined;
            orderby?: string | undefined;
            order?: "asc" | "desc" | undefined;
        };
        output: JetBackupListResponse<BackupJob> | null;
        meta: object;
    }>;
    getBackup: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: BackupJob | null;
        meta: object;
    }>;
    manageBackup: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            action: "create" | "modify";
            _id?: string | undefined;
            name?: string | undefined;
            destination_id?: string | undefined;
            type?: number | undefined;
            enabled?: number | undefined;
            schedule_id?: string | undefined;
            account_filter_id?: string | undefined;
            retain?: number | undefined;
            ttl?: number | undefined;
        };
        output: any;
        meta: object;
    }>;
    runBackupManually: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: any;
        meta: object;
    }>;
    listClone: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            search?: string | undefined;
            orderby?: string | undefined;
            order?: "asc" | "desc" | undefined;
        };
        output: JetBackupListResponse<CloneJob> | null;
        meta: object;
    }>;
    getClone: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: CloneJob | null;
        meta: object;
    }>;
    manageClone: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            action: "create" | "modify";
            _id?: string | undefined;
            name?: string | undefined;
            destination_id?: string | undefined;
            type?: number | undefined;
            enabled?: number | undefined;
            schedule_id?: string | undefined;
            account_filter_id?: string | undefined;
        };
        output: any;
        meta: object;
    }>;
    runCloneManually: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: any;
        meta: object;
    }>;
}>>;
