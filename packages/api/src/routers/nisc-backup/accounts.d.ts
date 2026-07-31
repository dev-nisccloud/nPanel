import { NiscBackupAccount, NiscBackupListResponse, Tag } from "../../types/nisc-backup";
export declare const niscBackupAccountsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
        output: NiscBackupListResponse<NiscBackupAccount>;
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: NiscBackupAccount;
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
        output: unknown;
        meta: object;
    }>;
    listTags: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            search?: string | undefined;
            orderby?: string | undefined;
            order?: "asc" | "desc" | undefined;
        };
        output: NiscBackupListResponse<Tag>;
        meta: object;
    }>;
    manageTag: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            action: "delete" | "create" | "modify";
            _id?: string | undefined;
            name?: string | undefined;
            color?: string | undefined;
        };
        output: unknown;
        meta: object;
    }>;
    listAssignable: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            username: string;
        };
        output: unknown;
        meta: object;
    }>;
    reassign: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            username: string;
            assignable_id: string;
        };
        output: unknown;
        meta: object;
    }>;
    reassignMulti: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            usernames: string[];
            assignable_id: string;
        };
        output: unknown;
        meta: object;
    }>;
    createOnDemand: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            account_id: string;
        };
        output: unknown;
        meta: object;
    }>;
    manageExcludeList: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            action: "add" | "remove";
            username: string;
            paths: string[];
        };
        output: unknown;
        meta: object;
    }>;
    getExcludeList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            username: string;
        };
        output: unknown;
        meta: object;
    }>;
    listPackages: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            search?: string | undefined;
            orderby?: string | undefined;
            order?: "asc" | "desc" | undefined;
        };
        output: unknown;
        meta: object;
    }>;
    deleteSnapshots: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            username: string;
            destination_id: string;
            type?: number | undefined;
        };
        output: unknown;
        meta: object;
    }>;
}>>;
