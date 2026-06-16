export declare const openProviderRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Authentication endpoints
     */
    auth: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        login: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                username?: string | undefined;
                password?: string | undefined;
                ip?: string | undefined;
                useEnvCredentials?: boolean | undefined;
            };
            output: {
                success: boolean;
                data: {
                    token: string;
                    reseller_id: number;
                };
            };
            meta: object;
        }>;
        validateToken: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                token: string;
            };
            output: {
                success: boolean;
                valid: boolean;
                message: string;
            };
            meta: object;
        }>;
        getStatus: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                token?: string | undefined;
            };
            output: {
                authenticated: boolean;
                message: string;
            };
            meta: object;
        }>;
    }>>;
    /**
     * TLD (Top Level Domain) endpoints
     */
    tlds: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getTlds: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                limit?: unknown;
                offset?: unknown;
                extensions?: string | undefined;
                status?: "ACT" | "INACT" | undefined;
                with_price?: unknown;
                with_description?: unknown;
                with_restrictions?: unknown;
            } | undefined;
            output: {
                success: boolean;
                data: {
                    results: import("../../types/openprovider").OpenProviderTld[];
                    total: number;
                };
                meta: {
                    cached: boolean;
                    fetched_at: string;
                    total: number;
                    limit: number | undefined;
                    offset: number | undefined;
                };
            };
            meta: object;
        }>;
        getTldsPost: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
                extensions?: string[] | undefined;
                status?: "ACT" | "INACT" | undefined;
                with_price?: boolean | undefined;
                with_description?: boolean | undefined;
                with_restrictions?: boolean | undefined;
            };
            output: {
                success: boolean;
                data: {
                    results: import("../../types/openprovider").OpenProviderTld[];
                    total: number;
                };
                meta: {
                    cached: boolean;
                    fetched_at: string;
                    total: number;
                    limit: number | undefined;
                    offset: number | undefined;
                };
            };
            meta: object;
        }>;
        getPopularTlds: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                success: boolean;
                data: {
                    results: import("../../types/openprovider").OpenProviderTld[];
                    total: number;
                };
                meta: {
                    cached: boolean;
                    fetched_at: string;
                    total: number;
                    popular_extensions: string[];
                };
            };
            meta: object;
        }>;
        getTldByExtension: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                extension: string;
            };
            output: {
                success: boolean;
                data: import("../../types/openprovider").OpenProviderTld;
                meta: {
                    cached: boolean;
                    fetched_at: string;
                };
            };
            meta: object;
        }>;
        searchTlds: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                pattern: string;
                limit?: number | undefined;
            };
            output: {
                success: boolean;
                data: {
                    results: import("../../types/openprovider").OpenProviderTld[];
                    total: number;
                };
                meta: {
                    cached: boolean;
                    fetched_at: string;
                    search_pattern: string;
                    filtered_count: number;
                    returned_count: number;
                };
            };
            meta: object;
        }>;
    }>>;
    /**
     * Domain management endpoints
     */
    domains: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        checkAvailability: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                domains?: {
                    name: string;
                    extension: string;
                }[] | undefined;
                name?: string | undefined;
                extensions?: string[] | undefined;
                with_price?: boolean | undefined;
                with_whois?: boolean | undefined;
                additional_data?: {
                    idn_script?: string | undefined;
                } | undefined;
            };
            output: any;
            meta: object;
        }>;
        register: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                extension: string;
                owner_handle: string;
                admin_handle: string;
                tech_handle: string;
                period?: number | undefined;
                billing_handle?: string | undefined;
                reseller_handle?: string | undefined;
                name_servers?: {
                    name: string;
                    ip?: string | undefined;
                }[] | undefined;
                ns_group?: string | undefined;
                autorenew?: "default" | "on" | "off" | undefined;
                is_private_whois_enabled?: boolean | undefined;
                promo_code?: string | undefined;
                dnssec_keys?: {
                    flags: number;
                    protocol: number;
                    algorithm: number;
                    public_key: string;
                }[] | undefined;
                additional_data?: Record<string, any> | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: number;
                    domain: string;
                    status: "ACT" | "REQ";
                    activation_date?: string;
                    expiration_date: string;
                    renewal_date: string;
                    auth_code?: string;
                };
                meta: {
                    registered_at: string;
                    domain: string;
                };
            };
            meta: object;
        }>;
        transfer: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domain: {
                    name: string;
                    extension: string;
                };
                auth_code: string;
                owner_handle: string;
                admin_handle: string;
                tech_handle: string;
                billing_handle?: string | undefined;
                autorenew?: "default" | "on" | "off" | undefined;
                name_servers?: {
                    name: string;
                    ip?: string | undefined;
                }[] | undefined;
                ns_group?: string | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: number;
                    domain: string;
                    status: "REQ" | "ACT";
                    auth_code: string;
                    expiration_date: string;
                    renewal_date: string;
                };
                meta: {
                    transfer_initiated_at: string;
                    domain: string;
                };
            };
            meta: object;
        }>;
        search: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                domain_name_pattern?: string | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
                status?: "ACT" | "REQ" | "DEL" | "FAIL" | undefined;
            };
            output: {
                success: boolean;
                data: {
                    results: Array<{
                        id: number;
                        domain: string;
                        owner_handle: string;
                        admin_handle: string;
                        tech_handle: string;
                        billing_handle?: string;
                        name_servers: Array<{
                            name: string;
                            ip?: string;
                        }>;
                        status: "ACT" | "REQ" | "DEL" | "FAIL";
                        auth_code?: string;
                        autorenew: "on" | "off" | "default";
                        creation_date: string;
                        expiration_date: string;
                        renewal_date: string;
                        is_locked: boolean;
                        is_private_whois_enabled: boolean;
                        is_dnssec_enabled: boolean;
                        dnssec_keys?: Array<{
                            flags: number;
                            protocol: number;
                            algorithm: number;
                            public_key: string;
                        }>;
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
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                domain_name_pattern?: string | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
                status?: "ACT" | "REQ" | "DEL" | "FAIL" | undefined;
                with_customer_info?: boolean | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    domain: string;
                    status: "ACTIVE" | "PENDING" | "EXPIRED" | "SUSPENDED" | "TRANSFERRING";
                    registrationDate: string;
                    expiryDate: string;
                    clientName: any;
                    clientEmail: string;
                    tld: string;
                    autoRenewal: boolean;
                    nameservers: string[];
                    ownerHandle: string;
                    adminHandle: string;
                    techHandle: string;
                    billingHandle: string | undefined;
                    isLocked: boolean;
                    isPrivateWhois: boolean;
                    isDnssecEnabled: boolean;
                    authCode: string | undefined;
                    renewalDate: string;
                    resellerId: any;
                    nsgroupId: any;
                    nsGroup: any;
                    type: any;
                    canRenew: any;
                    isLockable: any;
                    isDeleted: any;
                    isPremium: any;
                    isAbusive: any;
                    isParked: any;
                    orderDate: any;
                    activeDate: any;
                    registryExpirationDate: any;
                    lastChanged: any;
                    ownerCompanyName: any;
                    ownerFullName: any;
                    comments: any;
                    unit: any;
                    dnssec: any;
                    nameServersFull: {
                        name: string;
                        ip: string | undefined;
                        ip6: any;
                        seqNr: any;
                    }[];
                }[];
                meta: {
                    total: number;
                    limit: number;
                    offset: number;
                    retrieved_at: string;
                };
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainId: number;
                owner_handle?: string | undefined;
                admin_handle?: string | undefined;
                tech_handle?: string | undefined;
                billing_handle?: string | undefined;
                ns_group?: string | undefined;
                name_servers?: {
                    name: string;
                    ip?: string | undefined;
                }[] | undefined;
                autorenew?: "default" | "on" | "off" | undefined;
                is_locked?: boolean | undefined;
                is_private_whois_enabled?: boolean | undefined;
                is_dnssec_enabled?: boolean | undefined;
                dnssec_keys?: {
                    flags: number;
                    protocol: number;
                    algorithm: number;
                    public_key: string;
                }[] | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: number;
                    status: "ACT" | "REQ";
                };
                meta: {
                    updated_at: string;
                    domain_id: number;
                };
            };
            meta: object;
        }>;
        renew: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainId: number;
                period?: number | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: number;
                    status: "ACT" | "REQ";
                    expiration_date: string;
                    renewal_date: string;
                };
                meta: {
                    renewed_at: string;
                    domain_id: number;
                    renewal_period: number;
                };
            };
            meta: object;
        }>;
        getAuthCode: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                domainId: number;
            };
            output: {
                success: boolean;
                data: {
                    auth_code: string;
                };
                meta: {
                    retrieved_at: string;
                    domain_id: number;
                };
            };
            meta: object;
        }>;
        resetAuthCode: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainId: number;
                auth_code_type?: "external" | "internal" | undefined;
            };
            output: {
                success: boolean;
                data: {
                    auth_code: string;
                };
                meta: {
                    reset_at: string;
                    domain_id: number;
                };
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainId: number;
                domainName: string;
                domainExtension: string;
            };
            output: {
                success: boolean;
                data: {
                    code: number;
                    desc: string;
                };
                meta: {
                    deleted_at: string;
                    domain_id: number;
                    domain: string;
                };
            };
            meta: object;
        }>;
        restore: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainId: number;
            };
            output: {
                success: boolean;
                data: {
                    code: number;
                    desc: string;
                };
                meta: {
                    restored_at: string;
                    domain_id: number;
                };
            };
            meta: object;
        }>;
        getPricing: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                domain: {
                    name: string;
                    extension: string;
                };
                operation: "create" | "transfer" | "renew" | "restore";
                period?: number | undefined;
                additional_data?: {
                    idn_script?: string | undefined;
                } | undefined;
            };
            output: {
                success: boolean;
                data: {
                    price: {
                        product: {
                            price: number;
                            currency: string;
                        };
                        reseller: {
                            price: number;
                            currency: string;
                        };
                    };
                    is_premium: boolean;
                    promotion_details?: {
                        start_date: string;
                        end_date: string;
                        non_promo_price: {
                            product: {
                                price: number;
                                currency: string;
                            };
                            reseller: {
                                price: number;
                                currency: string;
                            };
                        };
                    };
                };
                meta: {
                    priced_at: string;
                    domain: string;
                    operation: "create" | "transfer" | "renew" | "restore";
                    period: number;
                };
            };
            meta: object;
        }>;
        getAdditionalData: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                extension: string;
            };
            output: {
                success: boolean;
                data: {
                    fields: Array<{
                        name: string;
                        description: string;
                        required: boolean;
                        type: string;
                    }>;
                };
                meta: {
                    retrieved_at: string;
                    extension: string;
                };
            };
            meta: object;
        }>;
        getCustomerAdditionalData: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                extension: string;
                name?: string | undefined;
            };
            output: {
                success: boolean;
                data: {
                    fields: Array<{
                        name: string;
                        description: string;
                        required: boolean;
                        type: string;
                    }>;
                };
                meta: {
                    retrieved_at: string;
                    extension: string;
                    domain_name: string | undefined;
                };
            };
            meta: object;
        }>;
        completeTransferFoaConfirmation: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainId: string;
                authCode: string;
                approve: "no" | "yes";
            };
            output: {
                success: boolean;
                status: import("../../lib/openprovider-callback-response").OpenProviderCallbackStatus;
                message: string;
            };
            meta: object;
        }>;
    }>>;
    /**
     * Customer/Handle management endpoints
     */
    customers: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
        completeContactEmailVerification: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                email: string;
                authCode: string;
                approve: "no" | "yes";
            };
            output: {
                success: boolean;
                status: import("../../lib/openprovider-callback-response").OpenProviderCallbackStatus;
                message: string;
            };
            meta: object;
        }>;
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
    /**
     * DNS zone management endpoints
     */
    dns: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        createZone: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domain: {
                    name: string;
                    extension: string;
                };
                type: "master" | "slave";
                records?: {
                    name: string;
                    type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "TLSA" | "SSHFP" | "CAA";
                    value: string;
                    prio?: number | undefined;
                    ttl?: number | undefined;
                }[] | undefined;
                template_name?: string | undefined;
                provider?: "sectigo" | undefined;
                secured?: boolean | undefined;
                master_ip?: string | undefined;
            };
            output: {
                success: boolean;
                data: {
                    success: boolean;
                };
                meta: {
                    created_at: string;
                    zone: string;
                    type: "master" | "slave";
                };
            };
            meta: object;
        }>;
        searchZones: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
                name_pattern?: string | undefined;
                type?: "master" | "slave" | undefined;
                with_records?: boolean | undefined;
                with_history?: boolean | undefined;
            };
            output: {
                success: boolean;
                data: {
                    results: Array<{
                        name: string;
                        type: "master" | "slave";
                        active: boolean;
                        creation_date: string;
                        records?: Array<{
                            name: string;
                            type: string;
                            value: string;
                            prio?: number;
                            ttl: number;
                        }>;
                        history?: Array<{
                            date: string;
                            action: string;
                            details: string;
                        }>;
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
        getZone: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                zoneName: string;
                withRecords?: boolean | undefined;
                withHistory?: boolean | undefined;
            };
            output: {
                success: boolean;
                zoneNotFound: boolean;
                data: null;
                message: string;
                meta: {
                    retrieved_at: string;
                    zone_name: string;
                    with_records: boolean;
                    with_history: boolean;
                    error_code: number;
                };
            } | {
                success: boolean;
                zoneNotFound: boolean;
                data: {
                    success: boolean;
                };
                meta: {
                    retrieved_at: string;
                    zone_name: string;
                    with_records: boolean;
                    with_history: boolean;
                    error_code?: undefined;
                };
                message?: undefined;
            };
            meta: object;
        }>;
        updateZone: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                zoneName: string;
                records?: {
                    add?: {
                        name: string;
                        type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "TLSA" | "SSHFP" | "CAA";
                        value: string;
                        prio?: number | undefined;
                        ttl?: number | undefined;
                    }[] | undefined;
                    update?: {
                        name: string;
                        type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "TLSA" | "SSHFP" | "CAA";
                        value: string;
                        prio?: number | undefined;
                        ttl?: number | undefined;
                    }[] | undefined;
                    remove?: {
                        name: string;
                        type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "TLSA" | "SSHFP" | "CAA";
                        value: string;
                        prio?: number | undefined;
                        ttl?: number | undefined;
                    }[] | undefined;
                } | undefined;
                is_spamexperts_enabled?: boolean | undefined;
            };
            output: {
                success: boolean;
                data: {
                    success: boolean;
                };
                meta: {
                    updated_at: string;
                    zone_name: string;
                };
            };
            meta: object;
        }>;
        deleteZone: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                zoneName: string;
            };
            output: {
                success: boolean;
                data: {
                    code: number;
                    desc: string;
                };
                meta: {
                    deleted_at: string;
                    zone_name: string;
                };
            };
            meta: object;
        }>;
        addRecords: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                zoneName: string;
                records: {
                    name: string;
                    type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "TLSA" | "SSHFP" | "CAA";
                    value: string;
                    prio?: number | undefined;
                    ttl?: number | undefined;
                }[];
            };
            output: {
                success: boolean;
                data: {
                    success: boolean;
                };
                meta: {
                    updated_at: string;
                    zone_name: string;
                    records_added: number;
                };
            };
            meta: object;
        }>;
        updateRecords: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                zoneName: string;
                records: {
                    name: string;
                    type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "TLSA" | "SSHFP" | "CAA";
                    value: string;
                    prio?: number | undefined;
                    ttl?: number | undefined;
                }[];
            };
            output: {
                success: boolean;
                data: {
                    success: boolean;
                };
                meta: {
                    updated_at: string;
                    zone_name: string;
                    records_updated: number;
                };
            };
            meta: object;
        }>;
        removeRecords: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                zoneName: string;
                records: {
                    name: string;
                    type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "TLSA" | "SSHFP" | "CAA";
                    value: string;
                    prio?: number | undefined;
                    ttl?: number | undefined;
                }[];
            };
            output: {
                success: boolean;
                data: {
                    success: boolean;
                };
                meta: {
                    updated_at: string;
                    zone_name: string;
                    records_removed: number;
                };
            };
            meta: object;
        }>;
        getAllZones: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
                withRecords?: boolean | undefined;
            };
            output: {
                success: boolean;
                data: {
                    results: Array<{
                        name: string;
                        type: "master" | "slave";
                        active: boolean;
                        creation_date: string;
                        records?: Array<{
                            name: string;
                            type: string;
                            value: string;
                            prio?: number;
                            ttl: number;
                        }>;
                        history?: Array<{
                            date: string;
                            action: string;
                            details: string;
                        }>;
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
    }>>;
    /**
     * Health check for OpenProvider integration
     */
    healthCheck: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            status: string;
            message: string;
            details: {
                has_username: boolean;
                has_password: boolean;
                authenticated?: undefined;
                base_url?: undefined;
                api_version?: undefined;
                error?: undefined;
            };
        } | {
            status: string;
            message: string;
            details: {
                authenticated: boolean;
                base_url: string;
                api_version: string;
                has_username?: undefined;
                has_password?: undefined;
                error?: undefined;
            };
        } | {
            status: string;
            message: string;
            details: {
                authenticated: boolean;
                error: string;
                has_username?: undefined;
                has_password?: undefined;
                base_url?: undefined;
                api_version?: undefined;
            };
        } | {
            status: string;
            message: string;
            details: {
                error: string;
                has_username?: undefined;
                has_password?: undefined;
                authenticated?: undefined;
                base_url?: undefined;
                api_version?: undefined;
            };
        };
        meta: object;
    }>;
}>>;
