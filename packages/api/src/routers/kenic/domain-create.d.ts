/**
 * KENIC EPP domain create (RFC 5731).
 * Contacts (registrant, admin, tech) must exist; create them via kenic.contactCreate.create first.
 */
export declare const kenicDomainCreateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            registrant: string;
            period?: number | undefined;
            ns?: {
                type: "hostObj";
                hosts: string[];
            } | {
                type: "hostAttr";
                hosts: {
                    name: string;
                    addrs?: string[] | undefined;
                }[];
            } | undefined;
            adminContacts?: string[] | undefined;
            techContacts?: string[] | undefined;
            authInfo?: string | undefined;
        };
        output: {
            success: boolean;
            domain: string;
            crDate: string | null;
            exDate: string | null;
            raw: string;
        };
        meta: object;
    }>;
}>>;
