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
        output: JetBackupListResponse<Destination>;
        meta: object;
    }>;
    listTypes: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: Destination;
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
            options?: Record<string, unknown> | undefined;
            dr?: number | undefined;
            readonly?: number | undefined;
        };
        output: unknown;
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
    validate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
    reindex: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
    runIntegrityCheck: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
}>>;
