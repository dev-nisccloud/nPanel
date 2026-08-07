/**
 * KENIC Domain List router.
 */
export declare const kenicDomainListRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List all KENIC domains registered through this agency.
     * One row per unique primaryDomain (latest non-superseded subscription).
     */
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: Record<string, never> | undefined;
        output: {
            success: boolean;
            data: {
                id: string;
                domain: string;
                status: any;
                registrationDate: string;
                expiryDate: string;
                clientName: string;
                clientEmail: string;
                tld: string;
                autoRenewal: boolean;
                nameservers: string[];
                source: "kenic";
                teamId: string | null;
                userId: string | null;
                teamName: string | null;
            }[];
        };
        meta: object;
    }>;
    /**
     * Get live info for a KENIC domain from the registry via EPP.
     */
    info: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            domain: string;
        };
        output: {
            success: boolean;
            data: {
                domain: any;
                roid: any;
                status: import("../../lib/epp/kenic-domain-status").KenicPortfolioStatus;
                isTransferLocked: boolean;
                isServerTransferLocked: boolean;
                allStatuses: {
                    status: any;
                    label: any;
                }[];
                registrant: any;
                registrantInfo: {
                    handle: any;
                    roid: any;
                    name: any;
                    organization: any;
                    address: {
                        street: any;
                        city: any;
                        state: any;
                        postcode: any;
                        country: any;
                    };
                    voice: any;
                    fax: any;
                    email: any;
                    clID: any;
                    crID: any;
                    crDate: any;
                    upDate: any;
                    status: any;
                } | null;
                contacts: {
                    type: any;
                    handle: any;
                }[];
                nameservers: any[];
                clID: any;
                crID: any;
                crDate: any;
                exDate: string | undefined;
                upID: any;
                upDate: any;
                trDate: any;
                rgpStatuses: any[];
                authInfoSet: boolean;
                raw: string;
                parsed: any;
            };
        };
        meta: object;
    }>;
    /**
     * Update KENIC domain nameservers.
     */
    updateNameservers: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domain: string;
            nameservers: string[];
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    /**
     * Set or remove KENIC domain transfer lock (clientTransferProhibited).
     */
    setTransferLock: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domain: string;
            locked: boolean;
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    /**
     * Read the stored plaintext KENIC auth code (never from domain:info  CoCCA returns a hash).
     */
    getAuthCode: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            domain: string;
        };
        output: {
            success: boolean;
            data: {
                auth_code: string | null;
                needsRegenerate: true;
                message: string;
            };
        } | {
            success: boolean;
            data: {
                auth_code: string;
                needsRegenerate: false;
                message: string | null;
            };
        };
        meta: object;
    }>;
    /**
     * Generate a new plaintext auth code, push to KENIC, and store locally.
     */
    regenerateAuthCode: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domain: string;
        };
        output: {
            success: boolean;
            data: {
                auth_code: string;
            };
            message: string;
        };
        meta: object;
    }>;
    /**
     * Update KENIC domain authorization (EPP) code and persist plaintext locally.
     */
    updateAuthCode: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domain: string;
            authCode: string;
        };
        output: {
            success: boolean;
            message: string;
            data: {
                auth_code: string;
            };
        };
        meta: object;
    }>;
}>>;
