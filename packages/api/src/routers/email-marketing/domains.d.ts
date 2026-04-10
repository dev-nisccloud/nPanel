export declare const emailMarketingDomainsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Create a new email domain
     * Adds domain to Resend and stores in our database
     */
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domainName: string;
            teamId?: string | null | undefined;
        };
        output: {
            id: string;
            domainName: string;
            status: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
            resendDomainId: string | null;
            userId: string;
            teamId: string | null;
            createdAt: Date;
            updatedAt: Date;
            verifiedAt: Date | null;
            verificationStatus: string | null;
            verificationData: unknown;
            dnsRecords: unknown;
        };
        meta: object;
    }>;
    /**
     * Get domain by ID
     */
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            domainName: string;
            status: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
            resendDomainId: string | null;
            userId: string;
            teamId: string | null;
            createdAt: Date;
            updatedAt: Date;
            verifiedAt: Date | null;
            verificationStatus: string | null;
            verificationData: unknown;
            dnsRecords: unknown;
        };
        meta: object;
    }>;
    /**
     * List email domains with filters
     */
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId?: string | null | undefined;
            status?: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED" | undefined;
            search?: string | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            domains: {
                id: string;
                domainName: string;
                status: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
                resendDomainId: string | null;
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
            }[];
            total: number;
        };
        meta: object;
    }>;
    /**
     * Update email domain
     */
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            domainName?: string | undefined;
            verificationStatus?: string | null | undefined;
            verificationData?: unknown;
            dnsRecords?: unknown;
            status?: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED" | undefined;
        };
        output: {
            id: string;
            domainName: string;
            status: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
            resendDomainId: string | null;
            userId: string;
            teamId: string | null;
            createdAt: Date;
            updatedAt: Date;
            verifiedAt: Date | null;
            verificationStatus: string | null;
            verificationData: unknown;
            dnsRecords: unknown;
        };
        meta: object;
    }>;
    /**
     * Delete email domain
     */
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    /**
     * Verify domain with Resend
     */
    verify: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            domainName: string;
            status: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
            resendDomainId: string | null;
            userId: string;
            teamId: string | null;
            createdAt: Date;
            updatedAt: Date;
            verifiedAt: Date | null;
            verificationStatus: string | null;
            verificationData: unknown;
            dnsRecords: unknown;
        };
        meta: object;
    }>;
}>>;
