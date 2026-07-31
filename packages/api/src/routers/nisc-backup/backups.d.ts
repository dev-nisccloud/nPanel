import { BackupItem, BackupSnapshot, NiscBackupListResponse } from "../../types/nisc-backup";
export declare const niscBackupBackupsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
            contains?: number | undefined;
            account_id?: string | undefined;
            destination_id?: string | undefined;
        };
        output: NiscBackupListResponse<BackupSnapshot>;
        meta: object;
    }>;
    listForAccount: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            account_id: string;
            page?: number | undefined;
            limit?: number | undefined;
            search?: string | undefined;
            orderby?: string | undefined;
            order?: "asc" | "desc" | undefined;
            type?: number | undefined;
            contains?: number | undefined;
            destination_id?: string | undefined;
        };
        output: NiscBackupListResponse<BackupSnapshot>;
        meta: object;
    }>;
    listLatestForAccounts: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            account_id?: string | undefined;
            username?: string | undefined;
            type?: number | undefined;
            contains?: number | undefined;
            destination_id?: string | undefined;
        };
        output: unknown;
        meta: object;
    }>;
    listForType: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            type?: number | undefined;
            contains?: number | undefined;
        };
        output: NiscBackupListResponse<BackupSnapshot>;
        meta: object;
    }>;
    listForTypeName: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            account_id: string;
            name: string;
            page?: number | undefined;
            limit?: number | undefined;
            search?: string | undefined;
            orderby?: string | undefined;
            order?: "asc" | "desc" | undefined;
            type?: number | undefined;
            contains?: number | undefined;
        };
        output: NiscBackupListResponse<BackupSnapshot>;
        meta: object;
    }>;
    listAccountsByFilters: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            filter: Record<string, unknown>;
        };
        output: unknown;
        meta: object;
    }>;
    getItems: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            parent_id: string;
            type: number;
        };
        output: NiscBackupListResponse<BackupItem>;
        meta: object;
    }>;
    getItem: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
            parent_id: string;
        };
        output: BackupItem;
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
        output: unknown;
        meta: object;
    }>;
    manageLock: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
            lock: number;
        };
        output: unknown;
        meta: object;
    }>;
}>>;
