export declare const digitaxRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    branches: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getETimsInfo: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: import("../../lib/digitax-client").DigiTaxBranch;
            meta: object;
        }>;
        getBranches: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                data: import("../../lib/digitax-client").DigiTaxBranch[];
            };
            meta: object;
        }>;
    }>>;
    items: import("@trpc/server").TRPCBuiltRouter<{
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
    customers: import("@trpc/server").TRPCBuiltRouter<{
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
    purchases: import("@trpc/server").TRPCBuiltRouter<{
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
    sales: import("@trpc/server").TRPCBuiltRouter<{
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
        getSummary: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                start_date: string;
                end_date: string;
            };
            output: {
                summary: Record<string, {
                    total_sales_count: number;
                    total_sales_amount: number;
                }>;
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
    notices: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                meta: {
                    last_updated: string;
                };
                data: import("../../lib/digitax-client").DigiTaxNotice[];
            };
            meta: object;
        }>;
    }>>;
    verifications: import("@trpc/server").TRPCBuiltRouter<{
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
}>>;
