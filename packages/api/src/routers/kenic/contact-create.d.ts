/**
 * KENIC EPP contact create (RFC 3733).
 * Create a contact (registrant/admin/tech) to use in domain create.
 */
export declare const kenicContactCreateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            postalInfo: {
                name: string;
                street: string | string[];
                city: string;
                pc: string;
                cc: string;
                org?: string | undefined;
                sp?: string | undefined;
            } | [{
                name: string;
                street: string | string[];
                city: string;
                pc: string;
                cc: string;
                org?: string | undefined;
                sp?: string | undefined;
            }, {
                name: string;
                street: string | string[];
                city: string;
                pc: string;
                cc: string;
                org?: string | undefined;
                sp?: string | undefined;
            }];
            voice: string;
            email: string;
            fax?: string | undefined;
            authInfo?: string | undefined;
            disclose?: {
                flag: 0 | 1;
                elements?: ("name" | "email" | "org" | "voice" | "fax" | "addr")[] | undefined;
            } | undefined;
        };
        output: {
            success: boolean;
            contactId: string;
            crDate: string | null;
            raw: string;
        };
        meta: object;
    }>;
}>>;
