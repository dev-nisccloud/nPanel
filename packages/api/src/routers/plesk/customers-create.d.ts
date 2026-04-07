export declare const customersCreateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            personName: string;
            email: string;
            login?: string | undefined;
            password?: string | undefined;
            phone?: string | undefined;
            fax?: string | undefined;
            company?: string | undefined;
            address?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            postCode?: string | undefined;
            country?: string | undefined;
            locale?: string | undefined;
            guid?: string | undefined;
            ownerId?: number | undefined;
            externalId?: string | undefined;
            description?: string | undefined;
        };
        output: {
            raw: string;
            parsed: any;
        };
        meta: object;
    }>;
}>>;
