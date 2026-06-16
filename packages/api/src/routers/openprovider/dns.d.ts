export declare const openProviderDnsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Create a DNS zone
     */
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
    /**
     * Search DNS zones
     */
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
    /**
     * Get a specific DNS zone
     */
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
    /**
     * Update a DNS zone
     */
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
    /**
     * Delete a DNS zone
     */
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
    /**
     * Add DNS records to a zone
     */
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
    /**
     * Update DNS records in a zone
     */
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
    /**
     * Remove DNS records from a zone
     */
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
    /**
     * Get all DNS zones
     */
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
