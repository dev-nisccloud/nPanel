export declare const openProviderCustomersRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Create a new customer handle
     */
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: {
                first_name: string;
                last_name: string;
            };
            address: {
                street: string;
                number: string;
                zipcode: string;
                city: string;
                country: string;
                state?: string | undefined;
            };
            phone: {
                country_code: string;
                area_code: string;
                subscriber_number: string;
            };
            email: string;
            company_name?: string | undefined;
            tags?: string[] | undefined;
            additional_data?: Record<string, any> | undefined;
        };
        output: {
            success: boolean;
            data: {
                handle: string;
            };
            meta: {
                created_at: string;
                customer_email: string;
            };
        };
        meta: object;
    }>;
    /**
     * Search existing customer handles
     */
    search: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            handle_pattern?: string | undefined;
            email_pattern?: string | undefined;
            first_name_pattern?: string | undefined;
            last_name_pattern?: string | undefined;
            company_name_pattern?: string | undefined;
            comment_pattern?: string | undefined;
            with_additional_data?: boolean | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            success: boolean;
            data: {
                results: Array<{
                    handle: string;
                    company_name?: string;
                    email: string;
                    additional_data?: Record<string, any>;
                }>;
                total: number;
            };
            meta: {
                searched_at: string;
                total: number;
                limit: number;
                offset: number;
            };
        };
        meta: object;
    }>;
    /**
     * Update an existing customer handle
     */
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            handle: string;
            name?: {
                first_name?: string | undefined;
                last_name?: string | undefined;
            } | undefined;
            address?: {
                street?: string | undefined;
                number?: string | undefined;
                zipcode?: string | undefined;
                city?: string | undefined;
                country?: string | undefined;
                state?: string | undefined;
            } | undefined;
            phone?: {
                country_code?: string | undefined;
                area_code?: string | undefined;
                subscriber_number?: string | undefined;
            } | undefined;
            email?: string | undefined;
            company_name?: string | undefined;
            tags?: string[] | undefined;
            additional_data?: Record<string, any> | undefined;
        };
        output: {
            success: boolean;
            data: {
                handle: string;
            };
            meta: {
                updated_at: string;
                customer_handle: string;
            };
        };
        meta: object;
    }>;
    /**
     * Get customer by handle
     */
    getByHandle: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            handle: string;
        };
        output: {
            success: boolean;
            data: {
                handle: string;
                company_name?: string;
                email: string;
                additional_data?: Record<string, any>;
            };
            meta: {
                retrieved_at: string;
                customer_handle: string;
            };
        };
        meta: object;
    }>;
    /**
     * Search customers by email
     */
    searchByEmail: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            email: string;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            success: boolean;
            data: {
                results: Array<{
                    handle: string;
                    company_name?: string;
                    email: string;
                    additional_data?: Record<string, any>;
                }>;
                total: number;
            };
            meta: {
                searched_at: string;
                search_email: string;
                total: number;
                limit: number;
                offset: number;
            };
        };
        meta: object;
    }>;
    /**
     * Search customers by company name
     */
    searchByCompany: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            company_name: string;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            success: boolean;
            data: {
                results: Array<{
                    handle: string;
                    company_name?: string;
                    email: string;
                    additional_data?: Record<string, any>;
                }>;
                total: number;
            };
            meta: {
                searched_at: string;
                search_company: string;
                total: number;
                limit: number;
                offset: number;
            };
        };
        meta: object;
    }>;
    /**
     * Get all customers with pagination
     */
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            limit?: number | undefined;
            offset?: number | undefined;
            with_additional_data?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: {
                results: Array<{
                    handle: string;
                    company_name?: string;
                    email: string;
                    additional_data?: Record<string, any>;
                }>;
                total: number;
            };
            meta: {
                retrieved_at: string;
                total: number;
                limit: number;
                offset: number;
            };
        };
        meta: object;
    }>;
    /**
     * Start email verification for gTLD
     */
    startEmailVerification: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            email: string;
            handle: string;
            language?: string | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
            };
            meta: {
                started_at: string;
                email: string;
                handle: string;
                language: string;
            };
        };
        meta: object;
    }>;
    /**
     * Check email verification status
     */
    checkEmailVerificationStatus: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            domain?: string | undefined;
            handle?: string | undefined;
            email?: string | undefined;
            status?: string | undefined;
            is_suspended?: boolean | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            success: boolean;
            data: any;
            meta: {
                checked_at: string;
                total: any;
                limit: number;
                offset: number;
            };
        };
        meta: object;
    }>;
}>>;
