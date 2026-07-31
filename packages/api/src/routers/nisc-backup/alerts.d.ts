import { Alert, NiscBackupListResponse } from "../../types/nisc-backup";
export declare const niscBackupAlertsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
        output: NiscBackupListResponse<Alert>;
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: Alert;
        meta: object;
    }>;
    clear: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id?: string | undefined;
        };
        output: unknown;
        meta: object;
    }>;
}>>;
