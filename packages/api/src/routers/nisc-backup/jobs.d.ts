import { BackupJob, CloneJob, NiscBackupListResponse } from "../../types/nisc-backup";
export declare const niscBackupJobsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
        output: NiscBackupListResponse<BackupJob>;
        meta: object;
    }>;
    getBackup: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: BackupJob;
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
            notify?: number | undefined;
            compress?: number | undefined;
            encrypt?: number | undefined;
        };
        output: unknown;
        meta: object;
    }>;
    duplicateBackup: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
    runBackupManually: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
    deleteBackup: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
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
        output: NiscBackupListResponse<CloneJob>;
        meta: object;
    }>;
    getClone: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: CloneJob;
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
        output: unknown;
        meta: object;
    }>;
    duplicateClone: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
    runCloneManually: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
    deleteClone: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
}>>;
