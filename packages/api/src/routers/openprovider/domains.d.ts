export declare const openProviderDomainsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Check domain availability and pricing
     */
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
    /**
     * Register a new domain
     */
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
    /**
     * Transfer a domain from another registrar
     */
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
    /**
     * Search domains in your account
     */
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
    /**
     * List all domains (Domains Portfolio)
     * This is a user-friendly endpoint for the domains portfolio page
     */
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
    /**
     * Update domain attributes
     */
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
    /**
     * Renew a domain
     */
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
    /**
     * Get domain auth code
     */
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
    /**
     * Reset domain auth code
     */
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
    /**
     * Delete a domain
     */
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
    /**
     * Restore a domain
     */
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
    /**
     * Get domain pricing
     */
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
    /**
     * Get additional data requirements for a TLD
     */
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
    /**
     * Get additional customer data requirements for a TLD
     */
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
    /**
     * Public ICANN FOA transfer confirmation callback (branded confirmation page).
     * Relays approve/decline to OpenProvider using domainId + authCode from the FOA email link.
     */
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
