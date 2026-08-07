/**
 * Nisc Payment Gateway - Credentials Management
 *
 * Manage encrypted payment provider credentials
 */
export declare const credentialsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Add encrypted credentials for merchant
     */
    add: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            merchantId: string;
            provider: "MPESA" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE";
            environment: "SANDBOX" | "PRODUCTION";
            credentials: any;
        };
        output: {
            success: boolean;
            credentials: {
                id: string;
                provider: string;
                environment: string;
                isActive: boolean;
            };
        };
        meta: object;
    }>;
    /**
     * List credentials for merchant (encrypted fields hidden)
     */
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            merchantId: string;
            provider?: "MPESA" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE" | undefined;
        };
        output: {
            credentials: {
                id: string;
                provider: string;
                environment: string;
                isActive: boolean;
                lastVerifiedAt: Date | null;
                verificationStatus: string | null;
                createdAt: Date;
            }[];
        };
        meta: object;
    }>;
    /**
     * Get decrypted credentials (SECURITY SENSITIVE - use sparingly)
     */
    getDecrypted: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            credentials: import("../../lib/nisc-payment-gateway-encryption").ProviderCredentials;
            provider: string;
            environment: string;
        };
        meta: object;
    }>;
    /**
     * Update credentials
     */
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            credentials: any;
            environment?: "SANDBOX" | "PRODUCTION" | undefined;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    /**
     * Deactivate credentials
     */
    deactivate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    /**
     * Test credentials before saving
     * Validates that the provided credentials can authenticate with the payment provider
     */
    test: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            provider: "MPESA" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE";
            environment: "SANDBOX" | "PRODUCTION";
            credentials: any;
        };
        output: {
            success: boolean;
            message: any;
        };
        meta: object;
    }>;
}>>;
