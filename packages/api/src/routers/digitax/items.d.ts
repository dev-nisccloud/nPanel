export declare const digitaxItemsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
            data: import("../../lib/digitax-client").DigiTaxItem[];
        };
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            item_class_code: string;
            item_type_code: string;
            item_name: string;
            origin_nation_code: string;
            package_unit_code: string;
            quantity_unit_code: string;
            tax_type_code: string;
            default_unit_price: number;
            stock_quantity?: number | undefined;
            callback_url?: string | undefined;
            item_bar_code?: string | undefined;
            levies?: string[] | undefined;
        };
        output: import("../../lib/digitax-client").DigiTaxItem;
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            itemId: string;
            data: {
                item_class_code?: string | undefined;
                item_type_code?: string | undefined;
                item_name?: string | undefined;
                origin_nation_code?: string | undefined;
                package_unit_code?: string | undefined;
                quantity_unit_code?: string | undefined;
                tax_type_code?: string | undefined;
                default_unit_price?: number | undefined;
                stock_quantity?: number | undefined;
                callback_url?: string | undefined;
                item_bar_code?: string | undefined;
                levies?: string[] | undefined;
            };
        };
        output: import("../../lib/digitax-client").DigiTaxItem;
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            itemId: string;
        };
        output: {
            message: string;
        };
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            itemId: string;
        };
        output: import("../../lib/digitax-client").DigiTaxItem;
        meta: object;
    }>;
}>>;
