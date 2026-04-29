export declare const digitaxCustomersRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            before?: string | undefined;
            after?: string | undefined;
            page_size?: number | undefined;
        };
        output: {
            pagination: import("../../lib/digitax-client").DigiTaxPagination;
            data: import("../../lib/digitax-client").DigiTaxCustomer[];
        };
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            customer_name: string;
            customer_tin: string;
            email?: string | undefined;
            phone?: string | undefined;
        };
        output: import("../../lib/digitax-client").DigiTaxCustomer;
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
        };
        output: import("../../lib/digitax-client").DigiTaxCustomer;
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            customerId: string;
            data: {
                customer_name: string;
                email?: string | undefined;
                phone?: string | undefined;
            };
        };
        output: import("../../lib/digitax-client").DigiTaxCustomer;
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            customerId: string;
        };
        output: {
            message: string;
        };
        meta: object;
    }>;
}>>;
