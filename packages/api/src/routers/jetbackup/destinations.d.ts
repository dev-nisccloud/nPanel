import { Destination, JetBackupListResponse } from "../../types/jetbackup";
export declare const jetbackupDestinationsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
        output: JetBackupListResponse<Destination> | null;
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: Destination | null;
        meta: object;
    }>;
    manage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            action: "create" | "modify";
            _id?: string | undefined;
            name?: string | undefined;
            type?: string | undefined;
            threads?: number | undefined;
            disk_limit?: number | undefined;
            options?: Record<any, unknown> | undefined;
            dr?: number | undefined;
            readonly?: number | undefined;
        };
        output: any;
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: any;
        meta: object;
    }>;
    validate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: any;
        meta: object;
    }>;
    reindex: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: any;
        meta: object;
    }>;
    runIntegrityCheck: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: any;
        meta: object;
    }>;
}>>;
