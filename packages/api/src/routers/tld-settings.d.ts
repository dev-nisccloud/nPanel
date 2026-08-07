export declare const tldSettingsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            nameserverGroupId?: string | undefined;
            marginType?: "PERCENTAGE" | "FIXED" | undefined;
            percentageMargin?: string | undefined;
            fixedMargin?: string | undefined;
            roundOff?: string | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                userId: string;
                nameserverGroupId: string | null;
                marginType: string | null;
                percentageMargin: string | null;
                fixedMargin: string | null;
                roundOff: string | null;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameserverGroup: {
                    id: string;
                    name: string;
                    description: string | null;
                    isDefault: boolean;
                    nameservers: {
                        id: string;
                        name: string;
                        ipv4: string | null;
                        ipv6: string | null;
                    }[];
                } | null;
                _count: {
                    activityLogs: number;
                };
            };
        };
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                userId: string;
                nameserverGroupId: string | null;
                marginType: string | null;
                percentageMargin: string | null;
                fixedMargin: string | null;
                roundOff: string | null;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameserverGroup: {
                    id: string;
                    name: string;
                    description: string | null;
                    isDefault: boolean;
                    nameservers: {
                        id: string;
                        name: string;
                        ipv4: string | null;
                        ipv6: string | null;
                    }[];
                } | null;
                _count: {
                    activityLogs: number;
                };
            };
        };
        meta: object;
    }>;
    getDefault: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                userId: string;
                nameserverGroupId: string | null;
                marginType: string | null;
                percentageMargin: string | null;
                fixedMargin: string | null;
                roundOff: string | null;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameserverGroup: {
                    id: string;
                    name: string;
                    description: string | null;
                    isDefault: boolean;
                    nameservers: {
                        id: string;
                        name: string;
                        ipv4: string | null;
                        ipv6: string | null;
                    }[];
                } | null;
                _count: {
                    activityLogs: number;
                };
            } | null;
        };
        meta: object;
    }>;
    /**
     * Resolve margin for a TLD extension: custom override if present, else platform default.
     * Also returns both rows so the UI can show "using default" vs "custom".
     */
    getForExtension: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            extension: string;
        };
        output: {
            success: boolean;
            data: {
                extension: string;
                isOverride: boolean;
                resolved: {
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                    roundOff: string | null;
                    id?: string | undefined;
                    name?: string | undefined;
                    isDefault?: boolean | undefined;
                } | null;
                override: {
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                    roundOff: string | null;
                    id?: string | undefined;
                    name?: string | undefined;
                    isDefault?: boolean | undefined;
                } | null;
                default: {
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                    roundOff: string | null;
                    id?: string | undefined;
                    name?: string | undefined;
                    isDefault?: boolean | undefined;
                } | null;
            };
        };
        meta: object;
    }>;
    /**
     * Compact map for client batch pricing: default + overrides keyed by normalized extension.
     */
    listMarginMap: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            data: {
                default: {
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                    roundOff: string | null;
                    id?: string | undefined;
                    name?: string | undefined;
                    isDefault?: boolean | undefined;
                } | null;
                overrides: Record<string, {
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                    roundOff: string | null;
                    id?: string | undefined;
                    name?: string | undefined;
                    isDefault?: boolean | undefined;
                }>;
            };
        };
        meta: object;
    }>;
    /**
     * Create or update a non-default per-extension margin override.
     */
    upsertExtensionMargin: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            extension: string;
            marginType: "PERCENTAGE" | "FIXED";
            percentageMargin?: string | undefined;
            fixedMargin?: string | undefined;
            roundOff?: string | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                userId: string;
                nameserverGroupId: string | null;
                marginType: string | null;
                percentageMargin: string | null;
                fixedMargin: string | null;
                roundOff: string | null;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameserverGroup: {
                    id: string;
                    name: string;
                    description: string | null;
                    isDefault: boolean;
                    nameservers: {
                        id: string;
                        name: string;
                        ipv4: string | null;
                        ipv6: string | null;
                    }[];
                } | null;
                _count: {
                    activityLogs: number;
                };
            };
        };
        meta: object;
    }>;
    /**
     * Delete a per-extension override so pricing falls back to the platform default.
     */
    clearExtensionMargin: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            extension: string;
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            limit?: number | undefined;
            offset?: number | undefined;
            search?: string | undefined;
            marginType?: "PERCENTAGE" | "FIXED" | undefined;
            nameserverGroupId?: string | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                userId: string;
                nameserverGroupId: string | null;
                marginType: string | null;
                percentageMargin: string | null;
                fixedMargin: string | null;
                roundOff: string | null;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameserverGroup: {
                    id: string;
                    name: string;
                    description: string | null;
                    isDefault: boolean;
                    nameservers: {
                        id: string;
                        name: string;
                        ipv4: string | null;
                        ipv6: string | null;
                    }[];
                } | null;
                _count: {
                    activityLogs: number;
                };
            }[];
            pagination: {
                total: number;
                limit: number;
                offset: number;
                hasMore: boolean;
            };
        };
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            name?: string | undefined;
            nameserverGroupId?: string | undefined;
            marginType?: "PERCENTAGE" | "FIXED" | undefined;
            percentageMargin?: string | undefined;
            fixedMargin?: string | undefined;
            roundOff?: string | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                userId: string;
                nameserverGroupId: string | null;
                marginType: string | null;
                percentageMargin: string | null;
                fixedMargin: string | null;
                roundOff: string | null;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameserverGroup: {
                    id: string;
                    name: string;
                    description: string | null;
                    isDefault: boolean;
                    nameservers: {
                        id: string;
                        name: string;
                        ipv4: string | null;
                        ipv6: string | null;
                    }[];
                } | null;
                _count: {
                    activityLogs: number;
                };
            };
        };
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    getActivityLogs: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                userId: string;
                tldSettingId: string;
                action: string;
                description: string | null;
                metadata: any;
                ipAddress: string | null;
                userAgent: string | null;
                createdAt: Date;
            }[];
            pagination: {
                total: number;
                limit: number;
                offset: number;
                hasMore: boolean;
            };
        };
        meta: object;
    }>;
    bulkDelete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            ids: string[];
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    setDefault: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                userId: string;
                nameserverGroupId: string | null;
                marginType: string | null;
                percentageMargin: string | null;
                fixedMargin: string | null;
                roundOff: string | null;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameserverGroup: {
                    id: string;
                    name: string;
                    description: string | null;
                    isDefault: boolean;
                    nameservers: {
                        id: string;
                        name: string;
                        ipv4: string | null;
                        ipv6: string | null;
                    }[];
                } | null;
                _count: {
                    activityLogs: number;
                };
            };
        };
        meta: object;
    }>;
}>>;
