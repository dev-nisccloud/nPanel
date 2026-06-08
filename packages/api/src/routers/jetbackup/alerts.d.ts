import { Alert, JetBackupListResponse } from "../../types/jetbackup";
export declare const jetbackupAlertsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
        output: JetBackupListResponse<Alert> | null;
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: Alert | null;
        meta: object;
    }>;
    clear: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id?: string | undefined;
        };
        output: any;
        meta: object;
    }>;
}>>;
