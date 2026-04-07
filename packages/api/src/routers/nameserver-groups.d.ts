export declare const nameserverGroupsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            nameservers: {
                name: string;
                ipv4?: string | undefined;
                ipv6?: string | undefined;
            }[];
            description?: string | undefined;
            isDefault?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                description: string | null;
                userId: string;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameservers: {
                    id: string;
                    name: string;
                    ipv4: string | null;
                    ipv6: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                _count: {
                    tldSettings: number;
                    domainRegistrations: number;
                    domainTransfers: number;
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
                description: string | null;
                userId: string;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameservers: {
                    id: string;
                    name: string;
                    ipv4: string | null;
                    ipv6: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                _count: {
                    tldSettings: number;
                    domainRegistrations: number;
                    domainTransfers: number;
                };
                tldSettings: {
                    id: string;
                    name: string;
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                }[];
            };
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            limit?: number | undefined;
            offset?: number | undefined;
            search?: string | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                description: string | null;
                userId: string;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameservers: {
                    id: string;
                    name: string;
                    ipv4: string | null;
                    ipv6: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                _count: {
                    tldSettings: number;
                    domainRegistrations: number;
                    domainTransfers: number;
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
            description?: string | undefined;
            isDefault?: boolean | undefined;
            nameservers?: {
                name: string;
                id?: string | undefined;
                ipv4?: string | undefined;
                ipv6?: string | undefined;
            }[] | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                description: string | null;
                userId: string;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameservers: {
                    id: string;
                    name: string;
                    ipv4: string | null;
                    ipv6: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                _count: {
                    tldSettings: number;
                    domainRegistrations: number;
                    domainTransfers: number;
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
    setDefault: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                description: string | null;
                userId: string;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameservers: {
                    id: string;
                    name: string;
                    ipv4: string | null;
                    ipv6: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                _count: {
                    tldSettings: number;
                    domainRegistrations: number;
                    domainTransfers: number;
                };
            };
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
                nameserverGroupId: string;
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
}>>;
