/**
 * Nisc Payment Gateway - Merchants Management
 *
 * CRUD operations for merchant accounts
 */
export declare const merchantsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Create a new merchant account
     */
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            merchantName: string;
            merchantEmail: string;
            merchantPhone?: string | undefined;
            merchantWebsite?: string | undefined;
            businessType?: "BUSINESS" | "INDIVIDUAL" | "NGO" | undefined;
            businessName?: string | undefined;
            businessRegistration?: string | undefined;
            teamId?: string | undefined;
            settings?: {
                webhookUrl?: string | undefined;
                webhookSecret?: string | undefined;
                allowedOrigins?: string[] | undefined;
                notificationEmails?: string[] | undefined;
                ipWhitelist?: string[] | undefined;
            } | undefined;
            notes?: string | undefined;
        };
        output: {
            success: boolean;
            merchant: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                createdById: string;
                teamId: string | null;
                notes: string | null;
                metadata: unknown;
                closedAt: Date | null;
                settings: {
                    webhookUrl?: string;
                    webhookSecret?: string;
                    allowedOrigins?: string[];
                    notificationEmails?: string[];
                    ipWhitelist?: string[];
                };
                businessName: string | null;
                merchantName: string;
                merchantEmail: string;
                merchantPhone: string | null;
                merchantWebsite: string | null;
                businessType: string;
                businessRegistration: string | null;
                suspendedAt: Date | null;
            } | undefined;
        };
        meta: object;
    }>;
    /**
     * List merchants (filtered by user/team based on role)
     */
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            status?: "ACTIVE" | "PENDING" | "SUSPENDED" | "CLOSED" | undefined;
            teamIds?: string[] | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            merchants: {
                id: string;
                userId: string;
                teamId: string | null;
                merchantName: string;
                merchantEmail: string;
                merchantPhone: string | null;
                merchantWebsite: string | null;
                businessType: string;
                businessName: string | null;
                businessRegistration: string | null;
                status: string;
                settings: {
                    webhookUrl?: string;
                    webhookSecret?: string;
                    allowedOrigins?: string[];
                    notificationEmails?: string[];
                    ipWhitelist?: string[];
                };
                metadata: unknown;
                notes: string | null;
                createdById: string;
                createdAt: Date;
                updatedAt: Date;
                suspendedAt: Date | null;
                closedAt: Date | null;
            }[];
            pagination: {
                limit: number;
                offset: number;
                hasMore: boolean;
            };
        };
        meta: object;
    }>;
    /**
     * Get merchant details by ID
     */
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            merchant: {
                id: string;
                userId: string;
                teamId: string | null;
                merchantName: string;
                merchantEmail: string;
                merchantPhone: string | null;
                merchantWebsite: string | null;
                businessType: string;
                businessName: string | null;
                businessRegistration: string | null;
                status: string;
                settings: {
                    webhookUrl?: string;
                    webhookSecret?: string;
                    allowedOrigins?: string[];
                    notificationEmails?: string[];
                    ipWhitelist?: string[];
                };
                metadata: unknown;
                notes: string | null;
                createdById: string;
                createdAt: Date;
                updatedAt: Date;
                suspendedAt: Date | null;
                closedAt: Date | null;
            };
        };
        meta: object;
    }>;
    /**
     * Update merchant details
     */
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            merchantName?: string | undefined;
            merchantEmail?: string | undefined;
            merchantPhone?: string | undefined;
            merchantWebsite?: string | undefined;
            businessType?: "BUSINESS" | "INDIVIDUAL" | "NGO" | undefined;
            businessName?: string | undefined;
            businessRegistration?: string | undefined;
            settings?: {
                webhookUrl?: string | undefined;
                webhookSecret?: string | undefined;
                allowedOrigins?: string[] | undefined;
                notificationEmails?: string[] | undefined;
                ipWhitelist?: string[] | undefined;
            } | undefined;
            notes?: string | undefined;
        };
        output: {
            success: boolean;
            merchant: {
                id: string;
                userId: string;
                teamId: string | null;
                merchantName: string;
                merchantEmail: string;
                merchantPhone: string | null;
                merchantWebsite: string | null;
                businessType: string;
                businessName: string | null;
                businessRegistration: string | null;
                status: string;
                settings: {
                    webhookUrl?: string;
                    webhookSecret?: string;
                    allowedOrigins?: string[];
                    notificationEmails?: string[];
                    ipWhitelist?: string[];
                };
                metadata: unknown;
                notes: string | null;
                createdById: string;
                createdAt: Date;
                updatedAt: Date;
                suspendedAt: Date | null;
                closedAt: Date | null;
            } | undefined;
        };
        meta: object;
    }>;
    /**
     * Update merchant status (activate, suspend, close)
     */
    updateStatus: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            status: "ACTIVE" | "SUSPENDED" | "CLOSED";
            reason?: string | undefined;
        };
        output: {
            success: boolean;
            merchant: {
                id: string;
                userId: string;
                teamId: string | null;
                merchantName: string;
                merchantEmail: string;
                merchantPhone: string | null;
                merchantWebsite: string | null;
                businessType: string;
                businessName: string | null;
                businessRegistration: string | null;
                status: string;
                settings: {
                    webhookUrl?: string;
                    webhookSecret?: string;
                    allowedOrigins?: string[];
                    notificationEmails?: string[];
                    ipWhitelist?: string[];
                };
                metadata: unknown;
                notes: string | null;
                createdById: string;
                createdAt: Date;
                updatedAt: Date;
                suspendedAt: Date | null;
                closedAt: Date | null;
            } | undefined;
        };
        meta: object;
    }>;
    /**
     * Get stats for all merchants based on user's access level
     */
    getStats: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamIds?: string[] | undefined;
        } | undefined;
        output: {
            totalApiKeys: number;
            activeApiKeys: number;
            totalTransactions: number;
            successfulTransactions: number;
        };
        meta: object;
    }>;
}>>;
