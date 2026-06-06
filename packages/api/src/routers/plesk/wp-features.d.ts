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
        output: import("../../lib/plesk/wp-meta-parser").ParsedIntegrityInfo;
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
        output: {
            data: {
                domains: string[];
                fileExtensions: string[];
                defaultDomains: string[];
                defaultFileExtensions: string[];
            };
            source: "meta";
        } | {
            data: {
                defaultDomains: never[];
                defaultFileExtensions: never[];
                domains: string[];
                fileExtensions: string[];
            };
            source: "settings";
        };
        meta: object;
    }>;
    updateHotlinkProtectionSettings: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            domains: string[];
            fileExtensions: string[];
        };
        output: {
            data: {
                domains: string[];
                fileExtensions: string[];
            };
        };
        meta: object;
    }>;
    resetHotlinkProtectionSettings: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
        };
        output: {
            data: {
                domains: string[];
                fileExtensions: string[];
            };
        };
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
    getMaintenanceTemplateUrl: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: {
            url: string | null;
        };
        meta: object;
    }>;
    restoreMaintenanceTemplate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getBackupsMeta: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
            showAllBackups?: boolean | undefined;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getSmartUpdateResult: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getSmartPhpUpdateStub: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getSmartPhpUpdateResult: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    acceptSmartPhpUpdate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    discardSmartPhpUpdate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    runSmartPhpUpdate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            newSubDomain?: {
                parentDomain: string;
                name?: string | undefined;
            } | undefined;
            php?: string | undefined;
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
            installationsIds?: number[] | undefined;
            installationIds?: number[] | undefined;
        };
        output: any;
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
        output: {
            taskUrl: string | null;
            task: import("../../lib/plesk/wp-meta-parser").WpTaskPayload | null;
            started: boolean;
        };
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
    getBackupsList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
            showAllBackups?: boolean | undefined;
        };
        output: {
            items: import("../../lib/plesk/wp-meta-parser").ParsedBackupItem[];
            fileManagerUrl: string | undefined;
            limit: number | undefined;
            dirName: string | undefined;
        };
        meta: object;
    }>;
    getUpdatesChecker: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    startUpdatesCheck: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getVulnerabilities: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    startVulnerabilityCheck: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    startSecurityCheck: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getSecurityPolicies: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    updateSecurityPolicies: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            core?: {
                updateVulnerable?: boolean | undefined;
                applyVirtualPatches?: boolean | undefined;
            } | undefined;
            plugins?: {
                updateVulnerable?: boolean | undefined;
                deactivateVulnerable?: boolean | undefined;
                applyVirtualPatches?: boolean | undefined;
            } | undefined;
            themes?: {
                updateVulnerable?: boolean | undefined;
                applyVirtualPatches?: boolean | undefined;
            } | undefined;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    updateVulnerabilityFiltering: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            status: boolean;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    applyVirtualPatches: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            status: boolean;
            dryRun?: boolean | undefined;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getWpCronTakeoverMeta: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: {
            data: {
                available: boolean;
                status: boolean;
                taskReplacementStatus: boolean;
                managementUri?: string;
            };
        } | {
            data: null;
        };
        meta: object;
    }>;
    updateWpCronTakeover: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            status?: boolean | undefined;
            taskReplacementStatus?: boolean | undefined;
        };
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    getLicenseInfo: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
    refreshLicenseInfo: import("@trpc/server").TRPCMutationProcedure<{
        input: void;
        output: import("../../lib/plesk/rest-client").PleskRestResult;
        meta: object;
    }>;
}>>;
