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
                status: string;
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
                exDate: any;
                upID: any;
                upDate: any;
                trDate: any;
                rgpStatuses: any[];
                authInfo: any;
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
}>>;
