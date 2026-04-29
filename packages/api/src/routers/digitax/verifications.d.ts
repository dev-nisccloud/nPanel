export declare const digitaxVerificationsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
            data: import("../../lib/digitax-client").DigiTaxInvoiceVerification[];
        };
        meta: object;
    }>;
    verify: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            invoice_number: string;
            amount?: number | undefined;
            supplier_pin?: string | undefined;
            reference_number?: string | undefined;
        };
        output: import("../../lib/digitax-client").DigiTaxInvoiceVerification;
        meta: object;
    }>;
}>>;
