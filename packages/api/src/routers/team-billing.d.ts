export declare const teamBillingRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    listTeams: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            teams: {
                id: string;
                name: string;
                slug: string;
                hasBillingSettings: boolean;
                isBillingComplete: boolean;
                billingSettings: {
                    legalName: string;
                    billingEmail: string;
                    addressLine1: string;
                    city: string;
                    country: string;
                    id: string;
                    teamId: string;
                    updatedBy: string;
                    createdAt: Date;
                    updatedAt: Date;
                    billingPhone?: string | null | undefined;
                    addressLine2?: string | null | undefined;
                    state?: string | null | undefined;
                    postalCode?: string | null | undefined;
                    taxId?: string | null | undefined;
                    additionalNotes?: string | null | undefined;
                } | null;
            }[];
        };
        meta: object;
    }>;
    getByTeam: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId: string;
        };
        output: {
            legalName: string;
            billingEmail: string;
            addressLine1: string;
            city: string;
            country: string;
            id: string;
            teamId: string;
            updatedBy: string;
            createdAt: Date;
            updatedAt: Date;
            billingPhone?: string | null | undefined;
            addressLine2?: string | null | undefined;
            state?: string | null | undefined;
            postalCode?: string | null | undefined;
            taxId?: string | null | undefined;
            additionalNotes?: string | null | undefined;
        } | null;
        meta: object;
    }>;
    upsert: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            legalName: string;
            billingEmail: string;
            addressLine1: string;
            city: string;
            country: string;
            teamId: string;
            billingPhone?: string | null | undefined;
            addressLine2?: string | null | undefined;
            state?: string | null | undefined;
            postalCode?: string | null | undefined;
            taxId?: string | null | undefined;
            additionalNotes?: string | null | undefined;
        };
        output: {
            legalName: string;
            billingEmail: string;
            addressLine1: string;
            city: string;
            country: string;
            id: string;
            teamId: string;
            updatedBy: string;
            createdAt: Date;
            updatedAt: Date;
            billingPhone?: string | null | undefined;
            addressLine2?: string | null | undefined;
            state?: string | null | undefined;
            postalCode?: string | null | undefined;
            taxId?: string | null | undefined;
            additionalNotes?: string | null | undefined;
        };
        meta: object;
    }>;
    getActivityLog: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId: string;
        };
        output: {
            id: string;
            teamBillingSettingsId: string;
            userId: string;
            action: string;
            description: string | null;
            metadata: any;
            ipAddress: string | null;
            userAgent: string | null;
            createdAt: Date;
        }[];
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            teamId: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
}>>;
