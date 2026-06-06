import { QueueGroup, QueueItem, JetBackupListResponse } from "../../types/jetbackup";
export declare const jetbackupQueuesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    listGroups: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            search?: string | undefined;
            orderby?: string | undefined;
            order?: "asc" | "desc" | undefined;
        };
        output: JetBackupListResponse<QueueGroup> | null;
        meta: object;
    }>;
    getGroup: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: QueueGroup | null;
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
        output: JetBackupListResponse<QueueItem> | null;
        meta: object;
    }>;
    stopGroup: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: any;
        meta: object;
    }>;
    stopAll: import("@trpc/server").TRPCMutationProcedure<{
        input: void;
        output: any;
        meta: object;
    }>;
    clear: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            type?: number | undefined;
        };
        output: any;
        meta: object;
    }>;
    rerunFailed: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: any;
        meta: object;
    }>;
}>>;
