export declare const digitaxPurchasesRouter: import("@trpc/server").TRPCBuiltRouter<{
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
            meta: {
                last_updated: string;
            };
            data: import("../../lib/digitax-client").DigiTaxPurchase[];
        };
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            purchaseId: string;
        };
        output: import("../../lib/digitax-client").DigiTaxPurchase;
        meta: object;
    }>;
    linkItems: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            purchaseId: string;
            items: {
                purchase_item_id: string;
                item_id: string;
            }[];
        };
        output: import("../../lib/digitax-client").DigiTaxPurchase;
        meta: object;
    }>;
}>>;
