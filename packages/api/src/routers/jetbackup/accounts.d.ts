import { JetBackupAccount, JetBackupListResponse } from "../../types/jetbackup";
export declare const jetbackupAccountsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
        output: JetBackupListResponse<JetBackupAccount> | null;
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: JetBackupAccount | null;
        meta: object;
    }>;
    manage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            action: "create" | "modify";
            _id?: string | undefined;
            username?: string | undefined;
            backup_job?: string | undefined;
            excluded?: number | undefined;
            tags?: string[] | undefined;
        };
        output: any;
        meta: object;
    }>;
    createOnDemand: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            username: string;
            type: number;
            destination_id?: string | undefined;
            notify?: number | undefined;
        };
        output: any;
        meta: object;
    }>;
    deleteSnapshots: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            username: string;
            destination_id: string;
            type?: number | undefined;
        };
        output: any;
        meta: object;
    }>;
}>>;
