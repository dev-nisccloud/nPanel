export declare const wpFeaturesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getIntegrityInfo: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    updateDebugStatus: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            status: boolean;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getDebugSettings: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    updateDebugSettings: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            wpDebug?: boolean | undefined;
            wpDebugLog?: boolean | undefined;
            wpDebugDisplay?: boolean | undefined;
            scriptDebug?: boolean | undefined;
            saveQueries?: boolean | undefined;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    updateHotlinkProtectionStatus: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            status: boolean;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getHotlinkProtectionSettings: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    toggleIndexing: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            status: boolean;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getMaintenanceSettings: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    updateMaintenanceSettings: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            fullMode?: boolean | undefined;
            texts?: {
                title?: string | undefined;
                header?: string | undefined;
                subheader?: string | undefined;
            } | undefined;
            timer?: {
                enabled: boolean;
                days?: number | undefined;
                hours?: number | undefined;
                minutes?: number | undefined;
            } | undefined;
            socialNetworks?: Record<string, string> | undefined;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    toggleMaintenanceMode: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            status: boolean;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    toggleNginxCaching: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            status: boolean;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getPasswordProtection: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    updatePasswordProtection: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            status: boolean;
            credentials?: {
                username: string;
                password: string;
            } | undefined;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    toggleSmartUpdate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            status: boolean;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    applySmartUpdate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    discardSmartUpdate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getSecurityMeasures: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getSecurityStatus: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationsIds: number[];
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    resolveSecurityMeasure: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationsIds: number[];
            securityMeasures: string[];
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    revertSecurityMeasure: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationsIds: number[];
            securityMeasures: string[];
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    createBackup: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            description?: string | undefined;
            backupSettings?: boolean | undefined;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    restoreBackup: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            fileName: string;
            clobber?: boolean | undefined;
            dropAllDatabaseTables?: boolean | undefined;
            restoreSettings?: boolean | undefined;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getBackups: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    deleteBackup: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            fileName: string;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
}>>;
