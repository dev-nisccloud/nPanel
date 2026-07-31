import { NiscBackupListResponse, QueueGroup, QueueItem, QueuePriority } from "../../types/nisc-backup";
export declare const niscBackupQueuesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /** Queue a full backup snapshot for restore (NiscBackup Queues API shape). */
    queueSnapshot: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            snapshot_id: string;
        };
        output: unknown;
        meta: object;
    }>;
    addItems: import("@trpc/server").TRPCMutationProcedure<{
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
    addMultiAccountItems: import("@trpc/server").TRPCMutationProcedure<{
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
    listGroups: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            search?: string | undefined;
            orderby?: string | undefined;
            order?: "asc" | "desc" | undefined;
            type?: number | undefined;
        };
        output: {
            groups: QueueGroup[];
            total: number;
            warning: string | undefined;
        };
        meta: object;
    }>;
    getGroup: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: QueueGroup;
        meta: object;
    }>;
    listItems: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            search?: string | undefined;
            orderby?: string | undefined;
            order?: "asc" | "desc" | undefined;
        };
        output: NiscBackupListResponse<QueueItem>;
        meta: object;
    }>;
    getItem: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: QueueItem;
        meta: object;
    }>;
    stopGroup: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
    stopAll: import("@trpc/server").TRPCMutationProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    clear: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            type?: number | undefined;
        };
        output: unknown;
        meta: object;
    }>;
    rerunFailed: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
    listPriorities: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            search?: string | undefined;
            orderby?: string | undefined;
            order?: "asc" | "desc" | undefined;
        };
        output: NiscBackupListResponse<QueuePriority>;
        meta: object;
    }>;
    getPriority: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: QueuePriority;
        meta: object;
    }>;
    managePriority: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            action: "create" | "modify";
            _id?: string | undefined;
            name?: string | undefined;
            priority?: number | undefined;
            type?: number | undefined;
        };
        output: unknown;
        meta: object;
    }>;
    deletePriority: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
}>>;
