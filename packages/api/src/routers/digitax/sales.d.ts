export declare const digitaxSalesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            start_date?: string | undefined;
            end_date?: string | undefined;
            before?: string | undefined;
            after?: string | undefined;
            page_size?: number | undefined;
        };
        output: {
            pagination: import("../../lib/digitax-client").DigiTaxPagination;
            data: import("../../lib/digitax-client").DigiTaxSale[];
        };
        meta: object;
    }>;
    add: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sale_date: string;
            trader_invoice_number: string;
            receipt_type_code: string;
            payment_type_code: string;
            invoice_status_code: string;
            items: {
                id: string;
                quantity: number;
                unit_price: number;
                total_amount: number;
                package_unit_quantity?: number | undefined;
                discount_rate?: number | undefined;
                discount_amount?: number | undefined;
                item_description?: string | undefined;
            }[];
            customer_tin?: string | undefined;
            customer_name?: string | undefined;
            customer_id?: string | undefined;
            callback_url?: string | undefined;
            invoice_auth?: {
                type: string;
                issuer: string;
            } | undefined;
            invoice_details?: string | undefined;
            is_tax_exempt?: boolean | undefined;
            service_charge_rate?: number | undefined;
        };
        output: import("../../lib/digitax-client").DigiTaxSale;
        meta: object;
    }>;
    addWithItems: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sale_date: string;
            trader_invoice_number: string;
            receipt_type_code: string;
            payment_type_code: string;
            invoice_status_code: string;
            items: {
                id: string;
                quantity: number;
                unit_price: number;
                total_amount: number;
                item_name: string;
                item_class_code: string;
                item_bar_code: string;
                item_tax_type_code: string;
                package_unit_quantity?: number | undefined;
                discount_rate?: number | undefined;
                discount_amount?: number | undefined;
                item_description?: string | undefined;
                taxable_amount?: number | undefined;
                tax_amount?: number | undefined;
                is_stockable?: boolean | undefined;
            }[];
            customer_tin?: string | undefined;
            customer_name?: string | undefined;
            customer_id?: string | undefined;
            callback_url?: string | undefined;
            invoice_auth?: {
                type: string;
                issuer: string;
            } | undefined;
            invoice_details?: string | undefined;
            is_tax_exempt?: boolean | undefined;
            service_charge_rate?: number | undefined;
        };
        output: import("../../lib/digitax-client").DigiTaxSale;
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            saleId: string;
        };
        output: import("../../lib/digitax-client").DigiTaxSale;
        meta: object;
    }>;
    getOfflineUrl: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            businessId: string;
            traderInvoiceNumber: string;
        };
        output: any;
        meta: object;
    }>;
    addExpressCreditNote: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            trader_invoice_number: string;
            return_date: string;
            sale_id: string;
            callback_url?: string | undefined;
            invoice_details?: string | undefined;
        };
        output: import("../../lib/digitax-client").DigiTaxSale;
        meta: object;
    }>;
}>>;
