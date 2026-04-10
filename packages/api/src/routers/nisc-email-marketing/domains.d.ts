export declare const niscEmailMarketingDomainsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Agency-only helper: list all VERIFIED domains in DB (no team filter).
     * Used by agency-side campaign creation dropdown.
     */
    listAllVerified: import("@trpc/server").TRPCQueryProcedure<{
        input: Record<string, never> | undefined;
        output: {
            domains: {
                id: string;
                domainName: string;
            }[];
        };
        meta: object;
    }>;
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
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            ok: boolean;
        };
        meta: object;
    }>;
    listLegacy: import("@trpc/server").TRPCQueryProcedure<{
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
    add: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domainName: string;
            teamId?: string | null | undefined;
        };
        output: {
            id: string;
            domainName: string;
            status: "PENDING" | "VERIFIED" | "FAILED" | "DELETING";
            dkimStatus: "NotStarted" | "Pending" | "Success" | "Failed" | "TemporaryFailure";
            mailFromMode: "DEFAULT" | "CUSTOM";
            userId: string;
            teamId: string | null;
            createdAt: Date;
            updatedAt: Date;
            verifiedAt: Date | null;
            dkimTokens: string[];
            feedbackForwardingDisabled: boolean;
            mailFromStatus?: string | null | undefined;
            dnsRecords?: unknown;
            mailFromDomain?: string | null | undefined;
        };
        meta: object;
    }>;
    verifyCheck: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            domainName: string;
            status: "PENDING" | "VERIFIED" | "FAILED" | "DELETING";
            dkimStatus: "NotStarted" | "Pending" | "Success" | "Failed" | "TemporaryFailure";
            mailFromMode: "DEFAULT" | "CUSTOM";
            userId: string;
            teamId: string | null;
            createdAt: Date;
            updatedAt: Date;
            verifiedAt: Date | null;
            dkimTokens: string[];
            feedbackForwardingDisabled: boolean;
            mailFromStatus?: string | null | undefined;
            dnsRecords?: unknown;
            mailFromDomain?: string | null | undefined;
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId?: string | null | undefined;
            status?: "PENDING" | "VERIFIED" | "FAILED" | "DELETING" | undefined;
            search?: string | null | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            domains: {
                id: string;
                domainName: string;
                status: "PENDING" | "VERIFIED" | "FAILED" | "DELETING";
                dkimStatus: "NotStarted" | "Pending" | "Success" | "Failed" | "TemporaryFailure";
                mailFromMode: "DEFAULT" | "CUSTOM";
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
                mailFromStatus?: string | null | undefined;
            }[];
            total: number;
        };
        meta: object;
    }>;
    remove: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
}>>;
