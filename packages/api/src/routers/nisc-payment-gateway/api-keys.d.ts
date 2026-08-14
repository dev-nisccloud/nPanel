/**
 * Nisc Payment Gateway - API Keys Management
 *
 * Create and manage API keys for external access
 */
export declare const apiKeysRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Create new API key for merchant
     */
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            merchantId: string;
            name: string;
            environment: "test" | "SANDBOX" | "PRODUCTION" | "live";
            permissions?: any[] | undefined;
            rateLimit?: number | undefined;
            allowedIps?: string[] | undefined;
            expiresAt?: Date | undefined;
        };
        output: {
            success: boolean;
            apiKey: {
                id: string;
                name: string;
                createdAt: Date;
                isActive: boolean;
                createdById: string;
                metadata: unknown;
                expiresAt: Date | null;
                permissions: string[];
                keyHash: string;
                lastUsedAt: Date | null;
                merchantId: string;
                environment: string;
                keyPrefix: string;
                rateLimit: number;
                allowedIps: string[] | null;
                revokedAt: Date | null;
                revokedById: string | null;
            } | undefined;
            key: string;
        };
        meta: object;
    }>;
    /**
     * List API keys for merchant
     */
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            merchantId: string;
            environment?: "test" | "SANDBOX" | "PRODUCTION" | "live" | undefined;
            isActive?: boolean | undefined;
        };
        output: {
            apiKeys: {
                id: string;
                name: string;
                keyPrefix: string;
                permissions: string[];
                environment: string;
                rateLimit: number;
                allowedIps: string[] | null;
                isActive: boolean;
                expiresAt: Date | null;
                lastUsedAt: Date | null;
                createdAt: Date;
            }[];
        };
        meta: object;
    }>;
    /**
     * Revoke API key
     */
    revoke: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
}>>;
