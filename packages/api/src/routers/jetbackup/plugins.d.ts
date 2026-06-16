import { JetBackupListResponse, Plugin, PluginPackage } from "../../types/jetbackup";
export declare const jetbackupPluginsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
        output: JetBackupListResponse<Plugin>;
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
        output: JetBackupListResponse<PluginPackage>;
        meta: object;
    }>;
    listRepositories: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    manageRepository: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            action: "create" | "modify";
            url: string;
            _id?: string | undefined;
        };
        output: unknown;
        meta: object;
    }>;
    deleteRepository: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            _id: string;
        };
        output: Plugin;
        meta: object;
    }>;
    manage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
            enabled?: number | undefined;
        };
        output: unknown;
        meta: object;
    }>;
    install: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            package_id?: string | undefined;
            zip_path?: string | undefined;
        };
        output: unknown;
        meta: object;
    }>;
    uninstall: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            _id: string;
        };
        output: unknown;
        meta: object;
    }>;
    listFiles: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    manageSecurity: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            enabled?: number | undefined;
        };
        output: unknown;
        meta: object;
    }>;
}>>;
