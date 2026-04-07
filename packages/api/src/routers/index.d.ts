export declare const appRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    healthCheck: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: string;
        meta: object;
    }>;
    privateData: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            message: string;
            user: import("..").SessionUser;
        };
        meta: object;
    }>;
    plesk: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        healthCheck: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            testXmlConnection: import("@trpc/server").TRPCQueryProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    status: string;
                    message: string;
                    details: {
                        has_xml_endpoint: boolean;
                        has_secret_key: boolean;
                        has_username: boolean;
                        has_password: boolean;
                        response_time_ms?: undefined;
                        is_host_unreachable?: undefined;
                        is_auth_error?: undefined;
                        parse_error?: undefined;
                        raw_xml?: undefined;
                        error_code?: undefined;
                        error_text?: undefined;
                        raw_response?: undefined;
                        server_info?: undefined;
                        error?: undefined;
                        error_type?: undefined;
                    };
                } | {
                    status: string;
                    message: string;
                    details: {
                        has_xml_endpoint: boolean;
                        has_secret_key: boolean;
                        has_username: boolean;
                        has_password: boolean;
                        response_time_ms: number;
                        is_host_unreachable: boolean;
                        is_auth_error: boolean;
                        parse_error?: undefined;
                        raw_xml?: undefined;
                        error_code?: undefined;
                        error_text?: undefined;
                        raw_response?: undefined;
                        server_info?: undefined;
                        error?: undefined;
                        error_type?: undefined;
                    };
                } | {
                    status: string;
                    message: string;
                    details: {
                        has_xml_endpoint: boolean;
                        has_secret_key: boolean;
                        has_username: boolean;
                        has_password: boolean;
                        response_time_ms: number;
                        is_host_unreachable: boolean;
                        is_auth_error: boolean;
                        parse_error: string;
                        raw_xml: string;
                        error_code?: undefined;
                        error_text?: undefined;
                        raw_response?: undefined;
                        server_info?: undefined;
                        error?: undefined;
                        error_type?: undefined;
                    };
                } | {
                    status: string;
                    message: string;
                    details: {
                        has_xml_endpoint: boolean;
                        has_secret_key: boolean;
                        has_username: boolean;
                        has_password: boolean;
                        error_code: any;
                        error_text: any;
                        response_time_ms: number;
                        is_host_unreachable: boolean;
                        is_auth_error: boolean;
                        raw_response: any;
                        parse_error?: undefined;
                        raw_xml?: undefined;
                        server_info?: undefined;
                        error?: undefined;
                        error_type?: undefined;
                    };
                } | {
                    status: string;
                    message: string;
                    details: {
                        has_xml_endpoint: boolean;
                        has_secret_key: boolean;
                        has_username: boolean;
                        has_password: boolean;
                        response_time_ms: number;
                        is_host_unreachable: boolean;
                        is_auth_error: boolean;
                        server_info: any;
                        raw_response: any;
                        parse_error?: undefined;
                        raw_xml?: undefined;
                        error_code?: undefined;
                        error_text?: undefined;
                        error?: undefined;
                        error_type?: undefined;
                    };
                } | {
                    status: string;
                    message: string;
                    details: {
                        error: string;
                        error_type: string;
                        has_xml_endpoint?: undefined;
                        has_secret_key?: undefined;
                        has_username?: undefined;
                        has_password?: undefined;
                        response_time_ms?: undefined;
                        is_host_unreachable?: undefined;
                        is_auth_error?: undefined;
                        parse_error?: undefined;
                        raw_xml?: undefined;
                        error_code?: undefined;
                        error_text?: undefined;
                        raw_response?: undefined;
                        server_info?: undefined;
                    };
                };
                meta: object;
            }>;
            testRestConnection: import("@trpc/server").TRPCQueryProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    status: string;
                    message: string;
                    details: {
                        has_rest_endpoint: boolean;
                        has_secret_key: boolean;
                        has_username: boolean;
                        has_password: boolean;
                        response_time_ms?: undefined;
                        is_host_unreachable?: undefined;
                        is_auth_error?: undefined;
                        status_code?: undefined;
                        response_data?: undefined;
                        note?: undefined;
                        error?: undefined;
                        error_type?: undefined;
                    };
                } | {
                    status: string;
                    message: string;
                    details: {
                        has_rest_endpoint: boolean;
                        has_secret_key: boolean;
                        has_username: boolean;
                        has_password: boolean;
                        response_time_ms: number;
                        is_host_unreachable: boolean;
                        is_auth_error: boolean;
                        status_code: number;
                        response_data?: undefined;
                        note?: undefined;
                        error?: undefined;
                        error_type?: undefined;
                    };
                } | {
                    status: string;
                    message: string;
                    details: {
                        has_rest_endpoint: boolean;
                        has_secret_key: boolean;
                        has_username: boolean;
                        has_password: boolean;
                        response_time_ms: number;
                        is_host_unreachable: false;
                        is_auth_error: false;
                        status_code: number;
                        response_data: any;
                        note?: undefined;
                        error?: undefined;
                        error_type?: undefined;
                    };
                } | {
                    status: string;
                    message: string;
                    details: {
                        has_rest_endpoint: boolean;
                        has_secret_key: boolean;
                        has_username: boolean;
                        has_password: boolean;
                        response_time_ms: number;
                        is_host_unreachable: boolean;
                        is_auth_error: boolean;
                        status_code: number;
                        note: string;
                        response_data: any;
                        error?: undefined;
                        error_type?: undefined;
                    };
                } | {
                    status: string;
                    message: string;
                    details: {
                        error: string;
                        error_type: string;
                        has_rest_endpoint?: undefined;
                        has_secret_key?: undefined;
                        has_username?: undefined;
                        has_password?: undefined;
                        response_time_ms?: undefined;
                        is_host_unreachable?: undefined;
                        is_auth_error?: undefined;
                        status_code?: undefined;
                        response_data?: undefined;
                        note?: undefined;
                    };
                };
                meta: object;
            }>;
            testAll: import("@trpc/server").TRPCQueryProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    status: string;
                    message: string;
                    timestamp: string;
                    xml_api: {
                        status: string;
                        message: string;
                        response_time_ms: number;
                        error_code?: undefined;
                        server_info?: undefined;
                    } | {
                        status: string;
                        message: string;
                        error_code: any;
                        response_time_ms: number;
                        server_info?: undefined;
                    } | {
                        status: string;
                        message: string;
                        response_time_ms: number;
                        server_info: any;
                        error_code?: undefined;
                    } | {
                        status: string;
                        message: any;
                    };
                    rest_api: {
                        status: string;
                        message: string;
                        response_time_ms: number;
                        status_code?: undefined;
                    } | {
                        status: string;
                        message: string;
                        status_code: number;
                        response_time_ms: number;
                    } | {
                        status: string;
                        message: any;
                    };
                    environment: {
                        has_xml_endpoint: boolean;
                        has_rest_endpoint: boolean;
                        has_secret_key: boolean;
                        has_username: boolean;
                        has_password: boolean;
                    };
                };
                meta: object;
            }>;
        }>>;
        customers: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getAll: import("@trpc/server").TRPCQueryProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    raw: string;
                    parsed: unknown;
                };
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: number;
                };
                output: {
                    raw: string;
                    parsed: unknown;
                };
                meta: object;
            }>;
        }>>;
        domains: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getAll: import("@trpc/server").TRPCQueryProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: number;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        wordpress: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getAll: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    domain?: string | undefined;
                    installationIds?: number[] | undefined;
                    sortBy?: "title" | "displayTitle" | "ownerName" | "version" | undefined;
                    sortOrder?: "asc" | "desc" | undefined;
                } | undefined;
                output: {
                    data: any[];
                    metadata: {
                        endpoint: string;
                        timestamp: string;
                        totalInstallations: number;
                        apiVersion: string;
                        filters: {
                            domain: string | null;
                            installationIds: number[] | null;
                            sortBy: "title" | "displayTitle" | "ownerName" | "version";
                            sortOrder: "asc" | "desc";
                        };
                        note: string;
                    };
                };
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: number;
                };
                output: {
                    data: any;
                    metadata: {
                        endpoint: string;
                        timestamp: string;
                        totalInstallations: number;
                        apiVersion: string;
                        note: string;
                    };
                };
                meta: object;
            }>;
        }>>;
        domainDns: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getBySiteId: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    siteId: number;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        wpPlugins: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getByInstallationId: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                };
                output: {
                    data: any;
                    metadata: {
                        endpoint: string;
                        timestamp: string;
                        installationId: number;
                        apiVersion: string;
                        note: string;
                    };
                };
                meta: object;
            }>;
            getCatalog: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                    page?: number | undefined;
                    pageSize?: number | undefined;
                    term?: string | undefined;
                    compatible?: boolean | undefined;
                    downloadCount?: number | undefined;
                    rating?: number | undefined;
                    lastUpdatedAt?: string | undefined;
                };
                output: {
                    data: any;
                    metadata: {
                        endpoint: string;
                        timestamp: string;
                        installationId: number;
                        filters: {
                            page?: number | undefined;
                            pageSize?: number | undefined;
                            term?: string | undefined;
                            compatible?: boolean | undefined;
                            downloadCount?: number | undefined;
                            rating?: number | undefined;
                            lastUpdatedAt?: string | undefined;
                        };
                        apiVersion: string;
                        note: string;
                    };
                };
                meta: object;
            }>;
        }>>;
        databases: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getBySiteId: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    siteId: number;
                };
                output: {
                    raw: string;
                    parsed: unknown;
                };
                meta: object;
            }>;
        }>>;
        databasesCreate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    siteId: number;
                    name: string;
                    type: "mysql" | "postgresql" | "mssql";
                    dbServerId?: number | undefined;
                };
                output: {
                    raw: string;
                    parsed: any;
                    databaseId: any;
                };
                meta: object;
            }>;
        }>>;
        databasesDelete: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    siteId: number;
                    databaseId: number;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        databasesSetUser: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    userId: number;
                    password?: string | undefined;
                    passwordType?: "plain" | "crypt" | undefined;
                    role?: "readWrite" | "readOnly" | "writeOnly" | undefined;
                    acl?: string[] | undefined;
                    allowAccessFrom?: string[] | undefined;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        databasesAssign: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            assign: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    databaseId: number;
                    targetWebspaceId: number;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        emails: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getBySiteId: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    siteId: number;
                };
                output: {
                    raw: string;
                    parsed: unknown;
                };
                meta: object;
            }>;
        }>>;
        subdomains: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getByParentDomain: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    domain: string;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        subscriptions: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getAll: import("@trpc/server").TRPCQueryProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: number;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
            getByTeamFilterIds: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    teamId: string;
                    hostingSubType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
                };
                output: {
                    hasServiceSubscriptions: boolean;
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        servicePlans: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getAll: import("@trpc/server").TRPCQueryProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: number;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        customersCreate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    personName: string;
                    email: string;
                    login?: string | undefined;
                    password?: string | undefined;
                    phone?: string | undefined;
                    fax?: string | undefined;
                    company?: string | undefined;
                    address?: string | undefined;
                    city?: string | undefined;
                    state?: string | undefined;
                    postCode?: string | undefined;
                    country?: string | undefined;
                    locale?: string | undefined;
                    guid?: string | undefined;
                    ownerId?: number | undefined;
                    externalId?: string | undefined;
                    description?: string | undefined;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        dnsCreate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    siteId: number;
                    type: string;
                    host: string;
                    value: string;
                    opt?: string | undefined;
                    ttl?: number | undefined;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        dnsDelete: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    recordId: number;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        dnsUpdate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    siteId: number;
                    recordId: number;
                    type: string;
                    host: string;
                    value: string;
                    domainName?: string | undefined;
                    opt?: string | number | undefined;
                    ttl?: number | undefined;
                };
                output: {
                    success: boolean;
                    recordId: any;
                };
                meta: object;
            }>;
        }>>;
        emailsCreate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    siteId: number;
                    name: string;
                    password: string;
                    passwordType?: "plain" | "crypt" | "md5" | "sha256" | "sha512" | undefined;
                    mailbox?: {
                        enabled?: boolean | undefined;
                        quota?: number | undefined;
                    } | undefined;
                    forwarding?: {
                        enabled: boolean;
                        addresses?: string[] | undefined;
                    } | undefined;
                    autoresponder?: {
                        enabled: boolean;
                        subject?: string | undefined;
                        contentType?: string | undefined;
                        content?: string | undefined;
                    } | undefined;
                    antivir?: string | undefined;
                    cpAccess?: boolean | undefined;
                    outgoingMessagesLimit?: number | undefined;
                    description?: string | undefined;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        emailsDelete: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    siteId: number;
                    name: string;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        emailsUpdate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    siteId: number;
                    name: string;
                    password?: string | undefined;
                    passwordType?: "plain" | "crypt" | undefined;
                    antivir?: "off" | "out" | "in" | "inout" | undefined;
                    outgoingMessagesLimit?: number | undefined;
                    description?: string | undefined;
                    autoresponder?: {
                        enabled?: boolean | undefined;
                        subject?: string | undefined;
                        content?: string | undefined;
                        contentType?: string | undefined;
                    } | undefined;
                    mailbox?: {
                        enabled?: boolean | undefined;
                        quota?: number | undefined;
                    } | undefined;
                };
                output: {
                    message: string;
                    summary: {
                        total: number;
                        successful: number;
                        failed: number;
                    };
                    success: boolean;
                    mailName: string;
                    siteId: number;
                    operationsPerformed: string[];
                    fieldResults: Record<string, any>;
                    warnings: string[];
                };
                meta: object;
            }>;
        }>>;
        subdomainsCreate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    parent: string;
                    name: string;
                    wwwRoot?: string | undefined;
                    ssh?: boolean | undefined;
                    safeMode?: boolean | undefined;
                    php?: string | undefined;
                    cgi?: boolean | undefined;
                    perl?: boolean | undefined;
                    python?: boolean | undefined;
                    ruby?: boolean | undefined;
                    nodejs?: boolean | undefined;
                    webstat?: "custom" | "none" | "awstats" | "webalizer" | "analog" | undefined;
                    hosting?: {
                        ipAddress?: string | undefined;
                        ftpLogin?: string | undefined;
                        ftpPassword?: string | undefined;
                    } | undefined;
                };
                output: {
                    raw: string;
                    parsed: any;
                    success: boolean;
                    subdomainId: any;
                };
                meta: object;
            }>;
        }>>;
        subdomainsDelete: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id?: number | undefined;
                    name?: string | undefined;
                };
                output: {
                    success: boolean;
                    deletedId: any;
                    filterId: any;
                    message: string;
                };
                meta: object;
            }>;
        }>>;
        subscriptionsCreate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    name: string;
                    ownerId: number;
                    hostingType?: "none" | "vrt_hst" | "standard" | undefined;
                    ipAddress?: string | undefined;
                    status?: number | undefined;
                    description?: string | undefined;
                    adminDescription?: string | undefined;
                    planName?: string | undefined;
                    planGuid?: string | undefined;
                    planExternalId?: string | undefined;
                    limitsXml?: string | undefined;
                    permsXml?: string | undefined;
                    prefsXml?: string | undefined;
                    ipPoolXml?: string | undefined;
                };
                output: {
                    raw: string;
                    parsed: unknown;
                };
                meta: object;
            }>;
        }>>;
        subscriptionsDelete: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: number;
                };
                output: {
                    raw: string;
                };
                meta: object;
            }>;
        }>>;
        subscriptionsUpdate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: number;
                    name?: string | undefined;
                    status?: number | undefined;
                    ipAddress?: string | undefined;
                    description?: string | undefined;
                    adminDescription?: string | undefined;
                    diskSpace?: number | undefined;
                    maxSubdomains?: number | undefined;
                    maxDomains?: number | undefined;
                    maxDatabases?: number | undefined;
                    www?: boolean | undefined;
                };
                output: {
                    raw: string;
                    parsed: any;
                };
                meta: object;
            }>;
        }>>;
        wpCredentials: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            get: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                };
                output: {
                    data: any;
                };
                meta: object;
            }>;
            getAccount: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                };
                output: {
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        wpPluginsInstall: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            install: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    slug: string;
                    status?: boolean | undefined;
                };
                output: {
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        wpPluginsDelete: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    plugins: string[];
                };
                output: {
                    data: {
                        success: boolean;
                        deletedPlugins: string[];
                    };
                };
                meta: object;
            }>;
        }>>;
        wpPluginsStatus: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            setStatus: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    slug: string;
                    status: boolean;
                };
                output: {
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        wpPluginsAutoupdate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    plugins: {
                        slug: string;
                        autoUpdates?: boolean | undefined;
                        status?: boolean | undefined;
                    }[];
                };
                output: {
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        wpThemesAutoupdate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    themes: {
                        slug: string;
                        autoUpdates?: boolean | undefined;
                        status?: boolean | undefined;
                    }[];
                };
                output: {
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        wpThemesDelete: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    themes: string[];
                };
                output: {
                    data: {
                        success: boolean;
                        deletedThemes: string[];
                    };
                };
                meta: object;
            }>;
        }>>;
        wpThemesInstall: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            install: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    slug: string;
                    status?: boolean | undefined;
                };
                output: {
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        wpThemesList: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            installed: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                };
                output: {
                    data: any;
                };
                meta: object;
            }>;
            catalog: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                    compatible?: boolean | undefined;
                    downloadCount?: number | undefined;
                    lastUpdatedAt?: "all" | "3M" | "6M" | "1y" | "2y" | undefined;
                    page?: number | undefined;
                    pageSize?: number | undefined;
                    rating?: number | undefined;
                    term?: string | undefined;
                };
                output: {
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        wpThemesStatus: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            setStatus: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    slug: string;
                    status: boolean;
                };
                output: {
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        wpUpdatesInfo: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            get: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                };
                output: {
                    data: {
                        installation: any;
                        settings: any;
                        core: {
                            currentVersion: any;
                            availableVersion: null;
                            needsUpdate: boolean;
                            updateType: any;
                        };
                        plugins: any[];
                        themes: any[];
                    };
                };
                meta: object;
            }>;
        }>>;
        wpUpdatesSettings: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            get: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                };
                output: {
                    data: any;
                };
                meta: object;
            }>;
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    settings: {
                        core: "none" | "major" | "minor";
                        plugins: {
                            forceUpdates: boolean;
                            newlyInstalledUpdates: boolean;
                            updateVulnerable: boolean;
                            deactivateVulnerable: boolean;
                        };
                        themes: {
                            forceUpdates: boolean;
                            newlyInstalledUpdates: boolean;
                            updateVulnerable: boolean;
                        };
                        safeUpdate: boolean;
                    };
                };
                output: {
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        wpInstall: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            install: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    domainName: string;
                    username: string;
                    adminEmail: string;
                    adminPassword: string;
                    wpVersion?: string | undefined;
                    siteTitle?: string | undefined;
                    language?: string | undefined;
                    protocol?: "http" | "https" | undefined;
                    databaseName?: string | undefined;
                    dbUser?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: any;
                    message: string;
                };
                meta: object;
            }>;
        }>>;
        wpFeatures: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getIntegrityInfo: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            updateDebugStatus: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    status: boolean;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            getDebugSettings: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            updateDebugSettings: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    wpDebug?: boolean | undefined;
                    wpDebugLog?: boolean | undefined;
                    wpDebugDisplay?: boolean | undefined;
                    scriptDebug?: boolean | undefined;
                    saveQueries?: boolean | undefined;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            updateHotlinkProtectionStatus: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    status: boolean;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            getHotlinkProtectionSettings: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            toggleIndexing: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    status: boolean;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            getMaintenanceSettings: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            updateMaintenanceSettings: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    fullMode?: boolean | undefined;
                    texts?: {
                        title?: string | undefined;
                        header?: string | undefined;
                        subheader?: string | undefined;
                    } | undefined;
                    timer?: {
                        enabled: boolean;
                        days?: number | undefined;
                        hours?: number | undefined;
                        minutes?: number | undefined;
                    } | undefined;
                    socialNetworks?: Record<string, string> | undefined;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            toggleMaintenanceMode: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    status: boolean;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            toggleNginxCaching: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    status: boolean;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            getPasswordProtection: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            updatePasswordProtection: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    status: boolean;
                    credentials?: {
                        username: string;
                        password: string;
                    } | undefined;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            toggleSmartUpdate: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    status: boolean;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            applySmartUpdate: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            discardSmartUpdate: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            getSecurityMeasures: import("@trpc/server").TRPCQueryProcedure<{
                input: void;
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            getSecurityStatus: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationsIds: number[];
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            resolveSecurityMeasure: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationsIds: number[];
                    securityMeasures: string[];
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            revertSecurityMeasure: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationsIds: number[];
                    securityMeasures: string[];
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            createBackup: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    description?: string | undefined;
                    backupSettings?: boolean | undefined;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            restoreBackup: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    fileName: string;
                    clobber?: boolean | undefined;
                    dropAllDatabaseTables?: boolean | undefined;
                    restoreSettings?: boolean | undefined;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            getBackups: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    installationId: number;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
            deleteBackup: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    installationId: number;
                    fileName: string;
                };
                output: import("../lib/plesk/rest-client").PleskRestResult;
                meta: object;
            }>;
        }>>;
        ftp: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            testConnection: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    host: string;
                    user: string;
                    password: string;
                    port?: number | undefined;
                    secure?: boolean | undefined;
                    timeout?: number | undefined;
                };
                output: {
                    success: boolean;
                    currentPath: string;
                    message: string;
                };
                meta: object;
            }>;
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    path?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: {
                        name: string;
                        type: "file" | "directory";
                        size?: number | undefined;
                        date?: string | undefined;
                        permissions?: any;
                        owner?: string | undefined;
                        group?: string | undefined;
                    }[];
                    path: string;
                };
                meta: object;
            }>;
            pwd: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                };
                output: {
                    success: boolean;
                    data: string;
                };
                meta: object;
            }>;
            cd: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    path: string;
                };
                output: {
                    success: boolean;
                    data: string;
                };
                meta: object;
            }>;
            getFileInfo: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    path: string;
                };
                output: {
                    success: boolean;
                    data: {
                        path: string;
                        size: number;
                        lastModified: Date;
                    };
                };
                meta: object;
            }>;
            upload: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    localPath: string;
                    remotePath: string;
                };
                output: {
                    success: boolean;
                    message: string;
                };
                meta: object;
            }>;
            uploadFile: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    fileData: string;
                    fileName: string;
                    remotePath: string;
                };
                output: {
                    success: boolean;
                    message: string;
                    remotePath: string;
                };
                meta: object;
            }>;
            download: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    remotePath: string;
                    localPath: string;
                };
                output: {
                    success: boolean;
                    message: string;
                };
                meta: object;
            }>;
            rename: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    oldPath: string;
                    newPath: string;
                };
                output: {
                    success: boolean;
                    message: string;
                };
                meta: object;
            }>;
            deleteFile: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    path: string;
                };
                output: {
                    success: boolean;
                    message: string;
                };
                meta: object;
            }>;
            deleteDirectory: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    path: string;
                };
                output: {
                    success: boolean;
                    message: string;
                };
                meta: object;
            }>;
            createDirectory: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    path: string;
                };
                output: {
                    success: boolean;
                    message: string;
                };
                meta: object;
            }>;
            getFeatures: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                };
                output: {
                    success: boolean;
                    data: {
                        [k: string]: string;
                    };
                };
                meta: object;
            }>;
            downloadFile: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    remotePath: string;
                };
                output: {
                    success: boolean;
                    data: Buffer;
                    filename: string;
                };
                meta: object;
            }>;
            downloadFolder: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    remotePath: string;
                    folderName: string;
                };
                output: {
                    success: boolean;
                    data: Buffer;
                    filename: string;
                };
                meta: object;
            }>;
            readFile: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    remotePath: string;
                    maxSize?: number | undefined;
                };
                output: {
                    success: boolean;
                    content: string;
                    filename: string;
                    encoding: string;
                };
                meta: object;
            }>;
            extractZip: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    credentials: {
                        host: string;
                        user: string;
                        password: string;
                        port?: number | undefined;
                        secure?: boolean | undefined;
                        timeout?: number | undefined;
                    };
                    zipPath: string;
                    extractTo?: string | undefined;
                    overwrite?: boolean | undefined;
                    maxSize?: number | undefined;
                };
                output: {
                    success: boolean;
                    extractedCount: number;
                    failedCount: number;
                    files: string[];
                    failedFiles: string[] | undefined;
                    message: string;
                };
                meta: object;
            }>;
        }>>;
    }>>;
    openProvider: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        auth: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
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
        tlds: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
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
                        results: import("../types/openprovider").OpenProviderTld[];
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
                        results: import("../types/openprovider").OpenProviderTld[];
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
                        results: import("../types/openprovider").OpenProviderTld[];
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
                    data: import("../types/openprovider").OpenProviderTld;
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
                        results: import("../types/openprovider").OpenProviderTld[];
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
        domains: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
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
        }>>;
        customers: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
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
        dns: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
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
                        type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "CAA" | "SSHFP" | "TLSA";
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
                            type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "CAA" | "SSHFP" | "TLSA";
                            value: string;
                            prio?: number | undefined;
                            ttl?: number | undefined;
                        }[] | undefined;
                        update?: {
                            name: string;
                            type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "CAA" | "SSHFP" | "TLSA";
                            value: string;
                            prio?: number | undefined;
                            ttl?: number | undefined;
                        }[] | undefined;
                        remove?: {
                            name: string;
                            type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "CAA" | "SSHFP" | "TLSA";
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
                        type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "CAA" | "SSHFP" | "TLSA";
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
                        type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "CAA" | "SSHFP" | "TLSA";
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
                        type: "MX" | "NS" | "A" | "AAAA" | "CNAME" | "SRV" | "TXT" | "CAA" | "SSHFP" | "TLSA";
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
    kenic: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        greeting: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getGreeting: import("@trpc/server").TRPCQueryProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    raw: string;
                    parsed: null;
                    parseError: string;
                    configUsed: {
                        host: string;
                        port: number;
                        timeoutMs: number;
                        tlsServername: string | null;
                    };
                } | {
                    raw: string;
                    parsed: unknown;
                    configUsed: {
                        host: string;
                        port: number;
                        timeoutMs: number;
                        tlsServername: string | null;
                    };
                    parseError?: undefined;
                };
                meta: object;
            }>;
        }>>;
        login: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            login: import("@trpc/server").TRPCMutationProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    raw: string;
                    parsed: null;
                    parseError: string;
                    resultCode: null;
                    resultMsg: null;
                    success: boolean;
                } | {
                    raw: string;
                    parsed: Record<string, unknown>;
                    resultCode: string;
                    resultMsg: string;
                    success: boolean;
                    parseError?: undefined;
                };
                meta: object;
            }>;
        }>>;
        domainCheck: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            check: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    domains: string[];
                    withFee?: boolean | undefined;
                    currency?: string | undefined;
                    periodYears?: number | undefined;
                    phase?: string | undefined;
                    subphase?: string | undefined;
                    includeRestoreFee?: boolean | undefined;
                };
                output: {
                    raw: string;
                    parsed: null;
                    checkResultCode: null;
                    checkResultMsg: null;
                    loginResultExtValue?: import("./kenic/domain-check").EppResultExtValue | undefined;
                    loginSuccess: boolean;
                    loginResultCode: string;
                    loginResultMsg: string;
                    parseError?: undefined;
                } | {
                    loginSuccess: boolean;
                    raw: string;
                    parsed: null;
                    parseError: string;
                    checkResultCode: null;
                    checkResultMsg: null;
                } | {
                    checkResultExtValue?: import("./kenic/domain-check").EppResultExtValue | undefined;
                    loginSuccess: boolean;
                    raw: string;
                    parsed: Record<string, unknown>;
                    normalized: null;
                    checkResultCode: string;
                    checkResultMsg: string;
                    parseError?: undefined;
                } | {
                    batched?: boolean | undefined;
                    batchCount?: number | undefined;
                    loginSuccess: boolean;
                    raw: string | undefined;
                    parsed: Record<string, unknown> | undefined;
                    normalized: import("../lib/epp/domain-check-types").DomainCheckNormalized | null;
                    checkResultCode: string;
                    checkResultMsg: string;
                    parseError?: undefined;
                };
                meta: object;
            }>;
        }>>;
        tlds: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    tlds: string[];
                };
                meta: object;
            }>;
        }>>;
        contactCreate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                    postalInfo: {
                        name: string;
                        street: string | string[];
                        city: string;
                        pc: string;
                        cc: string;
                        org?: string | undefined;
                        sp?: string | undefined;
                    } | [{
                        name: string;
                        street: string | string[];
                        city: string;
                        pc: string;
                        cc: string;
                        org?: string | undefined;
                        sp?: string | undefined;
                    }, {
                        name: string;
                        street: string | string[];
                        city: string;
                        pc: string;
                        cc: string;
                        org?: string | undefined;
                        sp?: string | undefined;
                    }];
                    voice: string;
                    email: string;
                    fax?: string | undefined;
                    authInfo?: string | undefined;
                    disclose?: {
                        flag: 0 | 1;
                        elements?: ("name" | "email" | "fax" | "org" | "voice" | "addr")[] | undefined;
                    } | undefined;
                };
                output: {
                    success: boolean;
                    contactId: string;
                    crDate: string | null;
                    raw: string;
                };
                meta: object;
            }>;
        }>>;
        domainCreate: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    name: string;
                    registrant: string;
                    period?: number | undefined;
                    ns?: {
                        type: "hostObj";
                        hosts: string[];
                    } | {
                        type: "hostAttr";
                        hosts: {
                            name: string;
                            addrs?: string[] | undefined;
                        }[];
                    } | undefined;
                    adminContacts?: string[] | undefined;
                    techContacts?: string[] | undefined;
                    authInfo?: string | undefined;
                };
                output: {
                    success: boolean;
                    domain: string;
                    crDate: string | null;
                    exDate: string | null;
                    raw: string;
                };
                meta: object;
            }>;
        }>>;
        domainTransfer: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            request: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    name: string;
                    authCode: string;
                    roid?: string | undefined;
                    period?: number | undefined;
                };
                output: import("../lib/kenic-transfer-request").ExecuteKenicTransferResult;
                meta: object;
            }>;
        }>>;
        configStatus: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            get: import("@trpc/server").TRPCQueryProcedure<{
                input: void;
                output: {
                    host: string;
                    hostIsIp: boolean;
                    port: number;
                    timeoutMs: number;
                    tlsServernameResolved: string;
                    hasExplicitTlsServername: boolean;
                    allowLegacyCommonNameFallback: boolean;
                    hasCredentialsConfigured: boolean;
                };
                meta: object;
            }>;
            inspectTls: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    sniServername?: string | undefined;
                } | undefined;
                output: import("../lib/epp/epp-client").EppTlsPeerInspectResult;
                meta: object;
            }>;
        }>>;
    }>>;
    domainTransfer: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        checkTransfer: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domain: string;
            };
            output: {
                transferStatus: import("./domain-transfer").TransferStatus;
                transferrable: boolean;
                provider: "kenic" | "openprovider" | null;
                domain: string;
                name: string;
                extension: string;
                price: number | null;
                currency: string | null;
                createPrice: number | null;
                createCurrency: string | null;
                error: string | null;
            } | {
                transferStatus: "unavailable";
                transferrable: boolean;
                provider: null;
                domain: string;
                name: null;
                extension: null;
                price: null;
                currency: null;
                error: string;
            };
            meta: object;
        }>;
        initiateTransfer: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domain: string;
                authCode: string;
                provider: "kenic" | "openprovider";
                domainName: string;
                extension: string;
                providerPriceAmount?: string | undefined;
                providerPriceCurrency?: string | undefined;
                customerPriceAmount?: string | undefined;
                customerPriceCurrency?: string | undefined;
                teamId?: string | undefined;
            };
            output: {
                success: boolean;
                id: `${string}-${string}-${string}-${string}-${string}`;
                pending: boolean;
                domain: string;
            } | {
                success: boolean;
                id: `${string}-${string}-${string}-${string}-${string}`;
                domain: string;
                pending?: undefined;
            };
            meta: object;
        }>;
        listTransferRequests: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                domainName: string;
                provider: string;
                status: string;
                providerPriceAmount: string | null;
                providerPriceCurrency: string | null;
                customerPriceAmount: string | null;
                customerPriceCurrency: string | null;
                submittedToProviderAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                createdBy: {
                    id: string;
                    name: string;
                    email: string;
                };
            }[];
            meta: object;
        }>;
    }>>;
    nameserverGroups: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                nameservers: {
                    name: string;
                    ipv4?: string | undefined;
                    ipv6?: string | undefined;
                }[];
                description?: string | undefined;
                isDefault?: boolean | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    description: string | null;
                    userId: string;
                    isDefault: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameservers: {
                        id: string;
                        name: string;
                        ipv4: string | null;
                        ipv6: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                    _count: {
                        tldSettings: number;
                        domainRegistrations: number;
                        domainTransfers: number;
                    };
                };
            };
            meta: object;
        }>;
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    description: string | null;
                    userId: string;
                    isDefault: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameservers: {
                        id: string;
                        name: string;
                        ipv4: string | null;
                        ipv6: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                    _count: {
                        tldSettings: number;
                        domainRegistrations: number;
                        domainTransfers: number;
                    };
                    tldSettings: {
                        id: string;
                        name: string;
                        marginType: string | null;
                        percentageMargin: string | null;
                        fixedMargin: string | null;
                    }[];
                };
            };
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
                search?: string | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    description: string | null;
                    userId: string;
                    isDefault: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameservers: {
                        id: string;
                        name: string;
                        ipv4: string | null;
                        ipv6: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                    _count: {
                        tldSettings: number;
                        domainRegistrations: number;
                        domainTransfers: number;
                    };
                }[];
                pagination: {
                    total: number;
                    limit: number;
                    offset: number;
                    hasMore: boolean;
                };
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                name?: string | undefined;
                description?: string | undefined;
                isDefault?: boolean | undefined;
                nameservers?: {
                    name: string;
                    id?: string | undefined;
                    ipv4?: string | undefined;
                    ipv6?: string | undefined;
                }[] | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    description: string | null;
                    userId: string;
                    isDefault: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameservers: {
                        id: string;
                        name: string;
                        ipv4: string | null;
                        ipv6: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                    _count: {
                        tldSettings: number;
                        domainRegistrations: number;
                        domainTransfers: number;
                    };
                };
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
                message: string;
            };
            meta: object;
        }>;
        setDefault: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    description: string | null;
                    userId: string;
                    isDefault: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameservers: {
                        id: string;
                        name: string;
                        ipv4: string | null;
                        ipv6: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                    _count: {
                        tldSettings: number;
                        domainRegistrations: number;
                        domainTransfers: number;
                    };
                };
            };
            meta: object;
        }>;
        getActivityLogs: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    userId: string;
                    nameserverGroupId: string;
                    action: string;
                    description: string | null;
                    metadata: any;
                    ipAddress: string | null;
                    userAgent: string | null;
                    createdAt: Date;
                }[];
                pagination: {
                    total: number;
                    limit: number;
                    offset: number;
                    hasMore: boolean;
                };
            };
            meta: object;
        }>;
    }>>;
    tldSettings: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                nameserverGroupId?: string | undefined;
                marginType?: "PERCENTAGE" | "FIXED" | undefined;
                percentageMargin?: string | undefined;
                fixedMargin?: string | undefined;
                roundOff?: string | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    userId: string;
                    nameserverGroupId: string | null;
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                    roundOff: string | null;
                    isDefault: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameserverGroup: {
                        id: string;
                        name: string;
                        description: string | null;
                        isDefault: boolean;
                        nameservers: {
                            id: string;
                            name: string;
                            ipv4: string | null;
                            ipv6: string | null;
                        }[];
                    } | null;
                    _count: {
                        activityLogs: number;
                    };
                };
            };
            meta: object;
        }>;
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    userId: string;
                    nameserverGroupId: string | null;
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                    roundOff: string | null;
                    isDefault: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameserverGroup: {
                        id: string;
                        name: string;
                        description: string | null;
                        isDefault: boolean;
                        nameservers: {
                            id: string;
                            name: string;
                            ipv4: string | null;
                            ipv6: string | null;
                        }[];
                    } | null;
                    _count: {
                        activityLogs: number;
                    };
                };
            };
            meta: object;
        }>;
        getDefault: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    userId: string;
                    nameserverGroupId: string | null;
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                    roundOff: string | null;
                    isDefault: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameserverGroup: {
                        id: string;
                        name: string;
                        description: string | null;
                        isDefault: boolean;
                        nameservers: {
                            id: string;
                            name: string;
                            ipv4: string | null;
                            ipv6: string | null;
                        }[];
                    } | null;
                    _count: {
                        activityLogs: number;
                    };
                } | null;
            };
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
                search?: string | undefined;
                marginType?: "PERCENTAGE" | "FIXED" | undefined;
                nameserverGroupId?: string | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    userId: string;
                    nameserverGroupId: string | null;
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                    roundOff: string | null;
                    isDefault: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameserverGroup: {
                        id: string;
                        name: string;
                        description: string | null;
                        isDefault: boolean;
                        nameservers: {
                            id: string;
                            name: string;
                            ipv4: string | null;
                            ipv6: string | null;
                        }[];
                    } | null;
                    _count: {
                        activityLogs: number;
                    };
                }[];
                pagination: {
                    total: number;
                    limit: number;
                    offset: number;
                    hasMore: boolean;
                };
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                name?: string | undefined;
                nameserverGroupId?: string | undefined;
                marginType?: "PERCENTAGE" | "FIXED" | undefined;
                percentageMargin?: string | undefined;
                fixedMargin?: string | undefined;
                roundOff?: string | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    userId: string;
                    nameserverGroupId: string | null;
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                    roundOff: string | null;
                    isDefault: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameserverGroup: {
                        id: string;
                        name: string;
                        description: string | null;
                        isDefault: boolean;
                        nameservers: {
                            id: string;
                            name: string;
                            ipv4: string | null;
                            ipv6: string | null;
                        }[];
                    } | null;
                    _count: {
                        activityLogs: number;
                    };
                };
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
                message: string;
            };
            meta: object;
        }>;
        getActivityLogs: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    userId: string;
                    tldSettingId: string;
                    action: string;
                    description: string | null;
                    metadata: any;
                    ipAddress: string | null;
                    userAgent: string | null;
                    createdAt: Date;
                }[];
                pagination: {
                    total: number;
                    limit: number;
                    offset: number;
                    hasMore: boolean;
                };
            };
            meta: object;
        }>;
        bulkDelete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                ids: string[];
            };
            output: {
                success: boolean;
                message: string;
            };
            meta: object;
        }>;
        setDefault: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    userId: string;
                    nameserverGroupId: string | null;
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                    roundOff: string | null;
                    isDefault: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameserverGroup: {
                        id: string;
                        name: string;
                        description: string | null;
                        isDefault: boolean;
                        nameservers: {
                            id: string;
                            name: string;
                            ipv4: string | null;
                            ipv6: string | null;
                        }[];
                    } | null;
                    _count: {
                        activityLogs: number;
                    };
                };
            };
            meta: object;
        }>;
    }>>;
    domains: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        linkToTeam: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainName: string;
                openProviderId: number;
                teamId: string;
                registrationDate: string | Date;
                openProviderPrice?: string | undefined;
                niscPrice?: string | undefined;
                activationDate?: string | Date | null | undefined;
                expirationDate?: string | Date | null | undefined;
                renewalDate?: string | Date | null | undefined;
                notes?: string | undefined;
            };
            output: {
                success: boolean;
                message: string;
                data: {
                    id: string;
                    domainName: string;
                    userId: string;
                    teamId: string | null;
                    openProviderId: number;
                    activationDate: Date | null;
                    expirationDate: Date | null;
                    renewalDate: Date | null;
                    registrationDate: Date;
                    openProviderPrice: string | null;
                    niscPrice: string | null;
                    notes: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    user?: {
                        id: string;
                        name: string;
                        email: string;
                    } | undefined;
                    team?: {
                        id: string;
                        name: string;
                        slug: string;
                    } | null | undefined;
                };
            };
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                domainName: string;
                userId: string;
                teamId: string | null;
                openProviderId: number;
                activationDate: Date | null;
                expirationDate: Date | null;
                renewalDate: Date | null;
                registrationDate: Date;
                openProviderPrice: string | null;
                niscPrice: string | null;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        getByDomainName: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                domainName: string;
            };
            output: {
                id: string;
                domainName: string;
                userId: string;
                teamId: string | null;
                openProviderId: number;
                activationDate: Date | null;
                expirationDate: Date | null;
                renewalDate: Date | null;
                registrationDate: Date;
                openProviderPrice: string | null;
                niscPrice: string | null;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            } | null;
            meta: object;
        }>;
        getByTeam: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                id: string;
                domainName: string;
                userId: string;
                teamId: string | null;
                openProviderId: number;
                activationDate: Date | null;
                expirationDate: Date | null;
                renewalDate: Date | null;
                registrationDate: Date;
                openProviderPrice: string | null;
                niscPrice: string | null;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            }[];
            meta: object;
        }>;
        getByUser: import("@trpc/server").TRPCQueryProcedure<{
            input: Record<string, never> | undefined;
            output: {
                id: string;
                domainName: string;
                userId: string;
                teamId: string | null;
                openProviderId: number;
                activationDate: Date | null;
                expirationDate: Date | null;
                renewalDate: Date | null;
                registrationDate: Date;
                openProviderPrice: string | null;
                niscPrice: string | null;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            }[];
            meta: object;
        }>;
        updateNotes: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                notes?: string | null | undefined;
            };
            output: {
                id: string;
                domainName: string;
                userId: string;
                teamId: string | null;
                openProviderId: number;
                activationDate: Date | null;
                expirationDate: Date | null;
                renewalDate: Date | null;
                registrationDate: Date;
                openProviderPrice: string | null;
                niscPrice: string | null;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        unlinkFromTeam: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                domainName: string;
                userId: string;
                teamId: string | null;
                openProviderId: number;
                activationDate: Date | null;
                expirationDate: Date | null;
                renewalDate: Date | null;
                registrationDate: Date;
                openProviderPrice: string | null;
                niscPrice: string | null;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        updateTeam: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                teamId: string;
                openProviderPrice?: string | undefined;
                niscPrice?: string | undefined;
                notes?: string | null | undefined;
            };
            output: {
                id: string;
                domainName: string;
                userId: string;
                teamId: string | null;
                openProviderId: number;
                activationDate: Date | null;
                expirationDate: Date | null;
                renewalDate: Date | null;
                registrationDate: Date;
                openProviderPrice: string | null;
                niscPrice: string | null;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            };
            meta: object;
        }>;
    }>>;
    currency: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getSupportedCurrencies: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                code: string;
                name: string;
                symbol: string;
            }[];
            meta: object;
        }>;
        getExchangeRates: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                baseCurrency?: string | undefined;
            };
            output: {
                success: boolean;
                data?: {
                    base: string;
                    rates: Record<string, number>;
                    timestamp: number;
                } | undefined;
                error?: string | undefined;
            };
            meta: object;
        }>;
        convertPrices: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                prices: {
                    amount: number;
                    currency: string;
                }[];
                targetCurrency: string;
            };
            output: {
                success: boolean;
                data?: {
                    originalAmount: number;
                    convertedAmount: number;
                    rate: number;
                    currency: string;
                }[] | undefined;
                error?: string | undefined;
            };
            meta: object;
        }>;
        getApiConfigStatus: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                apiKeyConfigured: boolean;
                apiTier: "free" | "paid";
                apiEndpoint: string;
                monthlyLimit: number;
            };
            meta: object;
        }>;
        getCacheStatus: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                redisConnected: boolean;
                cacheKeys: string[];
                lastFetchTime?: number | undefined;
                cacheAge?: string | undefined;
            };
            meta: object;
        }>;
        getApiUsageStatus: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                currentUsage: number;
                monthlyLimit: number;
                usagePercentage: number;
                status: "normal" | "warning" | "critical";
            };
            meta: object;
        }>;
    }>>;
    teams: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                baseCurrency: string;
                inviteEmails?: string[] | undefined;
            };
            output: {
                success: boolean;
                team: {
                    id: string;
                    name: string;
                    slug: string;
                    baseCurrency: string;
                };
            };
            meta: object;
        }>;
        getInviteByCode: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                code: string;
            };
            output: {
                valid: boolean;
                invite?: {
                    id: string;
                    email: string;
                    role: "MEMBER" | "OWNER" | "ADMIN" | "VIEWER";
                    status: "PENDING" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
                    expiresAt: Date;
                    team: {
                        id: string;
                        name: string;
                        logoUrl: string | null;
                    };
                } | undefined;
                error?: string | undefined;
            };
            meta: object;
        }>;
        acceptInvite: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                code: string;
            };
            output: {
                success: boolean;
                teamId?: string | undefined;
                teamSlug?: string | undefined;
                error?: string | undefined;
            };
            meta: object;
        }>;
        getUserTeams: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                name: string;
                slug: string;
                baseCurrency: string;
                logoUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                role: "MEMBER" | "OWNER" | "ADMIN" | "VIEWER";
                memberCount: number;
            }[];
            meta: object;
        }>;
        checkSlugAvailable: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                slug: string;
            };
            output: {
                available: boolean;
            };
            meta: object;
        }>;
        updateLastAccessedTeam: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                teamId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                name: string;
                slug: string;
                baseCurrency: string;
                logoUrl: string | null;
                isActive: boolean;
                createdById: string;
                createdAt: Date;
                updatedAt: Date;
                memberCount: number;
            }[];
            meta: object;
        }>;
        getTeamIdBySlug: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                slug: string;
            };
            output: {
                id: string;
                name: string;
                slug: string;
            };
            meta: object;
        }>;
        getMembersAsMember: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                id: string;
                userId: string;
                role: "MEMBER" | "OWNER" | "ADMIN" | "VIEWER";
                createdAt: Date;
                updatedAt: Date;
                userName: string | null;
                userEmail: string | null;
            }[];
            meta: object;
        }>;
        getInvitesAsMember: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                id: string;
                email: string;
                role: "MEMBER" | "OWNER" | "ADMIN" | "VIEWER";
                status: "PENDING" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
                invitedById: string;
                expiresAt: Date;
                acceptedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                id: string;
                name: string;
                slug: string;
                baseCurrency: string;
                logoUrl: string | null;
                isActive: boolean;
                createdById: string;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        getMembers: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                id: string;
                userId: string;
                role: "MEMBER" | "OWNER" | "ADMIN" | "VIEWER";
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        getInvites: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                id: string;
                email: string;
                role: "MEMBER" | "OWNER" | "ADMIN" | "VIEWER";
                status: "PENDING" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
                invitedById: string;
                expiresAt: Date;
                acceptedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        getHostingSubscriptions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                id: string;
                hostingPlanId: string;
                primaryDomain: string | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                autoRenew: boolean;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING";
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                teamId: string;
                name?: string | undefined;
                baseCurrency?: string | undefined;
                logoUrl?: string | null | undefined;
                isActive?: boolean | undefined;
            };
            output: {
                id: string;
                name: string;
                slug: string;
                baseCurrency: string;
                logoUrl: string | null;
                isActive: boolean;
                createdById: string;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                teamId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        inviteMember: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                teamId: string;
                email: string;
                role?: "MEMBER" | "OWNER" | "ADMIN" | "VIEWER" | undefined;
            };
            output: {
                success: boolean;
                inviteId: string;
            };
            meta: object;
        }>;
        removeMember: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                teamId: string;
                memberId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        deleteInvite: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                inviteId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
    userProfile: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getUserInfo: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                image: string | null;
                role: "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
                status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
                lastLoginAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                profile: {
                    firstName: string | null;
                    lastName: string | null;
                    phone: string | null;
                    address: string | null;
                    city: string | null;
                    state: string | null;
                    country: string | null;
                    postalCode: string | null;
                } | null;
            };
            meta: object;
        }>;
        updateProfile: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name?: string | undefined;
                firstName?: string | undefined;
                lastName?: string | undefined;
                phone?: string | undefined;
                address?: string | undefined;
                city?: string | undefined;
                state?: string | undefined;
                country?: string | undefined;
                postalCode?: string | undefined;
            };
            output: {
                success: boolean;
                message?: string | undefined;
            };
            meta: object;
        }>;
        getSessions: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                token: string;
                ipAddress: string | null;
                userAgent: string | null;
                createdAt: Date;
                updatedAt: Date;
                expiresAt: Date;
                isCurrent: boolean;
            }[];
            meta: object;
        }>;
        revokeSession: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                sessionId: string;
            };
            output: {
                success: boolean;
                message?: string | undefined;
            };
            meta: object;
        }>;
        getUserById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: string;
                fields?: ("id" | "name" | "createdAt" | "updatedAt" | "email" | "emailVerified" | "role" | "status" | "lastLoginAt" | "image" | "profile")[] | undefined;
            };
            output: Record<string, unknown>;
            meta: object;
        }>;
        getUsersByIds: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userIds: string[];
                fields?: ("id" | "name" | "createdAt" | "updatedAt" | "email" | "emailVerified" | "role" | "status" | "lastLoginAt" | "image" | "profile")[] | undefined;
            };
            output: Record<string, any>;
            meta: object;
        }>;
    }>>;
    creativeAssets: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                teamId: string;
                name: string;
                description?: string | undefined;
                category?: string | undefined;
                status?: "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED" | undefined;
            };
            output: {
                id: string;
                teamId: string;
                name: string;
                description: string | null;
                category: string | null;
                status: string;
                currentInternalVersion: number | null;
                currentPublicVersion: number | null;
                isPublic: boolean;
                createdBy: string;
                lastModifiedBy: string;
                createdAt: Date;
                updatedAt: Date;
                team: {
                    id: string;
                    name: string;
                    slug: string;
                };
            };
            meta: object;
        }>;
        uploadVersion: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                creativeAssetId: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileMetadata?: Record<string, unknown> | undefined;
                versionNotes?: string | undefined;
                changesSummary?: string | undefined;
            };
            output: {
                id: string;
                creativeAssetId: string;
                internalVersionNumber: number;
                publicVersionNumber: number | null;
                isPublic: boolean;
                internalApprovalStatus: string;
                publicApprovalStatus: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                versionNotes: string | null;
                changesSummary: string | null;
                previousVersionId: string | null;
                createdBy: string;
                internalApprovedBy: string | null;
                internalApprovedAt: Date | null;
                internalRejectedBy: string | null;
                internalRejectedAt: Date | null;
                internalRejectionReason: string | null;
                publicApprovedBy: string | null;
                publicApprovedAt: Date | null;
                publicRejectedBy: string | null;
                publicRejectedAt: Date | null;
                publicRejectionReason: string | null;
                madePublicBy: string | null;
                madePublicAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        approveVersionInternally: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                versionId: string;
            };
            output: {
                id: string;
                creativeAssetId: string;
                internalVersionNumber: number;
                publicVersionNumber: number | null;
                isPublic: boolean;
                internalApprovalStatus: string;
                publicApprovalStatus: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                versionNotes: string | null;
                changesSummary: string | null;
                previousVersionId: string | null;
                createdBy: string;
                internalApprovedBy: string | null;
                internalApprovedAt: Date | null;
                internalRejectedBy: string | null;
                internalRejectedAt: Date | null;
                internalRejectionReason: string | null;
                publicApprovedBy: string | null;
                publicApprovedAt: Date | null;
                publicRejectedBy: string | null;
                publicRejectedAt: Date | null;
                publicRejectionReason: string | null;
                madePublicBy: string | null;
                madePublicAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        rejectVersionInternally: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                versionId: string;
                rejectionReason?: string | undefined;
            };
            output: {
                id: string;
                creativeAssetId: string;
                internalVersionNumber: number;
                publicVersionNumber: number | null;
                isPublic: boolean;
                internalApprovalStatus: string;
                publicApprovalStatus: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                versionNotes: string | null;
                changesSummary: string | null;
                previousVersionId: string | null;
                createdBy: string;
                internalApprovedBy: string | null;
                internalApprovedAt: Date | null;
                internalRejectedBy: string | null;
                internalRejectedAt: Date | null;
                internalRejectionReason: string | null;
                publicApprovedBy: string | null;
                publicApprovedAt: Date | null;
                publicRejectedBy: string | null;
                publicRejectedAt: Date | null;
                publicRejectionReason: string | null;
                madePublicBy: string | null;
                madePublicAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        makeVersionPublic: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                versionId: string;
            };
            output: {
                id: string;
                creativeAssetId: string;
                internalVersionNumber: number;
                publicVersionNumber: number | null;
                isPublic: boolean;
                internalApprovalStatus: string;
                publicApprovalStatus: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                versionNotes: string | null;
                changesSummary: string | null;
                previousVersionId: string | null;
                createdBy: string;
                internalApprovedBy: string | null;
                internalApprovedAt: Date | null;
                internalRejectedBy: string | null;
                internalRejectedAt: Date | null;
                internalRejectionReason: string | null;
                publicApprovedBy: string | null;
                publicApprovedAt: Date | null;
                publicRejectedBy: string | null;
                publicRejectedAt: Date | null;
                publicRejectionReason: string | null;
                madePublicBy: string | null;
                madePublicAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        approveVersionPublicly: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                versionId: string;
            };
            output: {
                id: string;
                creativeAssetId: string;
                internalVersionNumber: number;
                publicVersionNumber: number | null;
                isPublic: boolean;
                internalApprovalStatus: string;
                publicApprovalStatus: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                versionNotes: string | null;
                changesSummary: string | null;
                previousVersionId: string | null;
                createdBy: string;
                internalApprovedBy: string | null;
                internalApprovedAt: Date | null;
                internalRejectedBy: string | null;
                internalRejectedAt: Date | null;
                internalRejectionReason: string | null;
                publicApprovedBy: string | null;
                publicApprovedAt: Date | null;
                publicRejectedBy: string | null;
                publicRejectedAt: Date | null;
                publicRejectionReason: string | null;
                madePublicBy: string | null;
                madePublicAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        rejectVersionPublicly: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                versionId: string;
                rejectionReason?: string | undefined;
            };
            output: {
                id: string;
                creativeAssetId: string;
                internalVersionNumber: number;
                publicVersionNumber: number | null;
                isPublic: boolean;
                internalApprovalStatus: string;
                publicApprovalStatus: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                versionNotes: string | null;
                changesSummary: string | null;
                previousVersionId: string | null;
                createdBy: string;
                internalApprovedBy: string | null;
                internalApprovedAt: Date | null;
                internalRejectedBy: string | null;
                internalRejectedAt: Date | null;
                internalRejectionReason: string | null;
                publicApprovedBy: string | null;
                publicApprovedAt: Date | null;
                publicRejectedBy: string | null;
                publicRejectedAt: Date | null;
                publicRejectionReason: string | null;
                madePublicBy: string | null;
                madePublicAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        updateVersionStatus: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                versionId: string;
                status: "PENDING" | "NOT_APPLICABLE" | "APPROVED" | "REJECTED";
            };
            output: {
                id: string;
                creativeAssetId: string;
                internalVersionNumber: number;
                publicVersionNumber: number | null;
                isPublic: boolean;
                internalApprovalStatus: string;
                publicApprovalStatus: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                versionNotes: string | null;
                changesSummary: string | null;
                previousVersionId: string | null;
                createdBy: string;
                internalApprovedBy: string | null;
                internalApprovedAt: Date | null;
                internalRejectedBy: string | null;
                internalRejectedAt: Date | null;
                internalRejectionReason: string | null;
                publicApprovedBy: string | null;
                publicApprovedAt: Date | null;
                publicRejectedBy: string | null;
                publicRejectedAt: Date | null;
                publicRejectionReason: string | null;
                madePublicBy: string | null;
                madePublicAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        makeVersionPrivate: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                versionId: string;
            };
            output: {
                id: string;
                creativeAssetId: string;
                internalVersionNumber: number;
                publicVersionNumber: number | null;
                isPublic: boolean;
                internalApprovalStatus: string;
                publicApprovalStatus: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                versionNotes: string | null;
                changesSummary: string | null;
                previousVersionId: string | null;
                createdBy: string;
                internalApprovedBy: string | null;
                internalApprovedAt: Date | null;
                internalRejectedBy: string | null;
                internalRejectedAt: Date | null;
                internalRejectionReason: string | null;
                publicApprovedBy: string | null;
                publicApprovedAt: Date | null;
                publicRejectedBy: string | null;
                publicRejectedAt: Date | null;
                publicRejectionReason: string | null;
                madePublicBy: string | null;
                madePublicAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        getByTeam: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                id: string;
                teamId: string;
                name: string;
                description: string | null;
                category: string | null;
                status: string;
                currentInternalVersion: number | null;
                currentPublicVersion: number | null;
                isPublic: boolean;
                createdBy: string;
                lastModifiedBy: string;
                createdAt: Date;
                updatedAt: Date;
                team: {
                    id: string;
                    name: string;
                    slug: string;
                };
                versions?: {
                    id: string;
                    creativeAssetId: string;
                    internalVersionNumber: number;
                    publicVersionNumber: number | null;
                    isPublic: boolean;
                    internalApprovalStatus: string;
                    publicApprovalStatus: string;
                    fileUrl: string;
                    fileKey: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    versionNotes: string | null;
                    changesSummary: string | null;
                    previousVersionId: string | null;
                    createdBy: string;
                    internalApprovedBy: string | null;
                    internalApprovedAt: Date | null;
                    internalRejectedBy: string | null;
                    internalRejectedAt: Date | null;
                    internalRejectionReason: string | null;
                    publicApprovedBy: string | null;
                    publicApprovedAt: Date | null;
                    publicRejectedBy: string | null;
                    publicRejectedAt: Date | null;
                    publicRejectionReason: string | null;
                    madePublicBy: string | null;
                    madePublicAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
                permissions?: {
                    id: string;
                    creativeAssetId: string;
                    userId: string;
                    canView: boolean;
                    canEdit: boolean;
                    canComment: boolean;
                    canApprove: boolean;
                    canPublish: boolean;
                    canDelete: boolean;
                    grantedBy: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
                _count?: {
                    versions: number;
                } | undefined;
            }[];
            meta: object;
        }>;
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                teamId: string;
                name: string;
                description: string | null;
                category: string | null;
                status: string;
                currentInternalVersion: number | null;
                currentPublicVersion: number | null;
                isPublic: boolean;
                createdBy: string;
                lastModifiedBy: string;
                createdAt: Date;
                updatedAt: Date;
                team: {
                    id: string;
                    name: string;
                    slug: string;
                };
                versions?: {
                    id: string;
                    creativeAssetId: string;
                    internalVersionNumber: number;
                    publicVersionNumber: number | null;
                    isPublic: boolean;
                    internalApprovalStatus: string;
                    publicApprovalStatus: string;
                    fileUrl: string;
                    fileKey: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    versionNotes: string | null;
                    changesSummary: string | null;
                    previousVersionId: string | null;
                    createdBy: string;
                    internalApprovedBy: string | null;
                    internalApprovedAt: Date | null;
                    internalRejectedBy: string | null;
                    internalRejectedAt: Date | null;
                    internalRejectionReason: string | null;
                    publicApprovedBy: string | null;
                    publicApprovedAt: Date | null;
                    publicRejectedBy: string | null;
                    publicRejectedAt: Date | null;
                    publicRejectionReason: string | null;
                    madePublicBy: string | null;
                    madePublicAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
                permissions?: {
                    id: string;
                    creativeAssetId: string;
                    userId: string;
                    canView: boolean;
                    canEdit: boolean;
                    canComment: boolean;
                    canApprove: boolean;
                    canPublish: boolean;
                    canDelete: boolean;
                    grantedBy: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
                _count?: {
                    versions: number;
                } | undefined;
            }[];
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                teamId: string;
                name: string;
                description: string | null;
                category: string | null;
                status: string;
                currentInternalVersion: number | null;
                currentPublicVersion: number | null;
                isPublic: boolean;
                createdBy: string;
                lastModifiedBy: string;
                createdAt: Date;
                updatedAt: Date;
                team: {
                    id: string;
                    name: string;
                    slug: string;
                    members?: {
                        userId: string;
                    }[] | undefined;
                };
                versions?: {
                    id: string;
                    creativeAssetId: string;
                    internalVersionNumber: number;
                    publicVersionNumber: number | null;
                    isPublic: boolean;
                    internalApprovalStatus: string;
                    publicApprovalStatus: string;
                    fileUrl: string;
                    fileKey: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    versionNotes: string | null;
                    changesSummary: string | null;
                    previousVersionId: string | null;
                    createdBy: string;
                    internalApprovedBy: string | null;
                    internalApprovedAt: Date | null;
                    internalRejectedBy: string | null;
                    internalRejectedAt: Date | null;
                    internalRejectionReason: string | null;
                    publicApprovedBy: string | null;
                    publicApprovedAt: Date | null;
                    publicRejectedBy: string | null;
                    publicRejectedAt: Date | null;
                    publicRejectionReason: string | null;
                    madePublicBy: string | null;
                    madePublicAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
                permissions?: {
                    id: string;
                    creativeAssetId: string;
                    userId: string;
                    canView: boolean;
                    canEdit: boolean;
                    canComment: boolean;
                    canApprove: boolean;
                    canPublish: boolean;
                    canDelete: boolean;
                    grantedBy: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
            };
            meta: object;
        }>;
        addComment: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                versionId: string;
                content: string;
                isInternal: boolean;
                parentCommentId?: string | undefined;
                mentions?: string[] | undefined;
            };
            output: {
                id: string;
                creativeAssetVersionId: string;
                userId: string;
                content: string;
                isInternal: boolean;
                parentCommentId: string | null;
                mentions: string[];
                replyCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        getComments: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                versionId: string;
            };
            output: {
                id: string;
                creativeAssetVersionId: string;
                userId: string;
                content: string;
                isInternal: boolean;
                parentCommentId: string | null;
                mentions: string[];
                replyCount: number;
                createdAt: Date;
                updatedAt: Date;
                replies?: {
                    id: string;
                    creativeAssetVersionId: string;
                    userId: string;
                    content: string;
                    isInternal: boolean;
                    parentCommentId: string | null;
                    mentions: string[];
                    replyCount: number;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
            }[];
            meta: object;
        }>;
        updateComment: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                commentId: string;
                content: string;
            };
            output: {
                id: string;
                creativeAssetVersionId: string;
                userId: string;
                content: string;
                isInternal: boolean;
                parentCommentId: string | null;
                mentions: string[];
                replyCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        deleteComment: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                commentId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        grantPermissions: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                creativeAssetId: string;
                userId: string;
                permissions: {
                    canView?: boolean | undefined;
                    canEdit?: boolean | undefined;
                    canComment?: boolean | undefined;
                    canApprove?: boolean | undefined;
                    canPublish?: boolean | undefined;
                    canDelete?: boolean | undefined;
                };
            };
            output: {
                id: string;
                creativeAssetId: string;
                userId: string;
                canView: boolean;
                canEdit: boolean;
                canComment: boolean;
                canApprove: boolean;
                canPublish: boolean;
                canDelete: boolean;
                grantedBy: string;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                name?: string | undefined;
                description?: string | undefined;
                category?: string | undefined;
                status?: "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED" | undefined;
                teamId?: string | undefined;
            };
            output: {
                id: string;
                teamId: string;
                name: string;
                description: string | null;
                category: string | null;
                status: string;
                currentInternalVersion: number | null;
                currentPublicVersion: number | null;
                isPublic: boolean;
                createdBy: string;
                lastModifiedBy: string;
                createdAt: Date;
                updatedAt: Date;
                team: {
                    id: string;
                    name: string;
                    slug: string;
                };
            };
            meta: object;
        }>;
        archive: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                teamId: string;
                name: string;
                description: string | null;
                category: string | null;
                status: string;
                currentInternalVersion: number | null;
                currentPublicVersion: number | null;
                isPublic: boolean;
                createdBy: string;
                lastModifiedBy: string;
                createdAt: Date;
                updatedAt: Date;
                team: {
                    id: string;
                    name: string;
                    slug: string;
                };
            };
            meta: object;
        }>;
        unarchive: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                teamId: string;
                name: string;
                description: string | null;
                category: string | null;
                status: string;
                currentInternalVersion: number | null;
                currentPublicVersion: number | null;
                isPublic: boolean;
                createdBy: string;
                lastModifiedBy: string;
                createdAt: Date;
                updatedAt: Date;
                team: {
                    id: string;
                    name: string;
                    slug: string;
                };
            };
            meta: object;
        }>;
    }>>;
    creativeBriefs: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                name: string;
                userId: string;
                teamId: string | null;
                status: "DRAFT" | "APPROVED" | "REJECTED" | "REVIEWING";
                background: string;
                objectives: string;
                requirements: string;
                comments: string | null;
                style: string | null;
                copy: string | null;
                mandatoryElements: string | null;
                designPreference: string | null;
                approverUserId: string | null;
                approvedBy: string | null;
                approvedAt: Date | null;
                rejectedBy: string | null;
                rejectedAt: Date | null;
                timelineStartDate: Date | null;
                timelineEndDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                approver?: {
                    id: string;
                    name: string;
                    email: string;
                } | null | undefined;
                referenceImages?: {
                    id: string;
                    creativeBriefId: string;
                    fileUrl: string;
                    fileKey: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileMetadata: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
            }[];
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                name: string;
                userId: string;
                teamId: string | null;
                status: "DRAFT" | "APPROVED" | "REJECTED" | "REVIEWING";
                background: string;
                objectives: string;
                requirements: string;
                comments: string | null;
                style: string | null;
                copy: string | null;
                mandatoryElements: string | null;
                designPreference: string | null;
                approverUserId: string | null;
                approvedBy: string | null;
                approvedAt: Date | null;
                rejectedBy: string | null;
                rejectedAt: Date | null;
                timelineStartDate: Date | null;
                timelineEndDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                approver?: {
                    id: string;
                    name: string;
                    email: string;
                } | null | undefined;
                referenceImages?: {
                    id: string;
                    creativeBriefId: string;
                    fileUrl: string;
                    fileKey: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileMetadata: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
            };
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                background: string;
                objectives: string;
                requirements: string;
                timelineStartDate: unknown;
                timelineEndDate: unknown;
                teamId?: string | undefined;
                approverUserId?: string | undefined;
                comments?: string | undefined;
                style?: string | undefined;
                copy?: string | undefined;
                mandatoryElements?: string | undefined;
                designPreference?: string | undefined;
                referenceImages?: {
                    fileUrl: string;
                    fileKey: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileMetadata?: unknown;
                }[] | undefined;
            };
            output: {
                id: string;
                name: string;
                userId: string;
                teamId: string | null;
                status: "DRAFT" | "APPROVED" | "REJECTED" | "REVIEWING";
                background: string;
                objectives: string;
                requirements: string;
                comments: string | null;
                style: string | null;
                copy: string | null;
                mandatoryElements: string | null;
                designPreference: string | null;
                approverUserId: string | null;
                approvedBy: string | null;
                approvedAt: Date | null;
                rejectedBy: string | null;
                rejectedAt: Date | null;
                timelineStartDate: Date | null;
                timelineEndDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                approver?: {
                    id: string;
                    name: string;
                    email: string;
                } | null | undefined;
                referenceImages?: {
                    id: string;
                    creativeBriefId: string;
                    fileUrl: string;
                    fileKey: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileMetadata: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                timelineStartDate: unknown;
                timelineEndDate: unknown;
                name?: string | undefined;
                teamId?: string | undefined;
                background?: string | undefined;
                objectives?: string | undefined;
                requirements?: string | undefined;
                comments?: string | undefined;
                style?: string | undefined;
                copy?: string | undefined;
                mandatoryElements?: string | undefined;
                designPreference?: string | undefined;
                referenceImages?: {
                    fileUrl: string;
                    fileKey: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileMetadata?: unknown;
                }[] | undefined;
            };
            output: {
                id: string;
                name: string;
                userId: string;
                teamId: string | null;
                status: "DRAFT" | "APPROVED" | "REJECTED" | "REVIEWING";
                background: string;
                objectives: string;
                requirements: string;
                comments: string | null;
                style: string | null;
                copy: string | null;
                mandatoryElements: string | null;
                designPreference: string | null;
                approverUserId: string | null;
                approvedBy: string | null;
                approvedAt: Date | null;
                rejectedBy: string | null;
                rejectedAt: Date | null;
                timelineStartDate: Date | null;
                timelineEndDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                approver?: {
                    id: string;
                    name: string;
                    email: string;
                } | null | undefined;
                referenceImages?: {
                    id: string;
                    creativeBriefId: string;
                    fileUrl: string;
                    fileKey: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileMetadata: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
            };
            meta: object;
        }>;
        updateStatus: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                status: "DRAFT" | "APPROVED" | "REJECTED" | "REVIEWING";
                comment?: string | undefined;
            };
            output: {
                id: string;
                name: string;
                userId: string;
                teamId: string | null;
                status: "DRAFT" | "APPROVED" | "REJECTED" | "REVIEWING";
                background: string;
                objectives: string;
                requirements: string;
                comments: string | null;
                style: string | null;
                copy: string | null;
                mandatoryElements: string | null;
                designPreference: string | null;
                approverUserId: string | null;
                approvedBy: string | null;
                approvedAt: Date | null;
                rejectedBy: string | null;
                rejectedAt: Date | null;
                timelineStartDate: Date | null;
                timelineEndDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                approver?: {
                    id: string;
                    name: string;
                    email: string;
                } | null | undefined;
                referenceImages?: {
                    id: string;
                    creativeBriefId: string;
                    fileUrl: string;
                    fileKey: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileMetadata: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
            };
            meta: object;
        }>;
        listUsersForApprover: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                name: string;
                email: string;
            }[];
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
    notifications: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId?: string | undefined;
                teamId?: string | undefined;
                seen?: boolean | undefined;
                type?: "GENERAL" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "DOMAIN" | "HOSTING" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN" | undefined;
                priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
                since?: string | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                id: string;
                userId: string;
                teamId: string | null;
                type: "GENERAL" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "DOMAIN" | "HOSTING" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                title: string | null;
                message: string;
                link: string | null;
                metadata: unknown;
                seen: boolean;
                readAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            }[];
            meta: object;
        }>;
        getUnseenCount: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId?: string | undefined;
                teamId?: string | undefined;
            } | undefined;
            output: {
                count: number;
            };
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                userId: string;
                teamId: string | null;
                type: "GENERAL" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "DOMAIN" | "HOSTING" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                title: string | null;
                message: string;
                link: string | null;
                metadata: unknown;
                seen: boolean;
                readAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                message: string;
                teamId?: string | undefined;
                type?: "GENERAL" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "DOMAIN" | "HOSTING" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN" | undefined;
                priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
                title?: string | undefined;
                link?: string | undefined;
                metadata?: unknown;
            };
            output: {
                id: string;
                userId: string;
                teamId: string | null;
                type: "GENERAL" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "DOMAIN" | "HOSTING" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                title: string | null;
                message: string;
                link: string | null;
                metadata: unknown;
                seen: boolean;
                readAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                title?: string | undefined;
                message?: string | undefined;
                link?: string | undefined;
                metadata?: unknown;
                priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
            };
            output: {
                id: string;
                userId: string;
                teamId: string | null;
                type: "GENERAL" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "DOMAIN" | "HOSTING" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                title: string | null;
                message: string;
                link: string | null;
                metadata: unknown;
                seen: boolean;
                readAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        markAsSeen: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                userId: string;
                teamId: string | null;
                type: "GENERAL" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "DOMAIN" | "HOSTING" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                title: string | null;
                message: string;
                link: string | null;
                metadata: unknown;
                seen: boolean;
                readAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        markAsUnseen: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                userId: string;
                teamId: string | null;
                type: "GENERAL" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "DOMAIN" | "HOSTING" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                title: string | null;
                message: string;
                link: string | null;
                metadata: unknown;
                seen: boolean;
                readAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                user?: {
                    id: string;
                    name: string;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        markAllAsSeen: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId?: string | undefined;
                teamId?: string | undefined;
            };
            output: {
                count: number;
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
    tickets: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getList: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId?: string | undefined;
                assignedToId?: string | undefined;
                status?: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED" | undefined;
                priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
                type?: "GENERAL" | "DOMAIN" | "HOSTING" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "EMAIL" | "WORDPRESS" | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                id: string;
                ticketNumber: string;
                lastMessage: string | null;
                lastMessageAt: Date | null;
                unreadCount: number;
                status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                customerName?: string | undefined;
                assignedToName?: string | null | undefined;
            }[];
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                ticketNumber: string;
                subject: string | null;
                description: string | null;
                type: "GENERAL" | "DOMAIN" | "HOSTING" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "EMAIL" | "WORDPRESS";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
                source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
                createdById: string;
                teamId: string | null;
                assignedToId: string | null;
                lastMessageId: string | null;
                lastMessageAt: Date | null;
                lastMessagePreview: string | null;
                unreadCount: number;
                customerUnreadCount: number;
                metadata: unknown;
                internalNotes: string | null;
                createdAt: Date;
                updatedAt: Date;
                resolvedAt: Date | null;
                closedAt: Date | null;
                firstResponseAt: Date | null;
                lastResponseAt: Date | null;
                lastCustomerResponseAt: Date | null;
                lastAgentResponseAt: Date | null;
                createdBy?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                assignedTo?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subject?: string | undefined;
                description?: string | undefined;
                type?: "GENERAL" | "DOMAIN" | "HOSTING" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "EMAIL" | "WORDPRESS" | undefined;
                priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
                source?: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE" | undefined;
                teamId?: string | undefined;
                metadata?: unknown;
            };
            output: {
                id: string;
                ticketNumber: string;
                subject: string | null;
                description: string | null;
                type: "GENERAL" | "DOMAIN" | "HOSTING" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "EMAIL" | "WORDPRESS";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
                source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
                createdById: string;
                teamId: string | null;
                assignedToId: string | null;
                lastMessageId: string | null;
                lastMessageAt: Date | null;
                lastMessagePreview: string | null;
                unreadCount: number;
                customerUnreadCount: number;
                metadata: unknown;
                internalNotes: string | null;
                createdAt: Date;
                updatedAt: Date;
                resolvedAt: Date | null;
                closedAt: Date | null;
                firstResponseAt: Date | null;
                lastResponseAt: Date | null;
                lastCustomerResponseAt: Date | null;
                lastAgentResponseAt: Date | null;
                createdBy?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                assignedTo?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                subject?: string | undefined;
                description?: string | undefined;
                type?: "GENERAL" | "DOMAIN" | "HOSTING" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "EMAIL" | "WORDPRESS" | undefined;
                priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
                status?: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED" | undefined;
                assignedToId?: string | null | undefined;
                internalNotes?: string | undefined;
                metadata?: unknown;
            };
            output: {
                id: string;
                ticketNumber: string;
                subject: string | null;
                description: string | null;
                type: "GENERAL" | "DOMAIN" | "HOSTING" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "EMAIL" | "WORDPRESS";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
                source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
                createdById: string;
                teamId: string | null;
                assignedToId: string | null;
                lastMessageId: string | null;
                lastMessageAt: Date | null;
                lastMessagePreview: string | null;
                unreadCount: number;
                customerUnreadCount: number;
                metadata: unknown;
                internalNotes: string | null;
                createdAt: Date;
                updatedAt: Date;
                resolvedAt: Date | null;
                closedAt: Date | null;
                firstResponseAt: Date | null;
                lastResponseAt: Date | null;
                lastCustomerResponseAt: Date | null;
                lastAgentResponseAt: Date | null;
                createdBy?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                assignedTo?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        getMessages: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                ticketId: string;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                messages: {
                    id: string;
                    ticketId: string;
                    senderId: string;
                    content: string;
                    isInternal: boolean;
                    isSystem: boolean;
                    readStatus: "SENT" | "DELIVERED" | "READ";
                    readAt: Date | null;
                    metadata: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                    editedAt: Date | null;
                    deletedAt: Date | null;
                    sender?: {
                        id: string;
                        name: string | null;
                        email: string;
                    } | undefined;
                    attachments?: {
                        id: string;
                        fileName: string;
                        fileSize: number;
                        mimeType: string;
                        fileUrl: string;
                    }[] | undefined;
                }[];
                total: number;
            };
            meta: object;
        }>;
        createMessage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                ticketId: string;
                content: string;
                isInternal?: boolean | undefined;
                attachments?: {
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileUrl: string;
                    storageKey?: string | undefined;
                }[] | undefined;
            };
            output: {
                id: string;
                ticketId: string;
                senderId: string;
                content: string;
                isInternal: boolean;
                isSystem: boolean;
                readStatus: "SENT" | "DELIVERED" | "READ";
                readAt: Date | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
                editedAt: Date | null;
                deletedAt: Date | null;
                sender?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | undefined;
                attachments?: {
                    id: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileUrl: string;
                }[] | undefined;
            };
            meta: object;
        }>;
        markMessageRead: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                messageId: string;
                readStatus: "SENT" | "DELIVERED" | "READ";
            };
            output: {
                id: string;
                ticketId: string;
                senderId: string;
                content: string;
                isInternal: boolean;
                isSystem: boolean;
                readStatus: "SENT" | "DELIVERED" | "READ";
                readAt: Date | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
                editedAt: Date | null;
                deletedAt: Date | null;
                sender?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | undefined;
                attachments?: {
                    id: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileUrl: string;
                }[] | undefined;
            };
            meta: object;
        }>;
        assign: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                ticketId: string;
                assignedToId: string | null;
            };
            output: {
                id: string;
                ticketNumber: string;
                subject: string | null;
                description: string | null;
                type: "GENERAL" | "DOMAIN" | "HOSTING" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "EMAIL" | "WORDPRESS";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
                source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
                createdById: string;
                teamId: string | null;
                assignedToId: string | null;
                lastMessageId: string | null;
                lastMessageAt: Date | null;
                lastMessagePreview: string | null;
                unreadCount: number;
                customerUnreadCount: number;
                metadata: unknown;
                internalNotes: string | null;
                createdAt: Date;
                updatedAt: Date;
                resolvedAt: Date | null;
                closedAt: Date | null;
                firstResponseAt: Date | null;
                lastResponseAt: Date | null;
                lastCustomerResponseAt: Date | null;
                lastAgentResponseAt: Date | null;
                createdBy?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                assignedTo?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        updateStatus: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                ticketId: string;
                status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
            };
            output: {
                id: string;
                ticketNumber: string;
                subject: string | null;
                description: string | null;
                type: "GENERAL" | "DOMAIN" | "HOSTING" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "EMAIL" | "WORDPRESS";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
                source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
                createdById: string;
                teamId: string | null;
                assignedToId: string | null;
                lastMessageId: string | null;
                lastMessageAt: Date | null;
                lastMessagePreview: string | null;
                unreadCount: number;
                customerUnreadCount: number;
                metadata: unknown;
                internalNotes: string | null;
                createdAt: Date;
                updatedAt: Date;
                resolvedAt: Date | null;
                closedAt: Date | null;
                firstResponseAt: Date | null;
                lastResponseAt: Date | null;
                lastCustomerResponseAt: Date | null;
                lastAgentResponseAt: Date | null;
                createdBy?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                assignedTo?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        archive: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                ticketId: string;
            };
            output: {
                id: string;
                ticketNumber: string;
                subject: string | null;
                description: string | null;
                type: "GENERAL" | "DOMAIN" | "HOSTING" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "EMAIL" | "WORDPRESS";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
                source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
                createdById: string;
                teamId: string | null;
                assignedToId: string | null;
                lastMessageId: string | null;
                lastMessageAt: Date | null;
                lastMessagePreview: string | null;
                unreadCount: number;
                customerUnreadCount: number;
                metadata: unknown;
                internalNotes: string | null;
                createdAt: Date;
                updatedAt: Date;
                resolvedAt: Date | null;
                closedAt: Date | null;
                firstResponseAt: Date | null;
                lastResponseAt: Date | null;
                lastCustomerResponseAt: Date | null;
                lastAgentResponseAt: Date | null;
                createdBy?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                assignedTo?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | null | undefined;
            };
            meta: object;
        }>;
        markAllTicketMessagesAsRead: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                ticketId: string;
            };
            output: {
                markedCount: number;
                ticket: {
                    id: string;
                    ticketNumber: string;
                    subject: string | null;
                    description: string | null;
                    type: "GENERAL" | "DOMAIN" | "HOSTING" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "EMAIL" | "WORDPRESS";
                    priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                    status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
                    source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
                    createdById: string;
                    teamId: string | null;
                    assignedToId: string | null;
                    lastMessageId: string | null;
                    lastMessageAt: Date | null;
                    lastMessagePreview: string | null;
                    unreadCount: number;
                    customerUnreadCount: number;
                    metadata: unknown;
                    internalNotes: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    resolvedAt: Date | null;
                    closedAt: Date | null;
                    firstResponseAt: Date | null;
                    lastResponseAt: Date | null;
                    lastCustomerResponseAt: Date | null;
                    lastAgentResponseAt: Date | null;
                    createdBy?: {
                        id: string;
                        name: string | null;
                        email: string;
                    } | undefined;
                    team?: {
                        id: string;
                        name: string;
                        slug: string;
                    } | null | undefined;
                    assignedTo?: {
                        id: string;
                        name: string | null;
                        email: string;
                    } | null | undefined;
                };
            };
            meta: object;
        }>;
    }>>;
    hosting: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getDetailWithSubscription: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                subscriptionId: string;
                teamId?: string | undefined;
            };
            output: {
                hosting: any;
                subscription: {
                    id: string;
                    teamId: string | null;
                    hostingPlanId: string;
                    primaryDomain: string | null;
                    billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                    nextRenewalDate: Date | null;
                    expiryDate: Date | null;
                    notes: string | null;
                    autoRenew: boolean;
                    hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING";
                } | null;
                serviceSubscription: {
                    id: string;
                    subscriptionDate: string | null;
                    billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                    nextRenewalDate: string | null;
                    status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED";
                    autoRenew: boolean;
                } | null;
            };
            meta: object;
        }>;
        getByPleskFilterId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                pleskFilterId: string;
            };
            output: {
                id: string;
                teamId: string | null;
                hostingPlanId: string;
                primaryDomain: string | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                notes: string | null;
                autoRenew: boolean;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING";
            } | null;
            meta: object;
        }>;
        getHostingByDomainName: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                domainName: string;
            };
            output: {
                hasHosting: boolean;
                subscriptionId: string | null;
            };
            meta: object;
        }>;
        linkToTeam: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subscriptionId: string;
                teamId: string;
                pleskFilterId: string;
                hostingPlanId?: string | undefined;
                hostingType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
                nextRenewalDate?: unknown;
                expiryDate?: unknown;
                primaryDomain?: string | undefined;
                notes?: string | undefined;
                autoRenew?: boolean | undefined;
            };
            output: {
                success: boolean;
                id: string;
            };
            meta: object;
        }>;
        unlinkFromTeam: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subscriptionId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        updateSubscription: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subscriptionId: string;
                hostingPlanId?: string | undefined;
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
                nextRenewalDate?: unknown;
                expiryDate?: unknown;
                primaryDomain?: string | undefined;
                notes?: string | undefined;
                autoRenew?: boolean | undefined;
            };
            output: {
                success: boolean;
                id: string;
            };
            meta: object;
        }>;
    }>>;
    hostingPlans: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                planType?: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING" | undefined;
                hostingSubType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
                isActive?: boolean | undefined;
            } | undefined;
            output: {
                id: string;
                name: string;
                description: string | null;
                planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
                hostingSubType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                features: string[];
                highlights: string[];
                isPopular: boolean;
                isRecommended: boolean;
                niscPrice: string | null;
                niscCurrency: string;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                setupFee: string | null;
                isActive: boolean;
                isDefault: boolean;
                pleskServicePlanId: string | null;
                pleskFilterId: string | null;
                pleskIpAddress: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                name: string;
                description: string | null;
                planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
                hostingSubType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                features: string[];
                highlights: string[];
                isPopular: boolean;
                isRecommended: boolean;
                niscPrice: string | null;
                niscCurrency: string;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                setupFee: string | null;
                isActive: boolean;
                isDefault: boolean;
                pleskServicePlanId: string | null;
                pleskFilterId: string | null;
                pleskIpAddress: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
                description?: string | undefined;
                hostingSubType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
                features?: string[] | undefined;
                highlights?: string[] | undefined;
                isPopular?: boolean | undefined;
                isRecommended?: boolean | undefined;
                niscPrice?: string | undefined;
                niscCurrency?: string | undefined;
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
                setupFee?: string | undefined;
                isActive?: boolean | undefined;
                isDefault?: boolean | undefined;
                pleskServicePlanId?: string | undefined;
                pleskFilterId?: string | undefined;
                pleskIpAddress?: string | undefined;
            };
            output: {
                id: string;
                name: string;
                description: string | null;
                planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
                hostingSubType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                features: string[];
                highlights: string[];
                isPopular: boolean;
                isRecommended: boolean;
                niscPrice: string | null;
                niscCurrency: string;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                setupFee: string | null;
                isActive: boolean;
                isDefault: boolean;
                pleskServicePlanId: string | null;
                pleskFilterId: string | null;
                pleskIpAddress: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                name?: string | undefined;
                description?: string | undefined;
                planType?: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING" | undefined;
                hostingSubType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
                features?: string[] | undefined;
                highlights?: string[] | undefined;
                isPopular?: boolean | undefined;
                isRecommended?: boolean | undefined;
                niscPrice?: string | undefined;
                niscCurrency?: string | undefined;
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
                setupFee?: string | undefined;
                isActive?: boolean | undefined;
                isDefault?: boolean | undefined;
                pleskServicePlanId?: string | undefined;
                pleskFilterId?: string | undefined;
                pleskIpAddress?: string | undefined;
            };
            output: {
                id: string;
                name: string;
                description: string | null;
                planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
                hostingSubType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                features: string[];
                highlights: string[];
                isPopular: boolean;
                isRecommended: boolean;
                niscPrice: string | null;
                niscCurrency: string;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                setupFee: string | null;
                isActive: boolean;
                isDefault: boolean;
                pleskServicePlanId: string | null;
                pleskFilterId: string | null;
                pleskIpAddress: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
    wordpressSubscriptions: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getDetailWithSubscription: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                installationId: number;
            };
            output: {
                installation: any;
                subscription: {
                    id: string;
                    teamId: string | null;
                    installationId: number;
                    hostingSubscriptionId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
            };
            meta: object;
        }>;
        getByInstallationId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                installationId: number;
            };
            output: {
                id: string;
                teamId: string | null;
                installationId: number;
                hostingSubscriptionId: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        linkToTeam: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                teamId: string;
                installationId: number;
                hostingPlanId?: string | undefined;
            };
            output: {
                success: boolean;
                id: string;
            };
            meta: object;
        }>;
        unlinkFromTeam: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subscriptionId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        updateSubscription: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subscriptionId: string;
                hostingPlanId?: string | undefined;
            };
            output: {
                success: boolean;
                id: string;
            };
            meta: object;
        }>;
    }>>;
    clients: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: Record<string, never> | undefined;
            output: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                role: "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
                status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
                image: string | null;
                lastLoginAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                email: string;
                password: string;
                role?: "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER" | undefined;
            };
            output: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                role: "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
                status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
                image: string | null;
                lastLoginAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                name?: string | undefined;
                email?: string | undefined;
                role?: "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER" | undefined;
            };
            output: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                role: "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
                status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
                image: string | null;
                lastLoginAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        changeStatus: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        requestPasswordReset: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        getSessions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: string;
            };
            output: {
                id: string;
                token: string;
                expiresAt: Date;
                createdAt: Date;
                updatedAt: Date;
                ipAddress: string | null;
                userAgent: string | null;
            }[];
            meta: object;
        }>;
        getProfile: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: string;
            };
            output: {
                firstName: string | null;
                lastName: string | null;
                phone: string | null;
                address: string | null;
                city: string | null;
                state: string | null;
                country: string | null;
                postalCode: string | null;
            };
            meta: object;
        }>;
        updateProfile: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                name?: string | undefined;
                firstName?: string | undefined;
                lastName?: string | undefined;
                phone?: string | undefined;
                address?: string | undefined;
                city?: string | undefined;
                state?: string | undefined;
                country?: string | undefined;
                postalCode?: string | undefined;
            };
            output: {
                success: boolean;
                message?: string | undefined;
            };
            meta: object;
        }>;
        getIntegrations: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: string;
            };
            output: {
                id: string;
                userId: string;
                platform: "PLESK" | "OPENPROVIDER" | "KENIC";
                platformCustomerId: string | null;
                isActive: boolean;
                isCreated: boolean;
                createdBy: string | null;
                createdAt: Date;
                lastSyncedAt: Date | null;
                platformData: any;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        createIntegration: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                platform: "PLESK" | "OPENPROVIDER";
            };
            output: {
                id: string;
                userId: string;
                platform: "PLESK" | "OPENPROVIDER" | "KENIC";
                platformCustomerId: string | null;
                isActive: boolean;
                isCreated: boolean;
                createdBy: string | null;
                createdAt: Date;
                lastSyncedAt: Date | null;
                platformData: any;
                updatedAt: Date;
            };
            meta: object;
        }>;
        checkEmailVerification: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: string;
                integrationId: string;
            };
            output: {
                isVerified: boolean;
                status: string | null;
                email: string | null;
                handle: string | null;
                domains?: {
                    domain: string;
                    status: string;
                    expiration_date: string | null;
                    is_suspended: boolean;
                }[] | undefined;
            };
            meta: object;
        }>;
        sendEmailVerification: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                integrationId: string;
                language?: string | undefined;
            };
            output: {
                success: boolean;
                message: string;
                verificationId?: string | null | undefined;
            };
            meta: object;
        }>;
    }>>;
    manageUsers: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: Record<string, never> | undefined;
            output: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                role: "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
                status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
                image: string | null;
                lastLoginAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: string;
            };
            output: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                role: "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
                status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
                image: string | null;
                lastLoginAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                email: string;
                password: string;
                role: "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
            };
            output: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                role: "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
                status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
                image: string | null;
                lastLoginAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                name?: string | undefined;
                email?: string | undefined;
                role?: "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER" | undefined;
            };
            output: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                role: "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
                status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
                image: string | null;
                lastLoginAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        changeStatus: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        requestPasswordReset: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        getSessions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: string;
            };
            output: {
                id: string;
                token: string;
                expiresAt: Date;
                createdAt: Date;
                updatedAt: Date;
                ipAddress: string | null;
                userAgent: string | null;
            }[];
            meta: object;
        }>;
        getProfile: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: string;
            };
            output: {
                firstName: string | null;
                lastName: string | null;
                phone: string | null;
                address: string | null;
                city: string | null;
                state: string | null;
                country: string | null;
                postalCode: string | null;
            };
            meta: object;
        }>;
        updateProfile: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                name?: string | undefined;
                firstName?: string | undefined;
                lastName?: string | undefined;
                phone?: string | undefined;
                address?: string | undefined;
                city?: string | undefined;
                state?: string | undefined;
                country?: string | undefined;
                postalCode?: string | undefined;
            };
            output: {
                success: boolean;
                message?: string | undefined;
            };
            meta: object;
        }>;
    }>>;
    orders: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId?: string | undefined;
                status?: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "COMPLETED" | "REFUNDED" | "PARTIAL" | undefined;
                type?: "CUSTOM_SERVICE" | "EMAIL_HOSTING" | "DOMAIN_REGISTRATION" | "DOMAIN_RENEWAL" | "DOMAIN_TRANSFER" | "HOSTING_SUBSCRIPTION" | "HOSTING_RENEWAL" | "HOSTING_UPGRADE" | "SSL_CERTIFICATE" | "BACKUP_SERVICE" | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                orders: {
                    id: string;
                    orderNumber: string;
                    teamId: string | null;
                    createdBy: string | null;
                    type: "CUSTOM_SERVICE" | "EMAIL_HOSTING" | "DOMAIN_REGISTRATION" | "DOMAIN_RENEWAL" | "DOMAIN_TRANSFER" | "HOSTING_SUBSCRIPTION" | "HOSTING_RENEWAL" | "HOSTING_UPGRADE" | "SSL_CERTIFICATE" | "BACKUP_SERVICE";
                    status: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "COMPLETED" | "REFUNDED" | "PARTIAL";
                    description: string | null;
                    domainId: string | null;
                    hostingSubscriptionId: string | null;
                    subtotal: string | null;
                    discount: string | null;
                    isTaxable: boolean | null;
                    taxPercentage: number | null;
                    taxAmount: string | null;
                    total: string | null;
                    currency: string;
                    promoCode: string | null;
                    promoId: string | null;
                    invoiceNumber: string | null;
                    processedBy: string | null;
                    processedAt: Date | null;
                    completedAt: Date | null;
                    notes: string | null;
                    metadata: any;
                    createdAt: Date;
                    updatedAt: Date;
                    team?: {
                        id: string;
                        name: string;
                        slug: string;
                    } | null | undefined;
                    hostingSubscription?: {
                        id: string;
                        pleskName: string | null;
                        status: string;
                        primaryDomain: string | null;
                    } | null | undefined;
                    orderItems?: {
                        id: string;
                        orderId: string;
                        niscServicePlanId: string;
                        billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                        itemPrice: string;
                        itemSubtotal: string;
                        itemCurrency: string;
                        domainName: string | null;
                        description: string | null;
                        adminDescription: string | null;
                        notes: string | null;
                        status: "PENDING" | "FAILED" | "PROVISIONING" | "PROVISIONED" | "SKIPPED";
                        isProvisioned: boolean;
                        provisioningError: string | null;
                        hostingSubscriptionId: string | null;
                        metadata: any;
                        createdAt: Date;
                        updatedAt: Date;
                        niscServicePlan?: {
                            id: string;
                            name: string;
                            planType: string;
                            hostingSubType: string | null;
                        } | undefined;
                        hostingSubscription?: {
                            id: string;
                            pleskName: string | null;
                            status: string;
                            primaryDomain: string | null;
                        } | undefined;
                    }[] | undefined;
                }[];
                total: number;
            };
            meta: object;
        }>;
        getSummary: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                total: number;
                completed: number;
                failed: number;
                pending: number;
            };
            meta: object;
        }>;
        getSummaryByTeam: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                total: number;
                completed: number;
                failed: number;
                pending: number;
            };
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                orderNumber: string;
                teamId: string | null;
                createdBy: string | null;
                type: "CUSTOM_SERVICE" | "EMAIL_HOSTING" | "DOMAIN_REGISTRATION" | "DOMAIN_RENEWAL" | "DOMAIN_TRANSFER" | "HOSTING_SUBSCRIPTION" | "HOSTING_RENEWAL" | "HOSTING_UPGRADE" | "SSL_CERTIFICATE" | "BACKUP_SERVICE";
                status: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "COMPLETED" | "REFUNDED" | "PARTIAL";
                description: string | null;
                domainId: string | null;
                hostingSubscriptionId: string | null;
                subtotal: string | null;
                discount: string | null;
                isTaxable: boolean | null;
                taxPercentage: number | null;
                taxAmount: string | null;
                total: string | null;
                currency: string;
                promoCode: string | null;
                promoId: string | null;
                invoiceNumber: string | null;
                processedBy: string | null;
                processedAt: Date | null;
                completedAt: Date | null;
                notes: string | null;
                metadata: any;
                createdAt: Date;
                updatedAt: Date;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                hostingSubscription?: {
                    id: string;
                    pleskName: string | null;
                    status: string;
                    primaryDomain: string | null;
                } | null | undefined;
                orderItems?: {
                    id: string;
                    orderId: string;
                    niscServicePlanId: string;
                    billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                    itemPrice: string;
                    itemSubtotal: string;
                    itemCurrency: string;
                    domainName: string | null;
                    description: string | null;
                    adminDescription: string | null;
                    notes: string | null;
                    status: "PENDING" | "FAILED" | "PROVISIONING" | "PROVISIONED" | "SKIPPED";
                    isProvisioned: boolean;
                    provisioningError: string | null;
                    hostingSubscriptionId: string | null;
                    metadata: any;
                    createdAt: Date;
                    updatedAt: Date;
                    niscServicePlan?: {
                        id: string;
                        name: string;
                        planType: string;
                        hostingSubType: string | null;
                    } | undefined;
                    hostingSubscription?: {
                        id: string;
                        pleskName: string | null;
                        status: string;
                        primaryDomain: string | null;
                    } | undefined;
                }[] | undefined;
            };
            meta: object;
        }>;
        getTeamDomains: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                id: string;
                domainName: string;
            }[];
            meta: object;
        }>;
        createHostingOrder: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                hostingPlanId: string;
                teamId: string;
                domainName: string;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                description?: string | undefined;
                adminDescription?: string | undefined;
                notes?: string | undefined;
            };
            output: {
                success: boolean;
                order: {
                    id: string;
                    orderNumber: string;
                    teamId: string | null;
                    createdBy: string | null;
                    type: "CUSTOM_SERVICE" | "EMAIL_HOSTING" | "DOMAIN_REGISTRATION" | "DOMAIN_RENEWAL" | "DOMAIN_TRANSFER" | "HOSTING_SUBSCRIPTION" | "HOSTING_RENEWAL" | "HOSTING_UPGRADE" | "SSL_CERTIFICATE" | "BACKUP_SERVICE";
                    status: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "COMPLETED" | "REFUNDED" | "PARTIAL";
                    description: string | null;
                    domainId: string | null;
                    hostingSubscriptionId: string | null;
                    subtotal: string | null;
                    discount: string | null;
                    isTaxable: boolean | null;
                    taxPercentage: number | null;
                    taxAmount: string | null;
                    total: string | null;
                    currency: string;
                    promoCode: string | null;
                    promoId: string | null;
                    invoiceNumber: string | null;
                    processedBy: string | null;
                    processedAt: Date | null;
                    completedAt: Date | null;
                    notes: string | null;
                    metadata: any;
                    createdAt: Date;
                    updatedAt: Date;
                    team?: {
                        id: string;
                        name: string;
                        slug: string;
                    } | null | undefined;
                    hostingSubscription?: {
                        id: string;
                        pleskName: string | null;
                        status: string;
                        primaryDomain: string | null;
                    } | null | undefined;
                    orderItems?: {
                        id: string;
                        orderId: string;
                        niscServicePlanId: string;
                        billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                        itemPrice: string;
                        itemSubtotal: string;
                        itemCurrency: string;
                        domainName: string | null;
                        description: string | null;
                        adminDescription: string | null;
                        notes: string | null;
                        status: "PENDING" | "FAILED" | "PROVISIONING" | "PROVISIONED" | "SKIPPED";
                        isProvisioned: boolean;
                        provisioningError: string | null;
                        hostingSubscriptionId: string | null;
                        metadata: any;
                        createdAt: Date;
                        updatedAt: Date;
                        niscServicePlan?: {
                            id: string;
                            name: string;
                            planType: string;
                            hostingSubType: string | null;
                        } | undefined;
                        hostingSubscription?: {
                            id: string;
                            pleskName: string | null;
                            status: string;
                            primaryDomain: string | null;
                        } | undefined;
                    }[] | undefined;
                };
                message: string;
                hostingSubscription?: {
                    id: string;
                    pleskServiceId: string | null;
                    pleskName: string | null;
                    pleskFtpLogin: string | null;
                    pleskFtpPassword: string | null;
                } | undefined;
            };
            meta: object;
        }>;
        checkTeamBillingSettings: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                hasBillingSettings: boolean;
                billingSettings: {
                    id: string;
                    legalName: string;
                    billingEmail: string;
                    billingPhone: string | null;
                    addressLine1: string;
                    addressLine2: string | null;
                    city: string;
                    state: string | null;
                    country: string;
                    postalCode: string | null;
                    taxId: string | null;
                } | null;
            };
            meta: object;
        }>;
        createServiceOrder: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                teamId: string;
                items: {
                    niscServicePlanId: string;
                    billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                    domainName?: string | undefined;
                    description?: string | undefined;
                    adminDescription?: string | undefined;
                    notes?: string | undefined;
                }[];
                isTaxable?: boolean | null | undefined;
                taxPercentage?: number | null | undefined;
                createInvoice?: boolean | undefined;
                description?: string | undefined;
                notes?: string | undefined;
                promoCode?: string | undefined;
            };
            output: {
                success: boolean;
                order: {
                    id: string;
                    orderNumber: string;
                    teamId: string | null;
                    createdBy: string | null;
                    type: "CUSTOM_SERVICE" | "EMAIL_HOSTING" | "DOMAIN_REGISTRATION" | "DOMAIN_RENEWAL" | "DOMAIN_TRANSFER" | "HOSTING_SUBSCRIPTION" | "HOSTING_RENEWAL" | "HOSTING_UPGRADE" | "SSL_CERTIFICATE" | "BACKUP_SERVICE";
                    status: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "COMPLETED" | "REFUNDED" | "PARTIAL";
                    description: string | null;
                    domainId: string | null;
                    hostingSubscriptionId: string | null;
                    subtotal: string | null;
                    discount: string | null;
                    isTaxable: boolean | null;
                    taxPercentage: number | null;
                    taxAmount: string | null;
                    total: string | null;
                    currency: string;
                    promoCode: string | null;
                    promoId: string | null;
                    invoiceNumber: string | null;
                    processedBy: string | null;
                    processedAt: Date | null;
                    completedAt: Date | null;
                    notes: string | null;
                    metadata: any;
                    createdAt: Date;
                    updatedAt: Date;
                    team?: {
                        id: string;
                        name: string;
                        slug: string;
                    } | null | undefined;
                    hostingSubscription?: {
                        id: string;
                        pleskName: string | null;
                        status: string;
                        primaryDomain: string | null;
                    } | null | undefined;
                    orderItems?: {
                        id: string;
                        orderId: string;
                        niscServicePlanId: string;
                        billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                        itemPrice: string;
                        itemSubtotal: string;
                        itemCurrency: string;
                        domainName: string | null;
                        description: string | null;
                        adminDescription: string | null;
                        notes: string | null;
                        status: "PENDING" | "FAILED" | "PROVISIONING" | "PROVISIONED" | "SKIPPED";
                        isProvisioned: boolean;
                        provisioningError: string | null;
                        hostingSubscriptionId: string | null;
                        metadata: any;
                        createdAt: Date;
                        updatedAt: Date;
                        niscServicePlan?: {
                            id: string;
                            name: string;
                            planType: string;
                            hostingSubType: string | null;
                        } | undefined;
                        hostingSubscription?: {
                            id: string;
                            pleskName: string | null;
                            status: string;
                            primaryDomain: string | null;
                        } | undefined;
                    }[] | undefined;
                };
                orderItems: {
                    id: string;
                    niscServicePlanId: string;
                    planName: string;
                    planType: string;
                    status: "PENDING" | "FAILED" | "PROVISIONING" | "PROVISIONED" | "SKIPPED";
                    isProvisioned: boolean;
                    provisioningError: string | null;
                    hostingSubscription?: {
                        id: string;
                        pleskServiceId: string | null;
                        pleskName: string | null;
                        pleskFtpLogin: string | null;
                        pleskFtpPassword: string | null;
                    } | undefined;
                }[];
                message: string;
                requiresProvisioning: boolean;
                nonProvisionedItems?: {
                    planName: string;
                    planType: string;
                    orderItemId: string;
                }[] | undefined;
                orderItemStatuses?: {
                    planName: string;
                    planType: string;
                    status: "PENDING" | "FAILED" | "PROVISIONING" | "PROVISIONED" | "SKIPPED";
                    provisioningError: string | null;
                    domainName: string | null;
                }[] | undefined;
                invoiceCreated?: boolean | undefined;
                invoiceNumber?: string | undefined;
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                orderId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
    invoicing: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId?: string | undefined;
                status?: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF" | undefined;
                search?: string | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                invoices: {
                    id: string;
                    status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                    currency: string;
                    dueDate: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    invoiceNumber?: string | null | undefined;
                    customerName?: string | null | undefined;
                    customerEmail?: string | null | undefined;
                    amount?: string | null | undefined;
                }[];
                total: number;
            };
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                currency: string;
                dueDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                paidAt: Date | null;
                sentAt: Date | null;
                reminderSentAt: Date | null;
                viewedAt: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                transactions: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    currency: string;
                    id: string;
                    status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED";
                    paidAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    notes?: string | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                }[];
                invoiceNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    currency: string;
                    createdBy: string;
                    id: string;
                    status: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED";
                    issuedAt: Date | null;
                    appliedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    updatedBy?: string | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                } | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        updatePayment: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                invoiceId: string;
                type: "PARTIAL" | "COMPLETE";
                amountPaid?: string | undefined;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                currency: string;
                dueDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                paidAt: Date | null;
                sentAt: Date | null;
                reminderSentAt: Date | null;
                viewedAt: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                transactions: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    currency: string;
                    id: string;
                    status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED";
                    paidAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    notes?: string | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                }[];
                invoiceNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    currency: string;
                    createdBy: string;
                    id: string;
                    status: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED";
                    issuedAt: Date | null;
                    appliedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    updatedBy?: string | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                } | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        getNextInvoiceNumber: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                invoiceNumber: string;
                nextNumber: number;
            };
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                createdBy: string;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
                status?: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF" | undefined;
                token?: string | undefined;
                lineItems?: {
                    id?: string | undefined;
                    position?: number | undefined;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[] | undefined;
                transactions?: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    id?: string | undefined;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    status?: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED" | undefined;
                    currency?: string | undefined;
                    paidAt?: unknown;
                    notes?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                }[] | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    createdBy: string;
                    id?: string | undefined;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    status?: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED" | undefined;
                    currency?: string | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    issuedAt?: unknown;
                    appliedAt?: unknown;
                    updatedBy?: string | null | undefined;
                } | undefined;
                id?: string | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                invoiceNumber?: string | null | undefined;
                amount?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                currency?: string | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                issueDate?: unknown;
                dueDate?: unknown;
                paidAt?: unknown;
                sentAt?: unknown;
                reminderSentAt?: unknown;
                viewedAt?: unknown;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                updatedBy?: string | null | undefined;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                currency: string;
                dueDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                paidAt: Date | null;
                sentAt: Date | null;
                reminderSentAt: Date | null;
                viewedAt: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                transactions: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    currency: string;
                    id: string;
                    status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED";
                    paidAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    notes?: string | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                }[];
                invoiceNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    currency: string;
                    createdBy: string;
                    id: string;
                    status: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED";
                    issuedAt: Date | null;
                    appliedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    updatedBy?: string | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                } | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                createdBy: string;
                id: string;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
                status?: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF" | undefined;
                token?: string | undefined;
                transactions?: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    id?: string | undefined;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    status?: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED" | undefined;
                    currency?: string | undefined;
                    paidAt?: unknown;
                    notes?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                }[] | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    createdBy: string;
                    id?: string | undefined;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    status?: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED" | undefined;
                    currency?: string | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    issuedAt?: unknown;
                    appliedAt?: unknown;
                    updatedBy?: string | null | undefined;
                } | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                invoiceNumber?: string | null | undefined;
                amount?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                currency?: string | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                issueDate?: unknown;
                dueDate?: unknown;
                paidAt?: unknown;
                sentAt?: unknown;
                reminderSentAt?: unknown;
                viewedAt?: unknown;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                updatedBy?: string | null | undefined;
                lineItems?: {
                    id?: string | undefined;
                    position?: number | undefined;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[] | undefined;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                currency: string;
                dueDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                paidAt: Date | null;
                sentAt: Date | null;
                reminderSentAt: Date | null;
                viewedAt: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                transactions: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    currency: string;
                    id: string;
                    status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED";
                    paidAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    notes?: string | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                }[];
                invoiceNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    currency: string;
                    createdBy: string;
                    id: string;
                    status: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED";
                    issuedAt: Date | null;
                    appliedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    updatedBy?: string | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                } | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        updateStatus: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                note?: string | null | undefined;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                currency: string;
                dueDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                paidAt: Date | null;
                sentAt: Date | null;
                reminderSentAt: Date | null;
                viewedAt: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                transactions: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    currency: string;
                    id: string;
                    status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED";
                    paidAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    notes?: string | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                }[];
                invoiceNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    currency: string;
                    createdBy: string;
                    id: string;
                    status: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED";
                    issuedAt: Date | null;
                    appliedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    updatedBy?: string | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                } | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        recordTransaction: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                invoiceId: string;
                method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                amount: string;
                id?: string | undefined;
                reference?: string | null | undefined;
                providerReference?: string | null | undefined;
                status?: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED" | undefined;
                currency?: string | undefined;
                paidAt?: unknown;
                notes?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                balanceBefore?: string | null | undefined;
                balanceAfter?: string | null | undefined;
                recordedBy?: string | null | undefined;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                currency: string;
                dueDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                paidAt: Date | null;
                sentAt: Date | null;
                reminderSentAt: Date | null;
                viewedAt: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                transactions: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    currency: string;
                    id: string;
                    status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED";
                    paidAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    notes?: string | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                }[];
                invoiceNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    currency: string;
                    createdBy: string;
                    id: string;
                    status: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED";
                    issuedAt: Date | null;
                    appliedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    updatedBy?: string | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                } | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        deleteTransaction: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                invoiceId: string;
                id?: string | undefined;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                currency: string;
                dueDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                paidAt: Date | null;
                sentAt: Date | null;
                reminderSentAt: Date | null;
                viewedAt: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                transactions: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    currency: string;
                    id: string;
                    status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED";
                    paidAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    notes?: string | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                }[];
                invoiceNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    currency: string;
                    createdBy: string;
                    id: string;
                    status: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED";
                    issuedAt: Date | null;
                    appliedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    updatedBy?: string | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                } | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        upsertCreditNote: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                invoiceId: string;
                amount: string;
                createdBy: string;
                id?: string | undefined;
                teamId?: string | null | undefined;
                creditNumber?: string | null | undefined;
                status?: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED" | undefined;
                currency?: string | undefined;
                reason?: string | null | undefined;
                note?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                issuedAt?: unknown;
                appliedAt?: unknown;
                updatedBy?: string | null | undefined;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                currency: string;
                dueDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                paidAt: Date | null;
                sentAt: Date | null;
                reminderSentAt: Date | null;
                viewedAt: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                transactions: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    currency: string;
                    id: string;
                    status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED";
                    paidAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    notes?: string | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                }[];
                invoiceNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    currency: string;
                    createdBy: string;
                    id: string;
                    status: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED";
                    issuedAt: Date | null;
                    appliedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    updatedBy?: string | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                } | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        deleteCreditNote: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                invoiceId: string;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                currency: string;
                dueDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                paidAt: Date | null;
                sentAt: Date | null;
                reminderSentAt: Date | null;
                viewedAt: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                transactions: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    currency: string;
                    id: string;
                    status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED";
                    paidAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    notes?: string | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                }[];
                invoiceNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    currency: string;
                    createdBy: string;
                    id: string;
                    status: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED";
                    issuedAt: Date | null;
                    appliedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    updatedBy?: string | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                } | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        submitInvoice: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                billingEmail: string;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
                status?: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF" | undefined;
                token?: string | undefined;
                lineItems?: {
                    id?: string | undefined;
                    position?: number | undefined;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[] | undefined;
                transactions?: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    id?: string | undefined;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    status?: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED" | undefined;
                    currency?: string | undefined;
                    paidAt?: unknown;
                    notes?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                }[] | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    createdBy: string;
                    id?: string | undefined;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    status?: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED" | undefined;
                    currency?: string | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    issuedAt?: unknown;
                    appliedAt?: unknown;
                    updatedBy?: string | null | undefined;
                } | undefined;
                id?: string | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                invoiceNumber?: string | null | undefined;
                amount?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                currency?: string | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                issueDate?: unknown;
                dueDate?: unknown;
                paidAt?: unknown;
                sentAt?: unknown;
                reminderSentAt?: unknown;
                viewedAt?: unknown;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                pdfBase64?: string | undefined;
                createdBy?: string | undefined;
                updatedBy?: string | undefined;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                currency: string;
                dueDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                paidAt: Date | null;
                sentAt: Date | null;
                reminderSentAt: Date | null;
                viewedAt: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                transactions: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    currency: string;
                    id: string;
                    status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED";
                    paidAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    notes?: string | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                }[];
                invoiceNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    currency: string;
                    createdBy: string;
                    id: string;
                    status: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED";
                    issuedAt: Date | null;
                    appliedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    updatedBy?: string | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                } | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        deleteInvoice: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                invoiceId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        resendEmailReminder: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                invoiceId: string;
                pdfBase64: string;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "CANCELLED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
                currency: string;
                dueDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                paidAt: Date | null;
                sentAt: Date | null;
                reminderSentAt: Date | null;
                viewedAt: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                transactions: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    currency: string;
                    id: string;
                    status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED";
                    paidAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    notes?: string | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                }[];
                invoiceNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                teamId?: string | null | undefined;
                customerId?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                creditedAmount?: string | null | undefined;
                creditBalance?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                creditNote?: {
                    invoiceId: string;
                    amount: string;
                    currency: string;
                    createdBy: string;
                    id: string;
                    status: "DRAFT" | "ISSUED" | "APPLIED" | "VOIDED";
                    issuedAt: Date | null;
                    appliedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId?: string | null | undefined;
                    creditNumber?: string | null | undefined;
                    reason?: string | null | undefined;
                    note?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    updatedBy?: string | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                } | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                paymentDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        listTransactions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
                status?: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED" | undefined;
            };
            output: {
                transactions: {
                    invoiceId: string;
                    method: "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
                    amount: string;
                    currency: string;
                    id: string;
                    status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED";
                    paidAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    reference?: string | null | undefined;
                    providerReference?: string | null | undefined;
                    notes?: string | null | undefined;
                    balanceBefore?: string | null | undefined;
                    balanceAfter?: string | null | undefined;
                    recordedBy?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    activityLogs?: {
                        id: string;
                        userId: string;
                        action: string;
                        createdAt: Date;
                        description?: string | null | undefined;
                        metadata?: Record<string, unknown> | unknown[] | null | undefined;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    }[] | undefined;
                    invoiceNumber?: string | null | undefined;
                }[];
                total: number;
            };
            meta: object;
        }>;
    }>>;
    quotations: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                status?: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED" | undefined;
                search?: string | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                quotations: {
                    id: string;
                    status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
                    currency: string;
                    createdAt: Date;
                    updatedAt: Date;
                    quotationNumber?: string | null | undefined;
                    customerName?: string | null | undefined;
                    customerEmail?: string | null | undefined;
                    amount?: string | null | undefined;
                    subtotal?: string | null | undefined;
                }[];
                total: number;
            };
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
                currency: string;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                quotationNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        getNextQuotationNumber: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                quotationNumber: string;
                nextNumber: number;
            };
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                discount: unknown;
                note: unknown;
                internalNote: unknown;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
                status?: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED" | undefined;
                token?: string | undefined;
                lineItems?: {
                    id?: string | undefined;
                    position?: number | undefined;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[] | undefined;
                id?: string | undefined;
                quotationNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                currency?: string | undefined;
                issueDate?: unknown;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                createdBy?: string | undefined;
                updatedBy?: string | null | undefined;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
                currency: string;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                quotationNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                discount: unknown;
                note: unknown;
                internalNote: unknown;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
                lineItems?: {
                    id?: string | undefined;
                    position?: number | undefined;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[] | undefined;
                quotationNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                token?: string | null | undefined;
                status?: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED" | undefined;
                amount?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                currency?: string | undefined;
                issueDate?: unknown;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                createdBy?: string | undefined;
                updatedBy?: string | null | undefined;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
                currency: string;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                quotationNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        updateStatus: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
                note?: string | undefined;
            };
            output: {
                id: string;
                status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
                currency: string;
                createdAt: Date;
                updatedAt: Date;
                issueDate: Date | null;
                lineItems: {
                    position: number;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name?: string | null | undefined;
                    description?: string | null | undefined;
                    quantity?: number | null | undefined;
                    unit?: string | null | undefined;
                    price?: string | null | undefined;
                    discount?: string | null | undefined;
                    total?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                }[];
                quotationNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                subtotal?: string | null | undefined;
                tax?: string | null | undefined;
                taxPercentage?: number | null | undefined;
                vat?: string | null | undefined;
                discount?: string | null | undefined;
                note?: string | null | undefined;
                internalNote?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                activityLogs?: {
                    id: string;
                    userId: string;
                    action: string;
                    createdAt: Date;
                    description?: string | null | undefined;
                    metadata?: Record<string, unknown> | unknown[] | null | undefined;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                }[] | undefined;
                fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
                customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
                noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
                template?: Record<string, unknown> | unknown[] | null | undefined;
                topBlock?: Record<string, unknown> | unknown[] | null | undefined;
                bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            };
            meta: object;
        }>;
        deleteQuotation: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                quotationId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        sendQuotationEmail: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                quotationId: string;
                toEmail: string;
                pdfBase64: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
    teamBilling: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        listTeams: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                teams: {
                    id: string;
                    name: string;
                    slug: string;
                    hasBillingSettings: boolean;
                    isBillingComplete: boolean;
                    billingSettings: {
                        legalName: string;
                        billingEmail: string;
                        addressLine1: string;
                        city: string;
                        country: string;
                        id: string;
                        teamId: string;
                        updatedBy: string;
                        createdAt: Date;
                        updatedAt: Date;
                        billingPhone?: string | null | undefined;
                        addressLine2?: string | null | undefined;
                        state?: string | null | undefined;
                        postalCode?: string | null | undefined;
                        taxId?: string | null | undefined;
                        additionalNotes?: string | null | undefined;
                    } | null;
                }[];
            };
            meta: object;
        }>;
        getByTeam: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                legalName: string;
                billingEmail: string;
                addressLine1: string;
                city: string;
                country: string;
                id: string;
                teamId: string;
                updatedBy: string;
                createdAt: Date;
                updatedAt: Date;
                billingPhone?: string | null | undefined;
                addressLine2?: string | null | undefined;
                state?: string | null | undefined;
                postalCode?: string | null | undefined;
                taxId?: string | null | undefined;
                additionalNotes?: string | null | undefined;
            } | null;
            meta: object;
        }>;
        upsert: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                legalName: string;
                billingEmail: string;
                addressLine1: string;
                city: string;
                country: string;
                teamId: string;
                billingPhone?: string | null | undefined;
                addressLine2?: string | null | undefined;
                state?: string | null | undefined;
                postalCode?: string | null | undefined;
                taxId?: string | null | undefined;
                additionalNotes?: string | null | undefined;
            };
            output: {
                legalName: string;
                billingEmail: string;
                addressLine1: string;
                city: string;
                country: string;
                id: string;
                teamId: string;
                updatedBy: string;
                createdAt: Date;
                updatedAt: Date;
                billingPhone?: string | null | undefined;
                addressLine2?: string | null | undefined;
                state?: string | null | undefined;
                postalCode?: string | null | undefined;
                taxId?: string | null | undefined;
                additionalNotes?: string | null | undefined;
            };
            meta: object;
        }>;
        getActivityLog: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                id: string;
                teamBillingSettingsId: string;
                userId: string;
                action: string;
                description: string | null;
                metadata: any;
                ipAddress: string | null;
                userAgent: string | null;
                createdAt: Date;
            }[];
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                teamId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
    serviceSubscriptions: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        linkToSubscription: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subscriptionId: string;
                pleskFilterId: string;
                niscServicePlanId: string;
                teamId: string;
                hostingPlanId: string;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                hostingType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
                subscriptionDate?: unknown;
                expiryDate?: unknown;
                primaryDomain?: string | undefined;
                status?: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | undefined;
                autoRenew?: boolean | undefined;
                notes?: string | undefined;
            };
            output: {
                id: string;
                niscServicePlanId: string;
                teamId: string | null;
                orderId: string | null;
                subscriptionDate: Date | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                nextRenewalDate: Date | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED";
                autoRenew: boolean;
                hostingSubscriptionId: string | null;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
                hostingSubType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            };
            meta: object;
        }>;
        getByHostingSubscriptionId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                hostingSubscriptionId: string;
            };
            output: {
                id: string;
                niscServicePlanId: string;
                teamId: string | null;
                teamName: string | null;
                orderId: string | null;
                subscriptionDate: Date | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                nextRenewalDate: Date | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED";
                autoRenew: boolean;
                hostingSubscriptionId: string | null;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
                hostingSubType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                planName: string;
            } | null;
            meta: object;
        }>;
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId?: string | undefined;
                planType?: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING" | undefined;
                hostingSubType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
                status?: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | undefined;
            } | undefined;
            output: {
                id: string;
                niscServicePlanId: string;
                teamId: string | null;
                teamName: string | null;
                orderId: string | null;
                subscriptionDate: Date | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                nextRenewalDate: Date | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED";
                autoRenew: boolean;
                hostingSubscriptionId: string | null;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
                hostingSubType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                planName: string;
            }[];
            meta: object;
        }>;
    }>>;
    socialMediaMarketing: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        meta: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            auth: import("@trpc/server").TRPCBuiltRouter<{
                ctx: import("..").Context;
                meta: object;
                errorShape: import("@trpc/server").TRPCDefaultErrorShape;
                transformer: false;
            }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
                generateToken: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        code: string;
                        redirectUri?: string | undefined;
                    };
                    output: {
                        success: boolean;
                        data: {
                            accessToken: string;
                            tokenType: string;
                            expiresIn: number;
                            expiresAt: string;
                        };
                        meta: {
                            generated_at: string;
                            integration_id: string;
                        };
                    };
                    meta: object;
                }>;
                getPageToken: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        userAccessToken: string;
                        pageId: string;
                        teamId?: string | null | undefined;
                    };
                    output: {
                        success: boolean;
                        data: {
                            accessToken: string;
                            pageId: string;
                            pageInfo: {
                                pageName?: string;
                                pageUsername?: string;
                                pagePicture?: string;
                                pageCategory?: string;
                            };
                        };
                        meta: {
                            retrieved_at: string;
                            page_id: string;
                            team_id: string | null;
                        };
                    };
                    meta: object;
                }>;
                generateAuthUrl: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        redirectUri?: string | undefined;
                    };
                    output: {
                        success: boolean;
                        data: {
                            url: string;
                            state: string;
                        };
                        meta: {
                            generated_at: string;
                        };
                    };
                    meta: object;
                }>;
                getStoredCredentials: import("@trpc/server").TRPCQueryProcedure<{
                    input: void;
                    output: {
                        success: boolean;
                        data: null;
                        meta: {
                            has_credentials: boolean;
                            created_at?: undefined;
                            updated_at?: undefined;
                        };
                    } | {
                        success: boolean;
                        data: {
                            integrationId: string;
                            hasAccessToken: boolean;
                            accessTokenExpiresAt: string | null;
                            isExpired: boolean | null;
                            scope: string | null;
                            status: string;
                            userId: string;
                        };
                        meta: {
                            has_credentials: boolean;
                            created_at: string;
                            updated_at: string;
                        };
                    };
                    meta: object;
                }>;
            }>>;
            pages: import("@trpc/server").TRPCBuiltRouter<{
                ctx: import("..").Context;
                meta: object;
                errorShape: import("@trpc/server").TRPCDefaultErrorShape;
                transformer: false;
            }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
                getPages: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        fields?: string[] | undefined;
                        accessToken?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                    };
                    output: {
                        success: boolean;
                        data: any;
                        meta: {
                            retrieved_at: string;
                            total_pages: any;
                        };
                    };
                    meta: object;
                }>;
                getPageTokenId: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        pageId: string;
                    };
                    output: {
                        success: boolean;
                        data: {
                            pageTokenId: string;
                            pageId: string;
                            pageName: string | null;
                        };
                    };
                    meta: object;
                }>;
                getPage: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        pageId: string;
                        fields?: string[] | undefined;
                        accessToken?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                    };
                    output: {
                        success: boolean;
                        data: any;
                        meta: {
                            retrieved_at: string;
                            page_id: string;
                        };
                    };
                    meta: object;
                }>;
                getPageInsights: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        pageId: string;
                        metrics?: string[] | undefined;
                        period?: "day" | "week" | "days_28" | undefined;
                        since?: string | undefined;
                        until?: string | undefined;
                        accessToken?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                    };
                    output: {
                        success: boolean;
                        data: any;
                        meta: {
                            retrieved_at: string;
                            page_id: string;
                        };
                    };
                    meta: object;
                }>;
            }>>;
            content: import("@trpc/server").TRPCBuiltRouter<{
                ctx: import("..").Context;
                meta: object;
                errorShape: import("@trpc/server").TRPCDefaultErrorShape;
                transformer: false;
            }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
                getContent: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        pageId: string;
                        contentType?: "events" | "posts" | "photos" | "videos" | undefined;
                        fields?: string[] | undefined;
                        limit?: number | undefined;
                        since?: string | undefined;
                        until?: string | undefined;
                        accessToken?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                    };
                    output: {
                        success: boolean;
                        data: any;
                        pagination: {
                            previous: any;
                            next: any;
                            cursors: any;
                        };
                        meta: {
                            retrieved_at: string;
                            page_id: string;
                            content_type: "events" | "posts" | "photos" | "videos";
                            total_items: any;
                        };
                    };
                    meta: object;
                }>;
                getPosts: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        pageId: string;
                        accessToken?: string | undefined;
                        fields?: string[] | undefined;
                        limit?: number | undefined;
                        since?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                        until?: string | undefined;
                        contentType?: "posts" | undefined;
                    };
                    output: {
                        success: boolean;
                        data: any;
                        pagination: {
                            previous: any;
                            next: any;
                            cursors: any;
                        };
                        meta: {
                            retrieved_at: string;
                            page_id: string;
                            total_posts: any;
                        };
                    };
                    meta: object;
                }>;
                getPhotos: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        pageId: string;
                        accessToken?: string | undefined;
                        fields?: string[] | undefined;
                        limit?: number | undefined;
                        since?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                        until?: string | undefined;
                        contentType?: "photos" | undefined;
                    };
                    output: {
                        success: boolean;
                        data: any;
                        pagination: {
                            previous: any;
                            next: any;
                            cursors: any;
                        };
                        meta: {
                            retrieved_at: string;
                            page_id: string;
                            total_photos: any;
                        };
                    };
                    meta: object;
                }>;
                getVideos: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        pageId: string;
                        accessToken?: string | undefined;
                        fields?: string[] | undefined;
                        limit?: number | undefined;
                        since?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                        until?: string | undefined;
                        contentType?: "videos" | undefined;
                    };
                    output: {
                        success: boolean;
                        data: any;
                        pagination: {
                            previous: any;
                            next: any;
                            cursors: any;
                        };
                        meta: {
                            retrieved_at: string;
                            page_id: string;
                            total_videos: any;
                        };
                    };
                    meta: object;
                }>;
                getEvents: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        pageId: string;
                        accessToken?: string | undefined;
                        fields?: string[] | undefined;
                        limit?: number | undefined;
                        since?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                        until?: string | undefined;
                        contentType?: "events" | undefined;
                    };
                    output: {
                        success: boolean;
                        data: any;
                        pagination: {
                            previous: any;
                            next: any;
                            cursors: any;
                        };
                        meta: {
                            retrieved_at: string;
                            page_id: string;
                            total_events: any;
                        };
                    };
                    meta: object;
                }>;
                publishPost: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        pageId: string;
                        message?: string | undefined;
                        photos?: {
                            url: string;
                            caption?: string | undefined;
                        }[] | undefined;
                        video?: {
                            file_url: string;
                            description?: string | undefined;
                        } | undefined;
                        scheduledPublishTime?: number | undefined;
                        published?: boolean | undefined;
                        accessToken?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                    };
                    output: {
                        success: boolean;
                        data: {
                            postId: any;
                            permalink: any;
                        };
                        meta: {
                            published_at: string;
                            page_id: string;
                        };
                    };
                    meta: object;
                }>;
            }>>;
            contentCalendar: import("@trpc/server").TRPCBuiltRouter<{
                ctx: import("..").Context;
                meta: object;
                errorShape: import("@trpc/server").TRPCDefaultErrorShape;
                transformer: false;
            }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
                create: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        pageTokenId: string;
                        scheduledPublishTime: unknown;
                        message?: string | undefined;
                        mediaItems?: {
                            mediaType: "PHOTO" | "VIDEO";
                            url: string;
                            fileName?: string | undefined;
                            fileSize?: number | undefined;
                            caption?: string | undefined;
                            description?: string | undefined;
                            order?: number | undefined;
                        }[] | undefined;
                    };
                    output: {
                        id: string;
                        pageTokenId: string | null;
                        pageName: string | null;
                        message: string | null;
                        scheduledPublishTime: Date;
                        status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED";
                        published: boolean;
                        publishedAt: Date | null;
                        publishedPostId: string | null;
                        publishedPermalink: string | null;
                        lastError: string | null;
                        retryCount: number;
                        lastRetryAt: Date | null;
                        createdBy: string;
                        createdAt: Date;
                        updatedAt: Date;
                        creator?: {
                            id: string;
                            name: string;
                            email: string;
                            image: string | null;
                        } | undefined;
                        qstashJobId?: string | null | undefined;
                        mediaItems?: {
                            id: string;
                            calendarPostId: string;
                            mediaType: "PHOTO" | "VIDEO";
                            url: string;
                            fileName: string | null;
                            fileSize: number | null;
                            caption: string | null;
                            description: string | null;
                            order: number;
                            createdAt: Date;
                            updatedAt: Date;
                        }[] | undefined;
                    };
                    meta: object;
                }>;
                getAll: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        pageTokenId?: string | undefined;
                        status?: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED" | undefined;
                        limit?: number | undefined;
                        offset?: number | undefined;
                    };
                    output: {
                        posts: {
                            id: string;
                            pageTokenId: string | null;
                            pageName: string | null;
                            message: string | null;
                            scheduledPublishTime: Date;
                            status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED";
                            published: boolean;
                            publishedAt: Date | null;
                            publishedPostId: string | null;
                            publishedPermalink: string | null;
                            lastError: string | null;
                            retryCount: number;
                            lastRetryAt: Date | null;
                            createdBy: string;
                            createdAt: Date;
                            updatedAt: Date;
                            creator?: {
                                id: string;
                                name: string;
                                email: string;
                                image: string | null;
                            } | undefined;
                            qstashJobId?: string | null | undefined;
                            mediaItems?: {
                                id: string;
                                calendarPostId: string;
                                mediaType: "PHOTO" | "VIDEO";
                                url: string;
                                fileName: string | null;
                                fileSize: number | null;
                                caption: string | null;
                                description: string | null;
                                order: number;
                                createdAt: Date;
                                updatedAt: Date;
                            }[] | undefined;
                        }[];
                        total: number;
                    };
                    meta: object;
                }>;
                getById: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        id: string;
                    };
                    output: {
                        id: string;
                        pageTokenId: string | null;
                        pageName: string | null;
                        message: string | null;
                        scheduledPublishTime: Date;
                        status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED";
                        published: boolean;
                        publishedAt: Date | null;
                        publishedPostId: string | null;
                        publishedPermalink: string | null;
                        lastError: string | null;
                        retryCount: number;
                        lastRetryAt: Date | null;
                        createdBy: string;
                        createdAt: Date;
                        updatedAt: Date;
                        creator?: {
                            id: string;
                            name: string;
                            email: string;
                            image: string | null;
                        } | undefined;
                        qstashJobId?: string | null | undefined;
                        mediaItems?: {
                            id: string;
                            calendarPostId: string;
                            mediaType: "PHOTO" | "VIDEO";
                            url: string;
                            fileName: string | null;
                            fileSize: number | null;
                            caption: string | null;
                            description: string | null;
                            order: number;
                            createdAt: Date;
                            updatedAt: Date;
                        }[] | undefined;
                    };
                    meta: object;
                }>;
                update: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        id: string;
                        message?: string | undefined;
                        scheduledPublishTime?: unknown;
                        status?: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED" | undefined;
                        mediaItems?: {
                            mediaType: "PHOTO" | "VIDEO";
                            url: string;
                            fileName?: string | undefined;
                            fileSize?: number | undefined;
                            caption?: string | undefined;
                            description?: string | undefined;
                            order?: number | undefined;
                        }[] | undefined;
                    };
                    output: {
                        id: string;
                        pageTokenId: string | null;
                        pageName: string | null;
                        message: string | null;
                        scheduledPublishTime: Date;
                        status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED";
                        published: boolean;
                        publishedAt: Date | null;
                        publishedPostId: string | null;
                        publishedPermalink: string | null;
                        lastError: string | null;
                        retryCount: number;
                        lastRetryAt: Date | null;
                        createdBy: string;
                        createdAt: Date;
                        updatedAt: Date;
                        creator?: {
                            id: string;
                            name: string;
                            email: string;
                            image: string | null;
                        } | undefined;
                        qstashJobId?: string | null | undefined;
                        mediaItems?: {
                            id: string;
                            calendarPostId: string;
                            mediaType: "PHOTO" | "VIDEO";
                            url: string;
                            fileName: string | null;
                            fileSize: number | null;
                            caption: string | null;
                            description: string | null;
                            order: number;
                            createdAt: Date;
                            updatedAt: Date;
                        }[] | undefined;
                    };
                    meta: object;
                }>;
                delete: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        id: string;
                    };
                    output: {
                        success: boolean;
                        message: string;
                    };
                    meta: object;
                }>;
                getActivityLogs: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        calendarPostId: string;
                    };
                    output: {
                        id: string;
                        userId: string;
                        calendarPostId: string;
                        action: string;
                        description: string | null;
                        metadata: any;
                        ipAddress: string | null;
                        userAgent: string | null;
                        createdAt: Date;
                    }[];
                    meta: object;
                }>;
                updateMediaItem: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        mediaItemId: string;
                        caption?: string | undefined;
                        description?: string | undefined;
                    };
                    output: {
                        id: string;
                        calendarPostId: string;
                        mediaType: "PHOTO" | "VIDEO";
                        url: string;
                        fileName: string | null;
                        fileSize: number | null;
                        caption: string | null;
                        description: string | null;
                        order: number;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                    meta: object;
                }>;
                deleteMediaItem: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        mediaItemId: string;
                    };
                    output: {
                        success: boolean;
                        message: string;
                    };
                    meta: object;
                }>;
            }>>;
        }>>;
        linkedin: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            auth: import("@trpc/server").TRPCBuiltRouter<{
                ctx: import("..").Context;
                meta: object;
                errorShape: import("@trpc/server").TRPCDefaultErrorShape;
                transformer: false;
            }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
                generateToken: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        code: string;
                        redirectUri?: string | undefined;
                    };
                    output: {
                        success: boolean;
                        data: {
                            accessToken: string;
                            refreshToken: string;
                            expiresIn: number;
                            expiresAt: string;
                            refreshExpiresAt: string;
                            scope: string;
                        };
                        meta: {
                            generated_at: string;
                            integration_id: string;
                        };
                    };
                    meta: object;
                }>;
                refreshToken: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        refreshToken: string;
                    };
                    output: {
                        success: boolean;
                        data: {
                            accessToken: string;
                            refreshToken: string;
                            expiresIn: number;
                            expiresAt: string;
                            refreshExpiresAt: string;
                        };
                    };
                    meta: object;
                }>;
                generateAuthUrl: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        redirectUri?: string | undefined;
                    };
                    output: {
                        success: boolean;
                        data: {
                            url: string;
                            state: string;
                        };
                        meta: {
                            generated_at: string;
                        };
                    };
                    meta: object;
                }>;
                getStoredCredentials: import("@trpc/server").TRPCQueryProcedure<{
                    input: void;
                    output: {
                        success: boolean;
                        data: null;
                        meta: {
                            has_credentials: boolean;
                            created_at?: undefined;
                            updated_at?: undefined;
                        };
                    } | {
                        success: boolean;
                        data: {
                            integrationId: string;
                            hasAccessToken: boolean;
                            accessTokenExpiresAt: string | null;
                            isExpired: boolean | null;
                            scope: string | null;
                            status: string;
                            userId: string;
                        };
                        meta: {
                            has_credentials: boolean;
                            created_at: string;
                            updated_at: string;
                        };
                    };
                    meta: object;
                }>;
            }>>;
            pages: import("@trpc/server").TRPCBuiltRouter<{
                ctx: import("..").Context;
                meta: object;
                errorShape: import("@trpc/server").TRPCDefaultErrorShape;
                transformer: false;
            }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
                getOrganizations: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        accessToken?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                    };
                    output: {
                        success: boolean;
                        data: any;
                        meta: {
                            retrieved_at: string;
                            total_organizations: any;
                        };
                    };
                    meta: object;
                }>;
                getPageTokenId: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        pageId: string;
                    };
                    output: {
                        success: boolean;
                        data: {
                            pageTokenId: string;
                            pageId: string;
                            pageName: string | null;
                        };
                    };
                    meta: object;
                }>;
                getOrganization: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        orgId: string;
                        accessToken?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                    };
                    output: {
                        success: boolean;
                        data: any;
                        meta: {
                            retrieved_at: string;
                            organization_id: string;
                        };
                    };
                    meta: object;
                }>;
            }>>;
            content: import("@trpc/server").TRPCBuiltRouter<{
                ctx: import("..").Context;
                meta: object;
                errorShape: import("@trpc/server").TRPCDefaultErrorShape;
                transformer: false;
            }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
                getContent: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        orgId: string;
                        limit?: number | undefined;
                        accessToken?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                    };
                    output: {
                        success: boolean;
                        data: any;
                        pagination: {
                            previous: null;
                            next: null;
                            cursors: null;
                        };
                        meta: {
                            retrieved_at: string;
                            org_id: string;
                            content_type: string;
                            total_items: any;
                            note?: undefined;
                        };
                    } | {
                        success: boolean;
                        data: never[];
                        pagination: {
                            previous: null;
                            next: null;
                            cursors: null;
                        };
                        meta: {
                            retrieved_at: string;
                            org_id: string;
                            content_type: string;
                            total_items: number;
                            note: string;
                        };
                    };
                    meta: object;
                }>;
                publishPost: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        orgId: string;
                        commentary?: string | undefined;
                        photos?: {
                            url: string;
                        }[] | undefined;
                        video?: {
                            url: string;
                        } | undefined;
                        scheduledPublishTime?: number | undefined;
                        accessToken?: string | undefined;
                        apiVersion?: string | undefined;
                        useStoredToken?: boolean | undefined;
                    };
                    output: {
                        success: boolean;
                        data: {
                            postId: string;
                            urn: string;
                            permalink: string;
                        };
                        meta: {
                            published_at: string;
                            org_id: string;
                            note?: undefined;
                        };
                    } | {
                        success: boolean;
                        data: {
                            postId: string | undefined;
                            urn: string;
                            permalink: string;
                        };
                        meta: {
                            published_at: string;
                            org_id: string;
                            note: string;
                        };
                    };
                    meta: object;
                }>;
            }>>;
            contentCalendar: import("@trpc/server").TRPCBuiltRouter<{
                ctx: import("..").Context;
                meta: object;
                errorShape: import("@trpc/server").TRPCDefaultErrorShape;
                transformer: false;
            }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
                create: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        pageTokenId: string;
                        scheduledPublishTime: unknown;
                        message?: string | undefined;
                        mediaItems?: {
                            mediaType: "PHOTO" | "VIDEO";
                            url: string;
                            fileName?: string | undefined;
                            fileSize?: number | undefined;
                            caption?: string | undefined;
                            description?: string | undefined;
                            order?: number | undefined;
                        }[] | undefined;
                    };
                    output: {
                        id: string;
                        pageTokenId: string | null;
                        pageName: string | null;
                        message: string | null;
                        scheduledPublishTime: Date;
                        status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED";
                        published: boolean;
                        publishedAt: Date | null;
                        publishedPostId: string | null;
                        publishedPermalink: string | null;
                        lastError: string | null;
                        retryCount: number;
                        lastRetryAt: Date | null;
                        createdBy: string;
                        createdAt: Date;
                        updatedAt: Date;
                        creator?: {
                            id: string;
                            name: string;
                            email: string;
                            image: string | null;
                        } | undefined;
                        qstashJobId?: string | null | undefined;
                        mediaItems?: {
                            id: string;
                            calendarPostId: string;
                            mediaType: "PHOTO" | "VIDEO";
                            url: string;
                            fileName: string | null;
                            fileSize: number | null;
                            caption: string | null;
                            description: string | null;
                            order: number;
                            createdAt: Date;
                            updatedAt: Date;
                        }[] | undefined;
                    };
                    meta: object;
                }>;
                getAll: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        pageTokenId?: string | undefined;
                        status?: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED" | undefined;
                        limit?: number | undefined;
                        offset?: number | undefined;
                    };
                    output: {
                        posts: {
                            id: string;
                            pageTokenId: string | null;
                            pageName: string | null;
                            message: string | null;
                            scheduledPublishTime: Date;
                            status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED";
                            published: boolean;
                            publishedAt: Date | null;
                            publishedPostId: string | null;
                            publishedPermalink: string | null;
                            lastError: string | null;
                            retryCount: number;
                            lastRetryAt: Date | null;
                            createdBy: string;
                            createdAt: Date;
                            updatedAt: Date;
                            creator?: {
                                id: string;
                                name: string;
                                email: string;
                                image: string | null;
                            } | undefined;
                            qstashJobId?: string | null | undefined;
                            mediaItems?: {
                                id: string;
                                calendarPostId: string;
                                mediaType: "PHOTO" | "VIDEO";
                                url: string;
                                fileName: string | null;
                                fileSize: number | null;
                                caption: string | null;
                                description: string | null;
                                order: number;
                                createdAt: Date;
                                updatedAt: Date;
                            }[] | undefined;
                        }[];
                        total: number;
                    };
                    meta: object;
                }>;
                getById: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        id: string;
                    };
                    output: {
                        id: string;
                        pageTokenId: string | null;
                        pageName: string | null;
                        message: string | null;
                        scheduledPublishTime: Date;
                        status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED";
                        published: boolean;
                        publishedAt: Date | null;
                        publishedPostId: string | null;
                        publishedPermalink: string | null;
                        lastError: string | null;
                        retryCount: number;
                        lastRetryAt: Date | null;
                        createdBy: string;
                        createdAt: Date;
                        updatedAt: Date;
                        creator?: {
                            id: string;
                            name: string;
                            email: string;
                            image: string | null;
                        } | undefined;
                        qstashJobId?: string | null | undefined;
                        mediaItems?: {
                            id: string;
                            calendarPostId: string;
                            mediaType: "PHOTO" | "VIDEO";
                            url: string;
                            fileName: string | null;
                            fileSize: number | null;
                            caption: string | null;
                            description: string | null;
                            order: number;
                            createdAt: Date;
                            updatedAt: Date;
                        }[] | undefined;
                    };
                    meta: object;
                }>;
                update: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        id: string;
                        message?: string | undefined;
                        scheduledPublishTime?: unknown;
                        status?: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED" | undefined;
                        mediaItems?: {
                            mediaType: "PHOTO" | "VIDEO";
                            url: string;
                            fileName?: string | undefined;
                            fileSize?: number | undefined;
                            caption?: string | undefined;
                            description?: string | undefined;
                            order?: number | undefined;
                        }[] | undefined;
                    };
                    output: {
                        id: string;
                        pageTokenId: string | null;
                        pageName: string | null;
                        message: string | null;
                        scheduledPublishTime: Date;
                        status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED";
                        published: boolean;
                        publishedAt: Date | null;
                        publishedPostId: string | null;
                        publishedPermalink: string | null;
                        lastError: string | null;
                        retryCount: number;
                        lastRetryAt: Date | null;
                        createdBy: string;
                        createdAt: Date;
                        updatedAt: Date;
                        creator?: {
                            id: string;
                            name: string;
                            email: string;
                            image: string | null;
                        } | undefined;
                        qstashJobId?: string | null | undefined;
                        mediaItems?: {
                            id: string;
                            calendarPostId: string;
                            mediaType: "PHOTO" | "VIDEO";
                            url: string;
                            fileName: string | null;
                            fileSize: number | null;
                            caption: string | null;
                            description: string | null;
                            order: number;
                            createdAt: Date;
                            updatedAt: Date;
                        }[] | undefined;
                    };
                    meta: object;
                }>;
                delete: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        id: string;
                    };
                    output: {
                        success: boolean;
                        message: string;
                    };
                    meta: object;
                }>;
                getActivityLogs: import("@trpc/server").TRPCQueryProcedure<{
                    input: {
                        calendarPostId: string;
                    };
                    output: {
                        id: string;
                        userId: string;
                        calendarPostId: string;
                        action: string;
                        description: string | null;
                        metadata: any;
                        ipAddress: string | null;
                        userAgent: string | null;
                        createdAt: Date;
                    }[];
                    meta: object;
                }>;
                updateMediaItem: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        mediaItemId: string;
                        caption?: string | undefined;
                        description?: string | undefined;
                    };
                    output: {
                        id: string;
                        calendarPostId: string;
                        mediaType: "PHOTO" | "VIDEO";
                        url: string;
                        fileName: string | null;
                        fileSize: number | null;
                        caption: string | null;
                        description: string | null;
                        order: number;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                    meta: object;
                }>;
                deleteMediaItem: import("@trpc/server").TRPCMutationProcedure<{
                    input: {
                        mediaItemId: string;
                    };
                    output: {
                        success: boolean;
                        message: string;
                    };
                    meta: object;
                }>;
            }>>;
        }>>;
    }>>;
    googleAds: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        auth: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            generateAuthUrl: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    redirectUri?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: {
                        url: string;
                        state: string;
                    };
                    meta: {
                        generated_at: string;
                    };
                };
                meta: object;
            }>;
            generateToken: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    code: string;
                    redirectUri?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: {
                        accessToken: string;
                        refreshToken: string;
                        tokenType: string;
                        expiresIn: number;
                        expiresAt: string;
                    };
                    meta: {
                        generated_at: string;
                        integration_id: string;
                    };
                };
                meta: object;
            }>;
            getStoredCredentials: import("@trpc/server").TRPCQueryProcedure<{
                input: void;
                output: {
                    success: boolean;
                    data: null;
                    meta: {
                        has_credentials: boolean;
                        created_at?: undefined;
                        updated_at?: undefined;
                    };
                } | {
                    success: boolean;
                    data: {
                        integrationId: string;
                        hasAccessToken: boolean;
                        hasRefreshToken: boolean;
                        accessTokenExpiresAt: string | null;
                        isExpired: boolean | null;
                        scope: string | null;
                        status: string;
                        userId: string;
                        connected: boolean;
                    };
                    meta: {
                        has_credentials: boolean;
                        created_at: string;
                        updated_at: string;
                    };
                };
                meta: object;
            }>;
            revokeToken: import("@trpc/server").TRPCMutationProcedure<{
                input: void;
                output: {
                    success: boolean;
                    data: {
                        revoked: boolean;
                    };
                    meta: {
                        revoked_at: string;
                    };
                };
                meta: object;
            }>;
        }>>;
        accounts: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listAccessibleAccounts: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    forceRefresh?: boolean | undefined;
                } | undefined;
                output: {
                    success: boolean;
                    data: {
                        customerId: string;
                        accountName: string | null;
                        currencyCode: string | null;
                        timeZone: string | null;
                        status: string;
                        resourceName: string;
                    }[];
                    meta: {
                        retrieved_at: string;
                        total_accounts: number;
                        source: string;
                    };
                };
                meta: object;
            }>;
            getAccountDetails: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    customerId: string;
                };
                output: {
                    success: boolean;
                    data: {
                        customerId: string;
                        accountName: any;
                        currencyCode: any;
                        timeZone: any;
                        status: "ACTIVE" | "PAUSED" | "REMOVED";
                    };
                    meta: {
                        retrieved_at: string;
                        account_id: string;
                    };
                };
                meta: object;
            }>;
        }>>;
        campaigns: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listCampaigns: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    customerId: string;
                    timeRange?: {
                        since: string;
                        until: string;
                    } | undefined;
                };
                output: {
                    success: boolean;
                    data: {
                        id: string;
                        name: string;
                        status: string;
                        advertising_channel_type: string | undefined;
                        advertising_channel_sub_type: string | undefined;
                        start_date: string | undefined;
                        end_date: string | undefined;
                        bidding_strategy_type: string | undefined;
                        budget_amount: number | null;
                        budget_period: string | undefined;
                        insights: {
                            impressions: string | null;
                            clicks: string | null;
                            cost: string | null;
                            ctr: string | null;
                            cpc: string | null;
                            conversions: string | null;
                            cost_per_conversion: string | null;
                            conversion_rate: string | null;
                            search_impression_share: string | null;
                        };
                    }[];
                    meta: {
                        retrieved_at: string;
                        total_campaigns: number;
                    };
                };
                meta: object;
            }>;
            getCampaignDetails: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    customerId: string;
                    campaignId: string;
                };
                output: {
                    success: boolean;
                    data: {
                        id: string;
                        name: any;
                        status: string;
                        advertising_channel_type: string | undefined;
                        advertising_channel_sub_type: string | undefined;
                        start_date: any;
                        end_date: any;
                        bidding_strategy_type: string | undefined;
                        budget_amount: number | null;
                        budget_period: string | undefined;
                    };
                };
                meta: object;
            }>;
        }>>;
        adGroups: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listAdGroups: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    customerId: string;
                    campaignId: string;
                    timeRange?: {
                        since: string;
                        until: string;
                    } | undefined;
                };
                output: {
                    success: boolean;
                    data: {
                        id: string;
                        name: string;
                        status: string;
                        type: string | undefined;
                        cpc_bid: number | null;
                        cpm_bid: number | null;
                        target_cpa: number | null;
                        target_roas: number | undefined;
                        insights: {
                            impressions: string | null;
                            clicks: string | null;
                            cost: string | null;
                            ctr: string | null;
                            cpc: string | null;
                            conversions: string | null;
                            cost_per_conversion: string | null;
                        };
                    }[];
                    meta: {
                        retrieved_at: string;
                        total_ad_groups: number;
                    };
                };
                meta: object;
            }>;
        }>>;
        ads: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listAds: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    customerId: string;
                    adGroupId: string;
                    timeRange?: {
                        since: string;
                        until: string;
                    } | undefined;
                };
                output: {
                    success: boolean;
                    data: {
                        id: string;
                        name: string;
                        type: string | undefined;
                        status: string;
                        headlines: string[] | undefined;
                        descriptions: string[] | undefined;
                        headline_part1: string | undefined;
                        headline_part2: string | undefined;
                        headline_part3: string | undefined;
                        description: string | undefined;
                        description2: string | undefined;
                        insights: {
                            impressions: string | null;
                            clicks: string | null;
                            cost: string | null;
                            ctr: string | null;
                            cpc: string | null;
                            conversions: string | null;
                            cost_per_conversion: string | null;
                        };
                    }[];
                    meta: {
                        retrieved_at: string;
                        total_ads: number;
                    };
                };
                meta: object;
            }>;
        }>>;
        insights: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getDailyPerformance: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    customerId: string;
                    campaignId: string;
                    timeRange: {
                        since: string;
                        until: string;
                    };
                };
                output: {
                    success: boolean;
                    data: {
                        date: string | undefined;
                        impressions: string;
                        clicks: string;
                        spend: string;
                        conversions: string;
                        conversions_value: string;
                        interaction_rate: string;
                        cpc: string;
                        ctr: string;
                    }[];
                };
                meta: object;
            }>;
            getBreakdowns: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    customerId: string;
                    campaignId: string;
                    timeRange: {
                        since: string;
                        until: string;
                    };
                    breakdown: "device" | "region" | "gender" | "age_range" | "search_terms";
                };
                output: {
                    success: boolean;
                    data: Record<string, any>[];
                };
                meta: object;
            }>;
            getKeywordsPerformance: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    customerId: string;
                    campaignId: string;
                    timeRange: {
                        since: string;
                        until: string;
                    };
                };
                output: {
                    success: boolean;
                    data: {
                        keyword: string | undefined;
                        matchType: string;
                        status: string;
                        impressions: number;
                        clicks: number;
                        spend: string;
                        ctr: string;
                        cpc: string;
                        conversions: number;
                    }[];
                };
                meta: object;
            }>;
            getNetworkBreakdown: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    customerId: string;
                    campaignId: string;
                    timeRange: {
                        since: string;
                        until: string;
                    };
                };
                output: {
                    success: boolean;
                    data: {
                        network: string;
                        impressions: number;
                        clicks: number;
                        spend: string;
                    }[];
                };
                meta: object;
            }>;
            getTimeOfDayBreakdown: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    customerId: string;
                    campaignId: string;
                    timeRange: {
                        since: string;
                        until: string;
                    };
                };
                output: {
                    success: boolean;
                    data: {
                        dayOfWeek: string;
                        hour: number | undefined;
                        impressions: number;
                        clicks: number;
                        spend: string;
                    }[];
                };
                meta: object;
            }>;
        }>>;
    }>>;
    metaAds: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        auth: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getStoredCredentials: import("@trpc/server").TRPCQueryProcedure<{
                input: void;
                output: {
                    success: boolean;
                    data: {
                        connected: boolean;
                        hasAccessToken: boolean;
                        accessTokenExpiresAt: null;
                        isExpired: boolean;
                        scope: null;
                        status: null;
                        integrationId?: undefined;
                        userId?: undefined;
                    };
                    meta: {
                        has_credentials: boolean;
                        created_at?: undefined;
                        updated_at?: undefined;
                    };
                } | {
                    success: boolean;
                    data: {
                        integrationId: string;
                        hasAccessToken: boolean;
                        accessTokenExpiresAt: string | null;
                        isExpired: boolean | null;
                        scope: string | null;
                        status: string;
                        userId: string;
                        connected: boolean;
                    };
                    meta: {
                        has_credentials: boolean;
                        created_at: string;
                        updated_at: string;
                    };
                };
                meta: object;
            }>;
        }>>;
        accounts: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listAdAccounts: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    forceRefresh?: boolean | undefined;
                } | undefined;
                output: {
                    success: boolean;
                    data: {
                        id: string;
                        accountId: string;
                        accountName: string | null;
                        currency: string | null;
                        timezone: string | null;
                        status: string;
                        spendLimit: string | null;
                        amountSpent: string | null;
                        balance: string | null;
                        updatedAt: Date;
                    }[];
                    meta: {
                        retrieved_at: string;
                        total_accounts: number;
                        source: string;
                    };
                } | {
                    success: boolean;
                    data: {
                        id: string;
                        accountId: string;
                        accountName: string | null;
                        currency: string | null;
                        timezone: string | null;
                        status: "ACTIVE" | "CLOSED" | "DISABLED" | "UNSETTLED" | "PENDING_REVIEW" | "IN_GRACE_PERIOD" | "PENDING_CLOSURE";
                        spendLimit: string | null;
                        amountSpent: string | null;
                        balance: string | null;
                        updatedAt: string;
                    }[];
                    meta: {
                        retrieved_at: string;
                        total_accounts: number;
                        source: string;
                    };
                };
                meta: object;
            }>;
            getAccountDetails: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accountId: string;
                };
                output: {
                    success: boolean;
                    data: {
                        status: "ACTIVE" | "CLOSED" | "DISABLED" | "UNSETTLED" | "PENDING_REVIEW" | "IN_GRACE_PERIOD" | "PENDING_CLOSURE";
                        account_id: string;
                        name?: string;
                        currency?: string;
                        timezone_name?: string;
                        account_status?: number;
                        spend_cap?: string;
                        amount_spent?: string;
                        balance?: string;
                    };
                };
                meta: object;
            }>;
        }>>;
        campaigns: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listCampaigns: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accountId: string;
                    datePreset?: string | undefined;
                    timeRange?: {
                        since: string;
                        until: string;
                    } | undefined;
                };
                output: {
                    success: boolean;
                    data: any[];
                    meta: {
                        retrieved_at: string;
                        total_campaigns: number;
                        paging: {
                            cursors?: {
                                before?: string;
                                after?: string;
                            };
                            next?: string;
                            previous?: string;
                        } | undefined;
                    };
                };
                meta: object;
            }>;
            getCampaignDetails: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accountId: string;
                    campaignId: string;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        adSets: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listAdSets: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    campaignId: string;
                    datePreset?: string | undefined;
                    timeRange?: {
                        since?: string | undefined;
                        until?: string | undefined;
                    } | undefined;
                };
                output: {
                    data: {
                        id: any;
                        name: any;
                        status: string;
                        daily_budget: string | null;
                        lifetime_budget: string | null;
                        budget_remaining: string | null;
                        bid_amount: any;
                        targeting: any;
                        start_time: any;
                        stop_time: any;
                        created_time: any;
                        updated_time: any;
                        insights: {
                            reach: string | null;
                            impressions: string | null;
                            clicks: string | null;
                            link_clicks: string | null;
                            cpc: string | null;
                            ctr: string | null;
                            spend: string | null;
                            cpm: string | null;
                            cpp: string | null;
                            frequency: string | null;
                            unique_clicks: string | null;
                            unique_ctr: string | null;
                            purchase_roas: any;
                            quality_ranking: any;
                            engagement_rate_ranking: any;
                            conversion_rate_ranking: any;
                            cost_per_result: string | null;
                            leads: string | null;
                            cost_per_lead: string | null;
                            actions: any;
                        } | null;
                    }[];
                    paging: {
                        cursors?: {
                            before?: string;
                            after?: string;
                        };
                        next?: string;
                        previous?: string;
                    } | undefined;
                };
                meta: object;
            }>;
            getAdSetDetails: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    adSetId: string;
                };
                output: {
                    data: {
                        id: any;
                        name: any;
                        status: string;
                        daily_budget: any;
                        lifetime_budget: any;
                        budget_remaining: any;
                        bid_amount: any;
                        targeting: any;
                        start_time: any;
                        stop_time: any;
                        created_time: any;
                        updated_time: any;
                    };
                };
                meta: object;
            }>;
            getTargetingSentenceLines: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    adSetId: string;
                };
                output: {
                    data: {
                        content: string;
                        children?: string[];
                    }[];
                };
                meta: object;
            }>;
            getBulkTargetingSentenceLines: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    adSetIds: string[];
                };
                output: {
                    data: Record<string, any[]>;
                };
                meta: object;
            }>;
        }>>;
        ads: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listAds: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    adSetId: string;
                    datePreset?: string | undefined;
                    timeRange?: {
                        since?: string | undefined;
                        until?: string | undefined;
                    } | undefined;
                };
                output: {
                    data: {
                        id: any;
                        name: any;
                        status: string;
                        creative: any;
                        created_time: any;
                        updated_time: any;
                        insights: {
                            reach: string | null;
                            impressions: string | null;
                            clicks: string | null;
                            link_clicks: string | null;
                            cpc: string | null;
                            ctr: string | null;
                            spend: string | null;
                            cpm: string | null;
                            cpp: string | null;
                            frequency: string | null;
                            unique_clicks: string | null;
                            unique_ctr: string | null;
                            purchase_roas: any;
                            quality_ranking: any;
                            engagement_rate_ranking: any;
                            conversion_rate_ranking: any;
                            cost_per_result: string | null;
                            leads: string | null;
                            cost_per_lead: string | null;
                            actions: any;
                        } | null;
                    }[];
                    paging: {
                        cursors?: {
                            before?: string;
                            after?: string;
                        };
                        next?: string;
                        previous?: string;
                    } | undefined;
                };
                meta: object;
            }>;
            getAdDetails: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    adId: string;
                };
                output: {
                    data: {
                        id: any;
                        name: any;
                        status: string;
                        creative: any;
                        created_time: any;
                        updated_time: any;
                    };
                };
                meta: object;
            }>;
            listCampaignAds: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accountId: string;
                    campaignId: string;
                    datePreset?: string | undefined;
                    timeRange?: {
                        since?: string | undefined;
                        until?: string | undefined;
                    } | undefined;
                };
                output: {
                    data: {
                        id: any;
                        adset_id: any;
                        name: any;
                        status: string;
                        creative: any;
                        created_time: any;
                        updated_time: any;
                        insights: {
                            reach: string | null;
                            impressions: string | null;
                            clicks: string | null;
                            link_clicks: string | null;
                            cpc: string | null;
                            ctr: string | null;
                            spend: string | null;
                            cpm: string | null;
                            cpp: string | null;
                            frequency: string | null;
                            unique_clicks: string | null;
                            unique_ctr: string | null;
                            purchase_roas: any;
                            quality_ranking: any;
                            engagement_rate_ranking: any;
                            conversion_rate_ranking: any;
                            cost_per_result: string | null;
                            leads: string | null;
                            cost_per_lead: string | null;
                            actions: any;
                        } | null;
                    }[];
                    paging: {
                        cursors?: {
                            before?: string;
                            after?: string;
                        };
                        next?: string;
                        previous?: string;
                    } | undefined;
                };
                meta: object;
            }>;
        }>>;
        insights: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getDailyPerformance: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    entityId: string;
                    level: "campaign" | "ad" | "adset";
                    timeRange: {
                        since: string;
                        until: string;
                    };
                };
                output: {
                    success: boolean;
                    data: any[];
                };
                meta: object;
            }>;
            getBreakdowns: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    entityId: string;
                    level: "campaign" | "ad" | "adset";
                    timeRange: {
                        since: string;
                        until: string;
                    };
                    breakdown: "region" | "gender" | "age" | "publisher_platform" | "device_platform" | "platform_position" | "hourly_stats_aggregated_by_audience_time_zone";
                };
                output: {
                    success: boolean;
                    data: any[];
                };
                meta: object;
            }>;
        }>>;
    }>>;
    linkedInAds: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        auth: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getStoredCredentials: import("@trpc/server").TRPCQueryProcedure<{
                input: void;
                output: {
                    success: boolean;
                    data: {
                        connected: boolean;
                        hasAccessToken: boolean;
                        accessTokenExpiresAt: null;
                        isExpired: boolean;
                        scope: null;
                        status: null;
                        integrationId?: undefined;
                        userId?: undefined;
                        hasAdsScopes?: undefined;
                    };
                    meta: {
                        has_credentials: boolean;
                        created_at?: undefined;
                        updated_at?: undefined;
                    };
                } | {
                    success: boolean;
                    data: {
                        integrationId: string;
                        hasAccessToken: boolean;
                        accessTokenExpiresAt: string | null;
                        isExpired: boolean | null;
                        scope: string | null;
                        status: string;
                        userId: string;
                        connected: boolean;
                        hasAdsScopes: boolean;
                    };
                    meta: {
                        has_credentials: boolean;
                        created_at: string;
                        updated_at: string;
                    };
                };
                meta: object;
            }>;
            generateAuthUrl: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    redirectUri?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: {
                        url: string;
                        state: string;
                    };
                    meta: {
                        generated_at: string;
                    };
                };
                meta: object;
            }>;
        }>>;
        accounts: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listAdAccounts: import("@trpc/server").TRPCQueryProcedure<{
                input: void;
                output: {
                    success: boolean;
                    data: {
                        id: string;
                        name: string | null;
                        currency: string | null;
                        timezone: string | null;
                        status: string | null;
                        servingStatuses: string[];
                        reference: string | null;
                        type: string | null;
                    }[];
                    meta: {
                        retrieved_at: string;
                        total_accounts: number;
                        paging: {
                            count?: number;
                            start?: number;
                            links?: Array<{
                                rel: string;
                                href: string;
                            }>;
                        } | undefined;
                    };
                } | {
                    success: boolean;
                    data: never[];
                    meta: {
                        retrieved_at: string;
                        total_accounts: number;
                        paging?: undefined;
                    };
                };
                meta: object;
            }>;
            getAccountDetails: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accountId: string;
                };
                output: {
                    success: boolean;
                    data: {
                        id: string;
                        name: string | null;
                        currency: string | null;
                        timezone: string | null;
                        status: string | null;
                        servingStatuses: string[];
                        reference: string | null;
                        type: string | null;
                    };
                };
                meta: object;
            }>;
        }>>;
        campaignGroups: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listCampaignGroups: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accountId: string;
                    datePreset?: string | undefined;
                    timeRange?: {
                        since: string;
                        until: string;
                    } | undefined;
                };
                output: {
                    success: boolean;
                    data: any[];
                    meta: {
                        retrieved_at: string;
                        total_campaign_groups: number;
                        paging: {
                            count?: number;
                            start?: number;
                            links?: Array<{
                                rel: string;
                                href: string;
                            }>;
                        } | undefined;
                    };
                };
                meta: object;
            }>;
            getCampaignGroupDetails: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accountId: string;
                    campaignGroupId: string;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        campaigns: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listCampaigns: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accountId: string;
                    campaignGroupId: string;
                    timeRange?: {
                        since?: string | undefined;
                        until?: string | undefined;
                    } | undefined;
                };
                output: {
                    success: boolean;
                    data: any[];
                    meta: {
                        retrieved_at: string;
                        total_campaigns: number;
                        paging: {
                            count?: number;
                            start?: number;
                            links?: Array<{
                                rel: string;
                                href: string;
                            }>;
                        } | undefined;
                        insightsDiagnostics: {
                            requested: boolean;
                            responseElements: number;
                            mappedCampaigns: number;
                            error: string | null;
                        };
                    };
                };
                meta: object;
            }>;
            resolveTargetingCriteria: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    targetingCriteria: any;
                };
                output: {
                    data: {
                        label: string;
                        content: string;
                    }[];
                    debug: {
                        facetKey: string;
                        url: string;
                        statusCode: number;
                        resolvedCount: number;
                        rawResponse: string;
                    }[];
                };
                meta: object;
            }>;
            getCampaignDetails: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    campaignGroupId: string;
                    campaignId: string;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        creatives: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listAccountCreatives: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accountId: string;
                    pageSize?: number | undefined;
                    pageToken?: string | undefined;
                    campaignIds?: string[] | undefined;
                };
                output: {
                    success: boolean;
                    data: {
                        id: any;
                        name: any;
                        campaign: any;
                        account: any;
                        intendedStatus: string | null;
                        reviewStatus: string | null;
                        isServing: boolean;
                        servingHoldReasons: string[];
                        contentReference: any;
                        inlineContent: any;
                        leadgenCallToAction: {
                            label: string | null;
                            destination: any;
                        } | null;
                        createdAt: any;
                        lastModifiedAt: any;
                    }[];
                    meta: {
                        retrieved_at: string;
                        total_creatives: number;
                        nextPageToken: string | null;
                    };
                };
                meta: object;
            }>;
            getCreativePreview: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accountId: string;
                    creativeId: string;
                    livePreviewCreative?: {
                        campaign: string;
                        intendedStatus?: string | undefined;
                        contentReference?: string | undefined;
                        inlineContent?: Record<any, unknown> | undefined;
                    } | undefined;
                };
                output: {
                    success: boolean;
                    data: {
                        preview: any;
                        creative: any;
                        placement: any;
                    }[];
                    meta: {
                        retrieved_at: string;
                        total_previews: number;
                        previewSource: "none" | "accurate" | "live_action";
                        unsupportedCreativeType: boolean;
                        message?: undefined;
                    };
                } | {
                    success: boolean;
                    data: never[];
                    meta: {
                        retrieved_at: string;
                        total_previews: number;
                        unsupportedCreativeType: boolean;
                        message: string;
                        previewSource?: undefined;
                    };
                };
                meta: object;
            }>;
            listCreatives: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accountId: string;
                    campaignId: string;
                    timeRange?: {
                        since?: string | undefined;
                        until?: string | undefined;
                    } | undefined;
                };
                output: {
                    success: boolean;
                    data: any[];
                    meta: {
                        retrieved_at: string;
                        total_creatives: number;
                        paging: {
                            count?: number;
                            start?: number;
                            links?: Array<{
                                rel: string;
                                href: string;
                            }>;
                        } | undefined;
                    };
                };
                meta: object;
            }>;
            getCreativeDetails: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    campaignId: string;
                    creativeId: string;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        standardizedData: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getSeniorities: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accessToken: string;
                    start?: number | undefined;
                    count?: number | undefined;
                };
                output: any;
                meta: object;
            }>;
            getIndustries: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accessToken: string;
                    start?: number | undefined;
                    count?: number | undefined;
                };
                output: any;
                meta: object;
            }>;
            getFunctions: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accessToken: string;
                    start?: number | undefined;
                    count?: number | undefined;
                };
                output: any;
                meta: object;
            }>;
            getTitles: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accessToken: string;
                    start?: number | undefined;
                    count?: number | undefined;
                };
                output: any;
                meta: object;
            }>;
            getTitlesByIds: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accessToken: string;
                    ids: string[];
                };
                output: any;
                meta: object;
            }>;
            getSkills: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accessToken: string;
                    start?: number | undefined;
                    count?: number | undefined;
                };
                output: any;
                meta: object;
            }>;
            getSkillsByIds: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accessToken: string;
                    ids: string[];
                };
                output: any;
                meta: object;
            }>;
            getDegrees: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accessToken: string;
                    start?: number | undefined;
                    count?: number | undefined;
                };
                output: any;
                meta: object;
            }>;
            getDegreesByIds: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accessToken: string;
                    ids: string[];
                };
                output: any;
                meta: object;
            }>;
            getFieldsOfStudy: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accessToken: string;
                    start?: number | undefined;
                    count?: number | undefined;
                };
                output: any;
                meta: object;
            }>;
            getFieldsOfStudyByIds: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    accessToken: string;
                    ids: string[];
                };
                output: any;
                meta: object;
            }>;
        }>>;
    }>>;
    imageGenStudio: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        projects: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    name: string;
                    json: string;
                    width: number;
                    height: number;
                    teamId?: string | undefined;
                };
                output: {
                    data: {
                        id: string;
                        name: string;
                        json: string;
                        width: number;
                        height: number;
                        thumbnailUrl: string | null;
                        userId: string;
                        teamId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                };
                meta: object;
            }>;
            get: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: string;
                };
                output: {
                    data: {
                        id: string;
                        name: string;
                        json: string;
                        width: number;
                        height: number;
                        thumbnailUrl: string | null;
                        userId: string;
                        teamId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                };
                meta: object;
            }>;
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    page?: number | undefined;
                    limit?: number | undefined;
                    teamId?: string | undefined;
                };
                output: {
                    data: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        teamId: string | null;
                        thumbnailUrl: string | null;
                        height: number;
                        width: number;
                    }[];
                    nextPage: number | null;
                };
                meta: object;
            }>;
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                    name?: string | undefined;
                    json?: string | undefined;
                    width?: number | undefined;
                    height?: number | undefined;
                    thumbnailUrl?: string | undefined;
                };
                output: {
                    data: {
                        id: string;
                        name: string;
                        json: string;
                        width: number;
                        height: number;
                        thumbnailUrl: string | null;
                        userId: string;
                        teamId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                };
                meta: object;
            }>;
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    data: {
                        id: string;
                    };
                };
                meta: object;
            }>;
            duplicate: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    data: {
                        id: string;
                        name: string;
                        json: string;
                        width: number;
                        height: number;
                        thumbnailUrl: string | null;
                        userId: string;
                        teamId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                };
                meta: object;
            }>;
        }>>;
        templates: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    name: string;
                    json: string;
                    width: number;
                    height: number;
                    isPublic?: boolean | undefined;
                };
                output: {
                    data: {
                        id: string;
                        name: string;
                        json: string;
                        width: number;
                        height: number;
                        thumbnailUrl: string | null;
                        isPublic: boolean;
                        userId: string;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                };
                meta: object;
            }>;
            get: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: string;
                };
                output: {
                    data: {
                        id: string;
                        name: string;
                        json: string;
                        width: number;
                        height: number;
                        thumbnailUrl: string | null;
                        isPublic: boolean;
                        userId: string;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                };
                meta: object;
            }>;
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    page?: number | undefined;
                    limit?: number | undefined;
                };
                output: {
                    data: {
                        id: string;
                        name: string;
                        json: string;
                        width: number;
                        height: number;
                        thumbnailUrl: string | null;
                        isPublic: boolean;
                        userId: string;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                };
                meta: object;
            }>;
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                    name?: string | undefined;
                    json?: string | undefined;
                    width?: number | undefined;
                    height?: number | undefined;
                    thumbnailUrl?: string | undefined;
                    isPublic?: boolean | undefined;
                };
                output: {
                    data: {
                        id: string;
                        name: string;
                        json: string;
                        width: number;
                        height: number;
                        thumbnailUrl: string | null;
                        isPublic: boolean;
                        userId: string;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                };
                meta: object;
            }>;
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    data: {
                        id: string;
                    };
                };
                meta: object;
            }>;
        }>>;
        ai: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            generateImage: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    prompt: string;
                    referenceImageUrls?: string[] | undefined;
                    teamId?: string | undefined;
                };
                output: {
                    data: string;
                    generationId: string;
                };
                meta: object;
            }>;
            updateGenerationAfterUpload: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    generationId: string;
                    imageUrl: string;
                    imageKey: string;
                    imageFileName: string;
                    imageSize: number;
                    imageMimeType: string;
                };
                output: {
                    data: {
                        id: string;
                    };
                };
                meta: object;
            }>;
            removeBg: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    image: string;
                };
                output: {
                    data: string;
                };
                meta: object;
            }>;
        }>>;
        images: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    page?: number | undefined;
                    perPage?: number | undefined;
                    query?: string | undefined;
                };
                output: {
                    data: any[];
                    hasMore: boolean;
                };
                meta: object;
            }>;
        }>>;
        uploads: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    fileUrl: string;
                    fileKey: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileMetadata?: Record<string, any> | undefined;
                    teamId?: string | undefined;
                };
                output: {
                    data: {
                        id: string;
                        fileUrl: string;
                        fileName: string;
                        fileSize: number;
                        mimeType: string;
                        fileMetadata: Record<string, any> | null;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                };
                meta: object;
            }>;
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    page?: number | undefined;
                    limit?: number | undefined;
                    teamId?: string | undefined;
                };
                output: {
                    data: {
                        id: string;
                        fileUrl: string;
                        fileName: string;
                        fileSize: number;
                        mimeType: string;
                        fileMetadata: Record<string, any> | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                    nextPage: number | null;
                };
                meta: object;
            }>;
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    data: {
                        id: string;
                    };
                };
                meta: object;
            }>;
        }>>;
        aiGenerations: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    page?: number | undefined;
                    limit?: number | undefined;
                    teamId?: string | undefined;
                };
                output: {
                    data: {
                        id: string;
                        prompt: string;
                        referenceImageUrls: string[];
                        imageUrl: string;
                        imageFileName: string;
                        imageSize: number;
                        imageMimeType: string;
                        imageMetadata: Record<string, any> | null;
                        modelId: string;
                        modelName: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                    nextPage: number | null;
                };
                meta: object;
            }>;
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    data: {
                        id: string;
                    };
                };
                meta: object;
            }>;
        }>>;
    }>>;
    stabilityAi: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        generate: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                prompt: string;
                negativePrompt?: string | undefined;
                aspectRatio?: "21:9" | "16:9" | "3:2" | "5:4" | "1:1" | "4:5" | "2:3" | "9:16" | "9:21" | undefined;
                stylePreset?: "3d-model" | "analog-film" | "anime" | "cinematic" | "comic-book" | "digital-art" | "enhance" | "fantasy-art" | "isometric" | "line-art" | "low-poly" | "modeling-compound" | "neon-punk" | "origami" | "photographic" | "pixel-art" | "tile-texture" | undefined;
                seed?: number | undefined;
                outputFormat?: "webp" | "jpeg" | "png" | undefined;
                model?: "core" | "ultra" | "sd3" | undefined;
                sd3Model?: "sd3.5-large" | "sd3.5-large-turbo" | "sd3.5-medium" | "sd3.5-flash" | undefined;
            };
            output: {
                image: string;
                mimeType: string;
                seed: number;
                finishReason: string;
            };
            meta: object;
        }>;
        removeBackground: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                image: string;
                outputFormat?: "webp" | "jpeg" | "png" | undefined;
            };
            output: {
                image: string;
                mimeType: string;
                seed: number | null;
                finishReason: string;
            };
            meta: object;
        }>;
    }>>;
    imageGenerator: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        startGeneration: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                prompt: string;
                referenceImageUrls?: string[] | undefined;
                aspectRatio?: "21:9" | "16:9" | "3:2" | "5:4" | "1:1" | "4:5" | "2:3" | "9:16" | "3:4" | "4:3" | undefined;
                outputFormat?: "png" | "jpg" | undefined;
                resolution?: "1K" | "2K" | "4K" | undefined;
                variations?: number | undefined;
                teamId?: string | undefined;
            };
            output: {
                generationId: string;
                status: "QUEUED" | "PROCESSING" | "FAILED" | "COMPLETED";
                variationsCount: number;
            };
            meta: object;
        }>;
        generateImage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                prompt: string;
                referenceImageUrls?: string[] | undefined;
                aspectRatio?: "21:9" | "16:9" | "3:2" | "5:4" | "1:1" | "4:5" | "2:3" | "9:16" | "3:4" | "4:3" | undefined;
                outputFormat?: "png" | "jpg" | undefined;
                resolution?: "1K" | "2K" | "4K" | undefined;
                variations?: number | undefined;
                teamId?: string | undefined;
            };
            output: {
                generationId: `${string}-${string}-${string}-${string}-${string}`;
                variations: {
                    id: string;
                    variationIndex: number;
                    imageUrl: string;
                    imageFileName: string;
                    imageSize: number;
                    imageMimeType: string;
                }[];
            };
            meta: object;
        }>;
        updateVariationAfterUpload: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                variationId: string;
                imageUrl: string;
                imageKey: string;
                imageFileName: string;
                imageSize: number;
                imageMimeType: string;
            };
            output: {
                data: {
                    id: string;
                };
            };
            meta: object;
        }>;
        getGenerations: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                page?: number | undefined;
                limit?: number | undefined;
                teamId?: string | undefined;
            };
            output: {
                data: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    prompt: string;
                    referenceImageUrls: string[] | null;
                    aspectRatio: string;
                    outputFormat: string;
                    resolution: string;
                    variationsCount: number;
                    modelId: string;
                    modelName: string | null;
                    status: "QUEUED" | "PROCESSING" | "FAILED" | "COMPLETED";
                    errorMessage: string | null;
                    qstashMessageId: string | null;
                    startedAt: Date | null;
                    completedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    variations: {
                        id: string;
                        imageGeneratorGenerationId: string;
                        variationIndex: number;
                        status: "PROCESSING" | "FAILED" | "COMPLETED";
                        errorMessage: string | null;
                        imageUrl: string | null;
                        imageKey: string | null;
                        imageFileName: string | null;
                        imageSize: number | null;
                        imageMimeType: string | null;
                        imageMetadata: Record<string, any> | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                }[];
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    totalPages: number;
                };
            };
            meta: object;
        }>;
        getGenerationById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                userId: string;
                teamId: string | null;
                prompt: string;
                referenceImageUrls: string[] | null;
                aspectRatio: string;
                outputFormat: string;
                resolution: string;
                variationsCount: number;
                modelId: string;
                modelName: string | null;
                status: "QUEUED" | "PROCESSING" | "FAILED" | "COMPLETED";
                errorMessage: string | null;
                qstashMessageId: string | null;
                startedAt: Date | null;
                completedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                variations: {
                    id: string;
                    imageGeneratorGenerationId: string;
                    variationIndex: number;
                    status: "PROCESSING" | "FAILED" | "COMPLETED";
                    errorMessage: string | null;
                    imageUrl: string | null;
                    imageKey: string | null;
                    imageFileName: string | null;
                    imageSize: number | null;
                    imageMimeType: string | null;
                    imageMetadata: Record<string, any> | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
            };
            meta: object;
        }>;
        deleteGeneration: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                data: {
                    id: string;
                };
            };
            meta: object;
        }>;
    }>>;
    backgroundRemover: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        startBackgroundRemoval: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                image: string;
                teamId?: string | undefined;
                originalImageKey?: string | undefined;
                originalImageFileName?: string | undefined;
                originalImageSize?: number | undefined;
                originalImageMimeType?: string | undefined;
            };
            output: {
                generationId: string;
                status: "QUEUED" | "PROCESSING" | "FAILED" | "COMPLETED";
            };
            meta: object;
        }>;
        removeBackground: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                image: string;
                teamId?: string | undefined;
            };
            output: {
                data: string;
                generationId: string;
            };
            meta: object;
        }>;
        updateGenerationAfterUpload: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                generationId: string;
                originalImageUrl: string;
                originalImageKey: string;
                originalImageFileName: string;
                originalImageSize: number;
                originalImageMimeType: string;
                processedImageUrl: string;
                processedImageKey: string;
                processedImageFileName: string;
                processedImageSize: number;
                processedImageMimeType: string;
            };
            output: {
                data: {
                    id: string;
                };
            };
            meta: object;
        }>;
        getGenerations: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                page?: number | undefined;
                limit?: number | undefined;
                teamId?: string | undefined;
            };
            output: {
                data: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    originalImageUrl: string;
                    originalImageKey: string;
                    originalImageFileName: string;
                    originalImageSize: number;
                    originalImageMimeType: string;
                    originalImageMetadata: Record<string, any> | null;
                    processedImageUrl: string | null;
                    processedImageKey: string | null;
                    processedImageFileName: string | null;
                    processedImageSize: number | null;
                    processedImageMimeType: string | null;
                    processedImageMetadata: Record<string, any> | null;
                    modelId: string;
                    modelName: string | null;
                    status: "QUEUED" | "PROCESSING" | "FAILED" | "COMPLETED";
                    errorMessage: string | null;
                    qstashMessageId: string | null;
                    startedAt: Date | null;
                    completedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    totalPages: number;
                };
            };
            meta: object;
        }>;
        deleteGeneration: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                data: {
                    id: string;
                };
            };
            meta: object;
        }>;
    }>>;
    paymentGateway: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        mpesa: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            initiateStkPush: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    phoneNumber: string;
                    amount: number;
                    accountReference: string;
                    transactionDesc?: string | undefined;
                    callbackUrl?: string | undefined;
                    teamId?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: {
                        transactionId: `${string}-${string}-${string}-${string}-${string}`;
                        merchantRequestId: string;
                        checkoutRequestId: string;
                        responseCode: string;
                        responseDescription: string;
                        customerMessage: string;
                    };
                };
                meta: object;
            }>;
            getPaymentStatusByCheckoutId: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    checkoutRequestId: string;
                };
                output: {
                    status: null;
                    resultCode: null;
                    resultDesc: null;
                } | {
                    status: string;
                    resultCode: string | null;
                    resultDesc: string | null;
                };
                meta: object;
            }>;
            queryStkPush: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    checkoutRequestId: string;
                };
                output: {
                    success: boolean;
                    data: {
                        responseCode: string;
                        responseDescription: string;
                        merchantRequestId: string;
                        checkoutRequestId: string;
                        resultCode: string;
                        resultDesc: string;
                    };
                };
                meta: object;
            }>;
        }>>;
    }>>;
    paymentTransactions: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
                status?: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "REFUNDED" | "SUCCESS" | "PARTIALLY_REFUNDED" | undefined;
                gateway?: "MPESA" | "OTHER" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE" | undefined;
            };
            output: {
                transactions: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    userName: string | null;
                    gateway: "MPESA" | "OTHER" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE";
                    status: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "REFUNDED" | "SUCCESS" | "PARTIALLY_REFUNDED";
                    amount: string;
                    currency: string;
                    accountReference: string | null;
                    transactionDesc: string | null;
                    receiptNumber: string | null;
                    initiatedAt: Date;
                    processedAt: Date | null;
                    failedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                total: number;
            };
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                userId: string;
                teamId: string | null;
                userName: string | null;
                teamName: string | null;
                gateway: "MPESA" | "OTHER" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE";
                gatewayStatus: string | null;
                gatewayMessage: string | null;
                gatewayTransactionId: string | null;
                merchantRequestId: string | null;
                checkoutRequestId: string | null;
                receiptNumber: string | null;
                amount: string;
                paidAmount: string | null;
                currency: string;
                accountReference: string | null;
                transactionDesc: string | null;
                phoneNumber: string | null;
                status: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "REFUNDED" | "SUCCESS" | "PARTIALLY_REFUNDED";
                rawResponse: unknown;
                rawError: unknown;
                initiatedAt: Date;
                processedAt: Date | null;
                failedAt: Date | null;
                refundedAt: Date | null;
                notes: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
    }>>;
    pagespeedInsights: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getPageSpeed: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                url: string;
                strategy?: "mobile" | "desktop" | undefined;
                forceRefresh?: boolean | undefined;
            };
            output: any;
            meta: object;
        }>;
    }>>;
    seoReports: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getAutomatedReport: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                siteId: string;
                from: string;
                to: string;
                ga4PropertyId?: string | undefined;
            };
            output: {
                summary: {
                    totalImpressions: number;
                    totalImpressionsPrev: number;
                    totalClicks: number;
                    totalClicksPrev: number;
                    averageCtr: number;
                    averageCtrPrev: number;
                    averagePosition: number;
                    averagePositionPrev: number;
                    totalSessions?: number | undefined;
                    totalSessionsPrev?: number | undefined;
                    totalUsers?: number | undefined;
                    totalUsersPrev?: number | undefined;
                    averageEngagementRate?: number | undefined;
                    averageEngagementRatePrev?: number | undefined;
                    totalConversions?: number | undefined;
                    totalConversionsPrev?: number | undefined;
                    averageBounceRate?: number | undefined;
                    averageBounceRatePrev?: number | undefined;
                    averageSessionDuration?: number | undefined;
                    averageSessionDurationPrev?: number | undefined;
                };
                timeSeries: {
                    date: string;
                    clicks: number;
                    impressions: number;
                    sessions: number;
                    conversions: number;
                    engagementRate?: number | undefined;
                    totalUsers?: number | undefined;
                    bounceRate?: number | undefined;
                    averageSessionDuration?: number | undefined;
                }[];
                topKeywords: {
                    query: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                }[];
                topPages: {
                    top: {
                        url: string;
                        clicks: number;
                        impressions: number;
                        ctr: number;
                        position: number;
                        clicksChange?: number | undefined;
                        sessions?: number | undefined;
                        engagementRate?: number | undefined;
                        conversions?: number | undefined;
                        bounceRate?: number | undefined;
                        averageSessionDuration?: number | undefined;
                    }[];
                    trendingUp: {
                        url: string;
                        clicks: number;
                        impressions: number;
                        ctr: number;
                        position: number;
                        clicksChange?: number | undefined;
                        sessions?: number | undefined;
                        engagementRate?: number | undefined;
                        conversions?: number | undefined;
                        bounceRate?: number | undefined;
                        averageSessionDuration?: number | undefined;
                    }[];
                    trendingDown: {
                        url: string;
                        clicks: number;
                        impressions: number;
                        ctr: number;
                        position: number;
                        clicksChange?: number | undefined;
                        sessions?: number | undefined;
                        engagementRate?: number | undefined;
                        conversions?: number | undefined;
                        bounceRate?: number | undefined;
                        averageSessionDuration?: number | undefined;
                    }[];
                };
                topCountries: {
                    country: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                }[];
                topDevices: {
                    device: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                }[];
                searchAppearance: {
                    appearance: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                }[];
                opportunities: {
                    pageTwo: {
                        query: string;
                        clicks: number;
                        impressions: number;
                        ctr: number;
                        position: number;
                        type: "PAGE_TWO" | "CTR_BOOST";
                    }[];
                    highPotential: {
                        query: string;
                        clicks: number;
                        impressions: number;
                        ctr: number;
                        position: number;
                        type: "PAGE_TWO" | "CTR_BOOST";
                    }[];
                };
                sitemaps: {
                    path: string;
                    errors: number;
                    warnings: number;
                    status: string;
                    issues: string[];
                    lastDownloaded?: string | undefined;
                    lastSubmitted?: string | undefined;
                    type?: string | undefined;
                    indexedUrls?: number | undefined;
                    submittedUrls?: number | undefined;
                }[];
            };
            meta: object;
        }>;
        listManageableSites: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                siteUrl: string;
                permissionLevel?: string | null | undefined;
                ga4PropertyId?: string | null | undefined;
                ga4DisplayName?: string | null | undefined;
            }[];
            meta: object;
        }>;
        listGa4Properties: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                propertyId: string;
                displayName: string;
                defaultUrl: string | null;
            }[];
            meta: object;
        }>;
        getGa4Report: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                ga4PropertyId: string;
                from: string;
                to: string;
            };
            output: {
                summary: {
                    totalImpressions: number;
                    totalImpressionsPrev: number;
                    totalClicks: number;
                    totalClicksPrev: number;
                    averageCtr: number;
                    averageCtrPrev: number;
                    averagePosition: number;
                    averagePositionPrev: number;
                    totalSessions?: number | undefined;
                    totalSessionsPrev?: number | undefined;
                    totalUsers?: number | undefined;
                    totalUsersPrev?: number | undefined;
                    averageEngagementRate?: number | undefined;
                    averageEngagementRatePrev?: number | undefined;
                    totalConversions?: number | undefined;
                    totalConversionsPrev?: number | undefined;
                    averageBounceRate?: number | undefined;
                    averageBounceRatePrev?: number | undefined;
                    averageSessionDuration?: number | undefined;
                    averageSessionDurationPrev?: number | undefined;
                };
                timeSeries: {
                    date: string;
                    clicks: number;
                    impressions: number;
                    sessions: number;
                    conversions: number;
                    engagementRate?: number | undefined;
                    totalUsers?: number | undefined;
                    bounceRate?: number | undefined;
                    averageSessionDuration?: number | undefined;
                }[];
                topKeywords: {
                    query: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                }[];
                topPages: {
                    top: {
                        url: string;
                        clicks: number;
                        impressions: number;
                        ctr: number;
                        position: number;
                        clicksChange?: number | undefined;
                        sessions?: number | undefined;
                        engagementRate?: number | undefined;
                        conversions?: number | undefined;
                        bounceRate?: number | undefined;
                        averageSessionDuration?: number | undefined;
                    }[];
                    trendingUp: {
                        url: string;
                        clicks: number;
                        impressions: number;
                        ctr: number;
                        position: number;
                        clicksChange?: number | undefined;
                        sessions?: number | undefined;
                        engagementRate?: number | undefined;
                        conversions?: number | undefined;
                        bounceRate?: number | undefined;
                        averageSessionDuration?: number | undefined;
                    }[];
                    trendingDown: {
                        url: string;
                        clicks: number;
                        impressions: number;
                        ctr: number;
                        position: number;
                        clicksChange?: number | undefined;
                        sessions?: number | undefined;
                        engagementRate?: number | undefined;
                        conversions?: number | undefined;
                        bounceRate?: number | undefined;
                        averageSessionDuration?: number | undefined;
                    }[];
                };
                topCountries: {
                    country: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                }[];
                topDevices: {
                    device: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                }[];
                searchAppearance: {
                    appearance: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                }[];
                opportunities: {
                    pageTwo: {
                        query: string;
                        clicks: number;
                        impressions: number;
                        ctr: number;
                        position: number;
                        type: "PAGE_TWO" | "CTR_BOOST";
                    }[];
                    highPotential: {
                        query: string;
                        clicks: number;
                        impressions: number;
                        ctr: number;
                        position: number;
                        type: "PAGE_TWO" | "CTR_BOOST";
                    }[];
                };
                sitemaps: {
                    path: string;
                    errors: number;
                    warnings: number;
                    status: string;
                    issues: string[];
                    lastDownloaded?: string | undefined;
                    lastSubmitted?: string | undefined;
                    type?: string | undefined;
                    indexedUrls?: number | undefined;
                    submittedUrls?: number | undefined;
                }[];
            };
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId?: string | undefined;
                status?: "DRAFT" | "FINAL" | undefined;
                reportName?: string | undefined;
                reportYear?: string | undefined;
                reportMonth?: string | undefined;
                search?: string | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                reports: {
                    id: string;
                    reportName: string;
                    reportMonth: string;
                    reportYear: string;
                    websiteUrl: string | null;
                    status: "DRAFT" | "FINAL";
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    sessions: string | null;
                    totalWebTraffic: string | null;
                    bounceRate: string | null;
                    impressions: string | null;
                    clicks: string | null;
                    conversions: string | null;
                }[];
                total: number;
            };
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                userId: string;
                teamId: string | null;
                reportName: string;
                reportMonth: string;
                reportYear: string;
                websiteUrl: string | null;
                status: "DRAFT" | "FINAL";
                recommendations: string | null;
                sessions: string | null;
                totalWebTraffic: string | null;
                totalViews: string | null;
                bounceRate: string | null;
                users: string | null;
                returningUsers: string | null;
                eventCount: string | null;
                conversions: string | null;
                sessionDuration: string | null;
                engagedSessions: string | null;
                sessionsDesktop: string | null;
                sessionsMobile: string | null;
                sessionsTablet: string | null;
                formSubmissions: string | null;
                impressions: string | null;
                clicks: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                reportName: string;
                reportMonth: string;
                reportYear: string;
                teamId?: string | null | undefined;
                websiteUrl?: string | null | undefined;
                status?: "DRAFT" | "FINAL" | undefined;
                recommendations?: string | undefined;
                sessions?: string | undefined;
                totalWebTraffic?: string | undefined;
                totalViews?: string | undefined;
                bounceRate?: string | undefined;
                users?: string | undefined;
                returningUsers?: string | undefined;
                eventCount?: string | undefined;
                conversions?: string | undefined;
                sessionDuration?: string | undefined;
                engagedSessions?: string | undefined;
                sessionsDesktop?: string | undefined;
                sessionsMobile?: string | undefined;
                sessionsTablet?: string | undefined;
                formSubmissions?: string | undefined;
                impressions?: string | undefined;
                clicks?: string | undefined;
            };
            output: {
                id: string;
                userId: string;
                teamId: string | null;
                reportName: string;
                reportMonth: string;
                reportYear: string;
                websiteUrl: string | null;
                status: "DRAFT" | "FINAL";
                recommendations: string | null;
                sessions: string | null;
                totalWebTraffic: string | null;
                totalViews: string | null;
                bounceRate: string | null;
                users: string | null;
                returningUsers: string | null;
                eventCount: string | null;
                conversions: string | null;
                sessionDuration: string | null;
                engagedSessions: string | null;
                sessionsDesktop: string | null;
                sessionsMobile: string | null;
                sessionsTablet: string | null;
                formSubmissions: string | null;
                impressions: string | null;
                clicks: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
    }>>;
    emailMarketing: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        domains: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    domainName: string;
                    teamId?: string | null | undefined;
                };
                output: {
                    id: string;
                    domainName: string;
                    status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                    resendDomainId: string | null;
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    verifiedAt: Date | null;
                    verificationStatus: string | null;
                    verificationData: unknown;
                    dnsRecords: unknown;
                };
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: string;
                };
                output: {
                    id: string;
                    domainName: string;
                    status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                    resendDomainId: string | null;
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    verifiedAt: Date | null;
                    verificationStatus: string | null;
                    verificationData: unknown;
                    dnsRecords: unknown;
                };
                meta: object;
            }>;
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    teamId?: string | null | undefined;
                    status?: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED" | undefined;
                    search?: string | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    domains: {
                        id: string;
                        domainName: string;
                        status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                        resendDomainId: string | null;
                        userId: string;
                        teamId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        verifiedAt: Date | null;
                    }[];
                    total: number;
                };
                meta: object;
            }>;
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                    domainName?: string | undefined;
                    verificationStatus?: string | null | undefined;
                    verificationData?: unknown;
                    dnsRecords?: unknown;
                    status?: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED" | undefined;
                };
                output: {
                    id: string;
                    domainName: string;
                    status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                    resendDomainId: string | null;
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    verifiedAt: Date | null;
                    verificationStatus: string | null;
                    verificationData: unknown;
                    dnsRecords: unknown;
                };
                meta: object;
            }>;
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    success: boolean;
                };
                meta: object;
            }>;
            verify: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    id: string;
                    domainName: string;
                    status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                    resendDomainId: string | null;
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    verifiedAt: Date | null;
                    verificationStatus: string | null;
                    verificationData: unknown;
                    dnsRecords: unknown;
                };
                meta: object;
            }>;
        }>>;
        campaigns: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    name: string;
                    subject: string;
                    fromEmail: string;
                    recipientEmails: string[];
                    description?: string | null | undefined;
                    fromName?: string | null | undefined;
                    emailDomainId?: string | null | undefined;
                    htmlContent?: string | null | undefined;
                    textContent?: string | null | undefined;
                    scheduledAt?: unknown;
                    teamId?: string | null | undefined;
                };
                output: {
                    id: string;
                    name: string;
                    subject: string;
                    fromEmail: string;
                    status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "COMPLETED";
                    recipientCount: number;
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    scheduledAt: Date | null;
                    sentAt: Date | null;
                    description: string | null;
                    fromName: string | null;
                    emailDomainId: string | null;
                    htmlContent: string | null;
                    textContent: string | null;
                    recipients: {
                        id: string;
                        campaignId: string;
                        toEmail: string;
                        resendId: string | null;
                        resendMessageId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                };
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: string;
                };
                output: {
                    id: string;
                    name: string;
                    subject: string;
                    fromEmail: string;
                    status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "COMPLETED";
                    recipientCount: number;
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    scheduledAt: Date | null;
                    sentAt: Date | null;
                    description: string | null;
                    fromName: string | null;
                    emailDomainId: string | null;
                    htmlContent: string | null;
                    textContent: string | null;
                    recipients: {
                        id: string;
                        campaignId: string;
                        toEmail: string;
                        resendId: string | null;
                        resendMessageId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                };
                meta: object;
            }>;
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    teamId?: string | null | undefined;
                    status?: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "COMPLETED" | undefined;
                    search?: string | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    campaigns: {
                        id: string;
                        name: string;
                        subject: string;
                        fromEmail: string;
                        status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "COMPLETED";
                        recipientCount: number;
                        userId: string;
                        teamId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        scheduledAt: Date | null;
                        sentAt: Date | null;
                    }[];
                    total: number;
                };
                meta: object;
            }>;
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                    name?: string | undefined;
                    description?: string | null | undefined;
                    subject?: string | undefined;
                    fromEmail?: string | undefined;
                    fromName?: string | null | undefined;
                    recipientEmails?: string[] | undefined;
                    emailDomainId?: string | null | undefined;
                    htmlContent?: string | null | undefined;
                    textContent?: string | null | undefined;
                    scheduledAt?: unknown;
                };
                output: {
                    id: string;
                    name: string;
                    subject: string;
                    fromEmail: string;
                    status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "COMPLETED";
                    recipientCount: number;
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    scheduledAt: Date | null;
                    sentAt: Date | null;
                    description: string | null;
                    fromName: string | null;
                    emailDomainId: string | null;
                    htmlContent: string | null;
                    textContent: string | null;
                    recipients: {
                        id: string;
                        campaignId: string;
                        toEmail: string;
                        resendId: string | null;
                        resendMessageId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                };
                meta: object;
            }>;
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    success: boolean;
                };
                meta: object;
            }>;
            send: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                    immediate?: boolean | undefined;
                };
                output: {
                    success: boolean;
                    message: string;
                    sendJobId: string;
                    messageId: string;
                    scheduledFor: number | null;
                };
                meta: object;
            }>;
            cancel: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    success: boolean;
                    cancelledAt: string;
                };
                meta: object;
            }>;
            addRecipients: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    campaignId: string;
                    emails: string[];
                };
                output: {
                    added: number;
                };
                meta: object;
            }>;
            listRecipients: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    campaignId: string;
                    search?: string | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    recipients: {
                        id: string;
                        campaignId: string;
                        toEmail: string;
                        resendId: string | null;
                        resendMessageId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                    total: number;
                };
                meta: object;
            }>;
        }>>;
        emailEvents: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getGlobalEvents: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    from?: unknown;
                    to?: unknown;
                };
                output: {
                    type: "email_bounced" | "email_clicked" | "email_complained" | "email_delivered" | "email_delivery_delayed" | "email_failed" | "email_opened" | "email_received" | "email_scheduled" | "email_sent" | "email_suppressed";
                    eventCreatedAt: Date;
                }[];
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: string;
                };
                output: {
                    id: string;
                    campaignRecipientId: string;
                    type: "email_bounced" | "email_clicked" | "email_complained" | "email_delivered" | "email_delivery_delayed" | "email_failed" | "email_opened" | "email_received" | "email_scheduled" | "email_sent" | "email_suppressed";
                    eventCreatedAt: Date;
                    resendEmailId: string | null;
                    data: unknown;
                    createdAt: Date;
                };
                meta: object;
            }>;
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    campaignRecipientId?: string | undefined;
                    campaignId?: string | undefined;
                    type?: "email_bounced" | "email_clicked" | "email_complained" | "email_delivered" | "email_delivery_delayed" | "email_failed" | "email_opened" | "email_received" | "email_scheduled" | "email_sent" | "email_suppressed" | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    events: {
                        id: string;
                        campaignRecipientId: string;
                        type: "email_bounced" | "email_clicked" | "email_complained" | "email_delivered" | "email_delivery_delayed" | "email_failed" | "email_opened" | "email_received" | "email_scheduled" | "email_sent" | "email_suppressed";
                        eventCreatedAt: Date;
                        resendEmailId: string | null;
                        data: unknown;
                        createdAt: Date;
                        recipientEmail?: string | null | undefined;
                    }[];
                    total: number;
                };
                meta: object;
            }>;
            getCampaignSummary: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    campaignId: string;
                };
                output: {
                    delivered: number;
                    bounced: number;
                    suppressed: number;
                    opened: number;
                    openedTotal: number;
                    clicked: number;
                    clickedTotal: number;
                    complained: number;
                    unsubscribed: number;
                    totalRecipients: number;
                };
                meta: object;
            }>;
            getTopClickedLinks: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    campaignId: string;
                    limit?: number | undefined;
                };
                output: {
                    url: string;
                    clicks: number;
                }[];
                meta: object;
            }>;
        }>>;
        audiences: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    name: string;
                    description?: string | null | undefined;
                    teamId?: string | null | undefined;
                };
                output: {
                    id: string;
                    name: string;
                    description: string | null;
                    userId: string | null;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    contactsCount: number;
                    subscribedCount: number;
                    unsubscribedCount: number;
                };
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: string;
                };
                output: {
                    id: string;
                    name: string;
                    description: string | null;
                    userId: string | null;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    contactsCount: number;
                    subscribedCount: number;
                    unsubscribedCount: number;
                };
                meta: object;
            }>;
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    teamId?: string | null | undefined;
                    search?: string | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    audiences: {
                        id: string;
                        name: string;
                        description: string | null;
                        userId: string | null;
                        teamId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        contactsCount: number;
                    }[];
                    total: number;
                };
                meta: object;
            }>;
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                    name?: string | undefined;
                    description?: string | null | undefined;
                };
                output: {
                    id: string;
                    name: string;
                    description: string | null;
                    userId: string | null;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    contactsCount: number;
                    subscribedCount: number;
                    unsubscribedCount: number;
                };
                meta: object;
            }>;
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    success: boolean;
                };
                meta: object;
            }>;
            addContact: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    audienceId: string;
                    name?: string | null | undefined;
                    phoneNumber?: string | null | undefined;
                    emailAddress?: string | null | undefined;
                    description?: string | null | undefined;
                    company?: string | null | undefined;
                    status?: "SUBSCRIBED" | "UNSUBSCRIBED" | undefined;
                };
                output: {
                    id: string;
                    audienceId: string;
                    name: string | null;
                    phoneNumber: string | null;
                    emailAddress: string | null;
                    description: string | null;
                    company: string | null;
                    status: "SUBSCRIBED" | "UNSUBSCRIBED" | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
                meta: object;
            }>;
            addContactsBulk: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    audienceId: string;
                    contacts: {
                        name?: string | null | undefined;
                        phoneNumber?: string | null | undefined;
                        emailAddress?: string | null | undefined;
                        description?: string | null | undefined;
                        company?: string | null | undefined;
                        status?: "SUBSCRIBED" | "UNSUBSCRIBED" | null | undefined;
                    }[];
                };
                output: {
                    added: number;
                };
                meta: object;
            }>;
            updateContact: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                    audienceId: string;
                    name?: string | null | undefined;
                    phoneNumber?: string | null | undefined;
                    emailAddress?: string | null | undefined;
                    description?: string | null | undefined;
                    company?: string | null | undefined;
                    status?: "SUBSCRIBED" | "UNSUBSCRIBED" | null | undefined;
                };
                output: {
                    id: string;
                    audienceId: string;
                    name: string | null;
                    phoneNumber: string | null;
                    emailAddress: string | null;
                    description: string | null;
                    company: string | null;
                    status: "SUBSCRIBED" | "UNSUBSCRIBED" | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
                meta: object;
            }>;
            deleteContact: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                    audienceId: string;
                };
                output: {
                    success: boolean;
                };
                meta: object;
            }>;
            deleteAllContacts: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    audienceId: string;
                };
                output: {
                    deleted: number;
                };
                meta: object;
            }>;
            listContacts: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    audienceId: string;
                    search?: string | undefined;
                    status?: "SUBSCRIBED" | "UNSUBSCRIBED" | undefined;
                    from?: unknown;
                    to?: unknown;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    contacts: {
                        id: string;
                        audienceId: string;
                        name: string | null;
                        phoneNumber: string | null;
                        emailAddress: string | null;
                        description: string | null;
                        company: string | null;
                        status: "SUBSCRIBED" | "UNSUBSCRIBED" | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                    total: number;
                };
                meta: object;
            }>;
        }>>;
    }>>;
    niscEmailMarketing: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        audiences: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    name: string;
                    description?: string | null | undefined;
                    teamId?: string | null | undefined;
                };
                output: {
                    id: `${string}-${string}-${string}-${string}-${string}`;
                };
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: string;
                };
                output: {
                    id: string;
                    name: string;
                    description: string | null;
                    userId: string | null;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    contactsCount: number;
                    subscribedCount: number;
                    unsubscribedCount: number;
                };
                meta: object;
            }>;
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    ok: boolean;
                };
                meta: object;
            }>;
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    teamId?: string | null | undefined;
                    search?: string | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    audiences: {
                        id: string;
                        name: string;
                        description: string | null;
                        userId: string | null;
                        teamId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        contactsCount: number;
                    }[];
                    total: number;
                };
                meta: object;
            }>;
            addContactsBulk: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    audienceId: string;
                    contacts: {
                        name?: string | null | undefined;
                        phoneNumber?: string | null | undefined;
                        emailAddress?: string | null | undefined;
                        description?: string | null | undefined;
                        company?: string | null | undefined;
                        status?: "SUBSCRIBED" | "UNSUBSCRIBED" | null | undefined;
                    }[];
                };
                output: {
                    added: number;
                };
                meta: object;
            }>;
            deleteContact: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                    audienceId: string;
                };
                output: {
                    ok: boolean;
                };
                meta: object;
            }>;
            deleteAllContacts: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    audienceId: string;
                };
                output: {
                    deleted: number;
                };
                meta: object;
            }>;
            listContacts: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    audienceId: string;
                    search?: string | undefined;
                    status?: "SUBSCRIBED" | "UNSUBSCRIBED" | undefined;
                    from?: unknown;
                    to?: unknown;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    contacts: {
                        id: string;
                        audienceId: string;
                        name: string | null;
                        phoneNumber: string | null;
                        emailAddress: string | null;
                        description: string | null;
                        company: string | null;
                        status: "SUBSCRIBED" | "UNSUBSCRIBED" | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                    total: number;
                };
                meta: object;
            }>;
        }>>;
        campaigns: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    teamId?: string | null | undefined;
                    status?: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "COMPLETED" | undefined;
                    search?: string | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    campaigns: {
                        id: string;
                        name: string;
                        subject: string;
                        fromEmail: string;
                        status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "COMPLETED";
                        recipientCount: number;
                        userId: string;
                        teamId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        scheduledAt: Date | null;
                        sentAt: Date | null;
                    }[];
                    total: number;
                };
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: string;
                };
                output: {
                    id: string;
                    name: string;
                    subject: string;
                    fromEmail: string;
                    status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "COMPLETED";
                    recipientCount: number;
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    scheduledAt: Date | null;
                    sentAt: Date | null;
                    description: string | null;
                    fromName: string | null;
                    emailDomainId: string | null;
                    htmlContent: string | null;
                    textContent: string | null;
                    recipients: {
                        id: string;
                        campaignId: string;
                        toEmail: string;
                        resendId: string | null;
                        resendMessageId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                };
                meta: object;
            }>;
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    name: string;
                    subject: string;
                    fromEmail: string;
                    recipientEmails: string[];
                    description?: string | null | undefined;
                    fromName?: string | null | undefined;
                    emailDomainId?: string | null | undefined;
                    htmlContent?: string | null | undefined;
                    textContent?: string | null | undefined;
                    scheduledAt?: unknown;
                    teamId?: string | null | undefined;
                };
                output: {
                    id: `${string}-${string}-${string}-${string}-${string}`;
                };
                meta: object;
            }>;
            send: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                    immediate?: boolean | undefined;
                };
                output: {
                    ok: boolean;
                    status: string;
                    qstashMessageId?: undefined;
                } | {
                    ok: boolean;
                    qstashMessageId: string;
                    status?: undefined;
                };
                meta: object;
            }>;
            cancel: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    cancelledAt: string;
                };
                meta: object;
            }>;
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    ok: boolean;
                };
                meta: object;
            }>;
        }>>;
        domains: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            listAllVerified: import("@trpc/server").TRPCQueryProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    domains: {
                        id: string;
                        domainName: string;
                    }[];
                };
                meta: object;
            }>;
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    domainName: string;
                    teamId?: string | null | undefined;
                };
                output: {
                    id: string;
                    domainName: string;
                    status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                    resendDomainId: string | null;
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    verifiedAt: Date | null;
                    verificationStatus: string | null;
                    verificationData: unknown;
                    dnsRecords: unknown;
                };
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: string;
                };
                output: {
                    id: string;
                    domainName: string;
                    status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                    resendDomainId: string | null;
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    verifiedAt: Date | null;
                    verificationStatus: string | null;
                    verificationData: unknown;
                    dnsRecords: unknown;
                };
                meta: object;
            }>;
            verify: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    id: string;
                    domainName: string;
                    status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                    resendDomainId: string | null;
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    verifiedAt: Date | null;
                    verificationStatus: string | null;
                    verificationData: unknown;
                    dnsRecords: unknown;
                };
                meta: object;
            }>;
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    ok: boolean;
                };
                meta: object;
            }>;
            listLegacy: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    teamId?: string | null | undefined;
                    status?: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED" | undefined;
                    search?: string | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    domains: {
                        id: string;
                        domainName: string;
                        status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                        resendDomainId: string | null;
                        userId: string;
                        teamId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        verifiedAt: Date | null;
                    }[];
                    total: number;
                };
                meta: object;
            }>;
            add: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    domainName: string;
                    teamId?: string | null | undefined;
                };
                output: {
                    id: string;
                    domainName: string;
                    status: "PENDING" | "FAILED" | "VERIFIED" | "DELETING";
                    dkimStatus: "NotStarted" | "Pending" | "Success" | "Failed" | "TemporaryFailure";
                    mailFromMode: "DEFAULT" | "CUSTOM";
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    verifiedAt: Date | null;
                    dkimTokens: string[];
                    feedbackForwardingDisabled: boolean;
                    mailFromStatus?: string | null | undefined;
                    dnsRecords?: unknown;
                    mailFromDomain?: string | null | undefined;
                };
                meta: object;
            }>;
            verifyCheck: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    id: string;
                    domainName: string;
                    status: "PENDING" | "FAILED" | "VERIFIED" | "DELETING";
                    dkimStatus: "NotStarted" | "Pending" | "Success" | "Failed" | "TemporaryFailure";
                    mailFromMode: "DEFAULT" | "CUSTOM";
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    verifiedAt: Date | null;
                    dkimTokens: string[];
                    feedbackForwardingDisabled: boolean;
                    mailFromStatus?: string | null | undefined;
                    dnsRecords?: unknown;
                    mailFromDomain?: string | null | undefined;
                };
                meta: object;
            }>;
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    teamId?: string | null | undefined;
                    status?: "PENDING" | "FAILED" | "VERIFIED" | "DELETING" | undefined;
                    search?: string | null | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    domains: {
                        id: string;
                        domainName: string;
                        status: "PENDING" | "FAILED" | "VERIFIED" | "DELETING";
                        dkimStatus: "NotStarted" | "Pending" | "Success" | "Failed" | "TemporaryFailure";
                        mailFromMode: "DEFAULT" | "CUSTOM";
                        userId: string;
                        teamId: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        verifiedAt: Date | null;
                        mailFromStatus?: string | null | undefined;
                    }[];
                    total: number;
                };
                meta: object;
            }>;
            remove: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    success: boolean;
                };
                meta: object;
            }>;
        }>>;
        emailEvents: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getCampaignSummary: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    campaignId: string;
                };
                output: {
                    delivered: number;
                    bounced: number;
                    suppressed: number;
                    opened: number;
                    openedTotal: number;
                    clicked: number;
                    clickedTotal: number;
                    complained: number;
                    unsubscribed: number;
                    totalRecipients: number;
                };
                meta: object;
            }>;
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    campaignRecipientId?: string | undefined;
                    campaignId?: string | undefined;
                    type?: "email_bounced" | "email_clicked" | "email_complained" | "email_delivered" | "email_delivery_delayed" | "email_failed" | "email_opened" | "email_received" | "email_scheduled" | "email_sent" | "email_suppressed" | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    events: {
                        id: string;
                        campaignRecipientId: string;
                        type: "email_bounced" | "email_clicked" | "email_complained" | "email_delivered" | "email_delivery_delayed" | "email_failed" | "email_opened" | "email_received" | "email_scheduled" | "email_sent" | "email_suppressed";
                        eventCreatedAt: Date;
                        resendEmailId: string | null;
                        data: unknown;
                        createdAt: Date;
                        recipientEmail?: string | null | undefined;
                    }[];
                    total: number;
                };
                meta: object;
            }>;
            getTopClickedLinks: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    campaignId: string;
                    limit?: number | undefined;
                };
                output: {
                    url: string;
                    clicks: number;
                }[];
                meta: object;
            }>;
        }>>;
        quota: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            status: import("@trpc/server").TRPCQueryProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    windowStart: Date;
                    windowEnd: Date;
                    maxSendRate: number;
                    max24HourSend: number;
                    sentLast24HoursAtStart: number;
                    reservedEmails: number;
                    remainingEmails: number;
                };
                meta: object;
            }>;
        }>>;
        sesUsage: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            quotaLive: import("@trpc/server").TRPCQueryProcedure<{
                input: Record<string, never> | undefined;
                output: {
                    maxSendRate: number;
                    max24HourSend: number;
                    sentLast24Hours: number;
                    remaining24HourSend: number;
                };
                meta: object;
            }>;
            listDomainsLive: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    limit?: number | undefined;
                } | undefined;
                output: {
                    domains: {
                        id: string;
                        domainName: string;
                        status: string;
                        verificationStatus: import("@aws-sdk/client-ses").VerificationStatus;
                        dnsRecords: {
                            record: "MX" | "CNAME" | "TXT";
                            type: "MX" | "CNAME" | "TXT";
                            name: string;
                            value: string;
                        }[];
                        connected: boolean;
                        connectedDomainId: string | null;
                        connectedTeamId: string | null;
                    }[];
                };
                meta: object;
            }>;
            verifyDomainLive: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    domainName: string;
                };
                output: {
                    domainName: string;
                    status: string;
                    verificationStatus: import("@aws-sdk/client-ses").VerificationStatus;
                    dnsRecords: {
                        record: "MX" | "CNAME" | "TXT";
                        type: "MX" | "CNAME" | "TXT";
                        name: string;
                        value: string;
                    }[];
                };
                meta: object;
            }>;
            connectToNPanel: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    domainName: string;
                    teamId?: string | null | undefined;
                };
                output: {
                    id: string;
                    domainName: string;
                    alreadyConnected: boolean;
                };
                meta: object;
            }>;
            disconnectFromNPanel: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    domainName: string;
                };
                output: {
                    ok: boolean;
                };
                meta: object;
            }>;
        }>>;
        sesIdentities: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    identityType?: "Domain" | "EmailAddress" | undefined;
                    maxPages?: number | undefined;
                } | undefined;
                output: {
                    identityType: "Domain" | "EmailAddress";
                    identities: string[];
                    count: number;
                    truncated: boolean;
                };
                meta: object;
            }>;
        }>>;
    }>>;
    webDesignQuotes: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                email: string;
                phone: string;
                companyName: string;
                projectType: "OTHER" | "NEW_WEBSITE" | "REDESIGN" | "ECOMMERCE" | "LANDING_PAGE" | "WEB_APP";
                projectDescription: string;
                budget: string;
                domain?: string | undefined;
                targetLaunchDate?: unknown;
            };
            output: {
                id: string;
                createdAt: Date;
            };
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
                status?: "PENDING" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CONTACTED" | "QUOTED" | undefined;
            };
            output: {
                items: {
                    id: string;
                    name: string;
                    email: string;
                    phone: string;
                    companyName: string;
                    domain: string | null;
                    projectType: "OTHER" | "NEW_WEBSITE" | "REDESIGN" | "ECOMMERCE" | "LANDING_PAGE" | "WEB_APP";
                    projectDescription: string;
                    budget: string;
                    targetLaunchDate: Date | null;
                    status: "PENDING" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CONTACTED" | "QUOTED";
                    submittedById: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                total: number;
            };
            meta: object;
        }>;
    }>>;
    user: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getNotificationPreferences: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                notificationSoundEnabled: boolean;
                browserNotificationsEnabled: boolean;
                notificationSoundVolume: number;
                browserNotificationPermission: "default" | "granted" | "denied" | null;
                notificationPreferencesUpdatedAt: Date | null;
            };
            meta: object;
        }>;
        updateNotificationPreferences: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                notificationSoundEnabled?: boolean | undefined;
                browserNotificationsEnabled?: boolean | undefined;
                notificationSoundVolume?: number | undefined;
                browserNotificationPermission?: "default" | "granted" | "denied" | undefined;
            };
            output: {
                notificationSoundEnabled: boolean;
                browserNotificationsEnabled: boolean;
                notificationSoundVolume: number;
                browserNotificationPermission: "default" | "granted" | "denied" | null;
                notificationPreferencesUpdatedAt: Date | null;
            };
            meta: object;
        }>;
    }>>;
    emailBuilder: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                json: string;
                description?: string | undefined;
                thumbnailUrl?: string | undefined;
                isPublic?: boolean | undefined;
                teamId?: string | undefined;
            };
            output: {
                data: {
                    json: string;
                    id: string;
                    name: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    teamId: string | null;
                    isPublic: boolean;
                    thumbnailUrl: string | null;
                };
            };
            meta: object;
        }>;
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                data: {
                    json: string;
                    id: string;
                    name: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    teamId: string | null;
                    isPublic: boolean;
                    thumbnailUrl: string | null;
                };
            };
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                page?: number | undefined;
                limit?: number | undefined;
                teamId?: string | undefined;
            };
            output: {
                data: {
                    id: string;
                    name: string;
                    description: string | null;
                    thumbnailUrl: string | null;
                    isPublic: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    teamId: string | null;
                }[];
                nextPage: number | null;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                name?: string | undefined;
                description?: string | undefined;
                json?: string | undefined;
                thumbnailUrl?: string | undefined;
                isPublic?: boolean | undefined;
            };
            output: {
                data: {
                    id: string;
                    name: string;
                    description: string | null;
                    userId: string;
                    teamId: string | null;
                    json: string;
                    thumbnailUrl: string | null;
                    isPublic: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                };
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                data: {
                    id: string;
                };
            };
            meta: object;
        }>;
        duplicate: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                data: {
                    json: string;
                    id: string;
                    name: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    teamId: string | null;
                    isPublic: boolean;
                    thumbnailUrl: string | null;
                };
            };
            meta: object;
        }>;
    }>>;
    emailBuilderLibrary: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        createFromUpload: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileUrl: string;
                storageKey?: string | undefined;
                description?: string | undefined;
                metadata?: any;
                teamId?: string | undefined;
            };
            output: {
                data: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileUrl: string;
                    storageKey: string | null;
                    description: string | null;
                    metadata: unknown;
                    createdAt: Date;
                };
            };
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                page?: number | undefined;
                limit?: number | undefined;
                teamId?: string | undefined;
                onlyImages?: boolean | undefined;
                search?: string | undefined;
            };
            output: {
                data: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileUrl: string;
                    storageKey: string | null;
                    description: string | null;
                    metadata: unknown;
                    createdAt: Date;
                }[];
                nextPage: number | null;
            };
            meta: object;
        }>;
    }>>;
    ai: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        history: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getHistory: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    teamId?: string | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                };
                output: {
                    id: string;
                    title: string | null;
                    lastMessage: string | null;
                    timestamp: Date;
                    status: "ACTIVE" | "CLOSED" | "ESCALATED";
                }[];
                meta: object;
            }>;
            getById: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    id: string;
                };
                output: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    title: string | null;
                    status: "ACTIVE" | "CLOSED" | "ESCALATED";
                    createdAt: Date;
                    updatedAt: Date;
                    closedAt: Date | null;
                    messages?: {
                        id: string;
                        chatId: string;
                        role: "user" | "system" | "assistant" | "tool";
                        content: string | null;
                        toolCalls: any;
                        toolCallId: string | null;
                        metadata: any;
                        createdAt: Date;
                    }[] | undefined;
                };
                meta: object;
            }>;
        }>>;
        chat: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            start: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    teamId?: string | undefined;
                    initialMessage?: string | undefined;
                };
                output: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    title: string | null;
                    status: "ACTIVE" | "CLOSED" | "ESCALATED";
                    createdAt: Date;
                    updatedAt: Date;
                    closedAt: Date | null;
                    messages?: {
                        id: string;
                        chatId: string;
                        role: "user" | "system" | "assistant" | "tool";
                        content: string | null;
                        toolCalls: any;
                        toolCallId: string | null;
                        metadata: any;
                        createdAt: Date;
                    }[] | undefined;
                };
                meta: object;
            }>;
            sendMessage: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    chatId: string;
                    content: string;
                };
                output: {
                    id: string;
                    chatId: string;
                    role: "user" | "system" | "assistant" | "tool";
                    content: string | null;
                    toolCalls: any;
                    toolCallId: string | null;
                    metadata: any;
                    createdAt: Date;
                };
                meta: object;
            }>;
            escalate: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    chatId: string;
                    reason?: string | undefined;
                };
                output: {
                    success: boolean;
                    ticketId: string;
                    ticketNumber: string;
                };
                meta: object;
            }>;
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    success: boolean;
                };
                meta: object;
            }>;
        }>>;
    }>>;
    etims: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        auth: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            generateToken: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    grantType?: "client_credentials" | undefined;
                };
                output: {
                    success: boolean;
                    data: import("../lib/etims-client").AuthResponse;
                };
                meta: object;
            }>;
            getConfiguration: import("@trpc/server").TRPCQueryProcedure<{
                input: void;
                output: {
                    isInitialized: boolean;
                    config: null;
                } | {
                    isInitialized: boolean;
                    config: {
                        kraPin: string;
                        branchId: string;
                        deviceSerialNumber: string;
                        isSandbox: boolean;
                        updatedAt: Date;
                    };
                };
                meta: object;
            }>;
        }>>;
        initialization: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            initializeDevice: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    tin: string;
                    dvcSrlNo: string;
                    bhfId?: string | undefined;
                    isSandbox?: boolean | undefined;
                };
                output: {
                    success: boolean;
                    data: {
                        configId: string;
                        resultCd?: string;
                        resultMsg?: string;
                        data?: {
                            info?: {
                                cmcKey?: string;
                            };
                            cmcKey?: string;
                        };
                        responseHeader?: {
                            customerMessage?: string;
                            debugMessage?: string;
                        };
                        responseBody?: {
                            resultCd?: string;
                            resultMsg?: string;
                            data?: {
                                info?: {
                                    cmcKey?: string;
                                };
                                cmcKey?: string;
                            } | null;
                        };
                    };
                };
                meta: object;
            }>;
        }>>;
        data: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getCodeList: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    tin: string;
                    bhfId: string;
                    lastReqDt: string;
                    accessToken?: string | undefined;
                    cmcKey?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
            getItemClassList: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    lastReqDt: string;
                    bhfId?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: any;
                    errorMessage?: undefined;
                } | {
                    success: boolean;
                    data: null;
                    errorMessage: any;
                };
                meta: object;
            }>;
            getBranchList: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    lastReqDt: string;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
            getNoticeList: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    lastReqDt: string;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
            getTaxpayerInfo: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    lastReqDt: string;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
            getCustomerList: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    lastReqDt: string;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        branch: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            saveCustomer: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    tin: string;
                    bhfId: string;
                    customer: {
                        custNo: string;
                        custTin: string;
                        custNm: string;
                        adrs: string | null;
                        telNo: string | null;
                        email: string | null;
                        faxNo: string | null;
                        remark: string | null;
                        useYn?: "Y" | "N" | undefined;
                        regrNm?: string | undefined;
                        regrId?: string | undefined;
                        modrNm?: string | undefined;
                        modrId?: string | undefined;
                    };
                    accessToken?: string | undefined;
                    cmcKey?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
            saveBranchUser: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    tin: string;
                    bhfId: string;
                    user: {
                        userId: string;
                        userNm: string;
                        pwd: string;
                        adrs: string | null;
                        cntc: string | null;
                        authCd: string | null;
                        remark: string | null;
                        regrNm: string;
                        regrId: string;
                        modrNm: string;
                        modrId: string;
                        useYn?: "Y" | "N" | undefined;
                    };
                    accessToken?: string | undefined;
                    cmcKey?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        items: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            saveItem: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    item: {
                        itemClsCd: string;
                        itemTyCd: "1" | "2" | "3";
                        itemNm: string;
                        taxTyCd: "A" | "B" | "C" | "D" | "E";
                        dftPrc: number;
                        regrNm: string;
                        regrId: string;
                        modrNm: string;
                        modrId: string;
                        itemCd?: string | undefined;
                        itemStdNm?: string | null | undefined;
                        orgnNatCd?: string | undefined;
                        pkgUnitCd?: string | undefined;
                        qtyUnitCd?: string | undefined;
                        btchNo?: string | null | undefined;
                        bcd?: string | null | undefined;
                        grpPrcL1?: number | undefined;
                        grpPrcL2?: number | undefined;
                        grpPrcL3?: number | undefined;
                        grpPrcL4?: number | undefined;
                        grpPrcL5?: number | null | undefined;
                        addInfo?: string | null | undefined;
                        sftyQty?: number | null | undefined;
                        isrcAplcbYn?: "Y" | "N" | undefined;
                        useYn?: "Y" | "N" | undefined;
                    };
                };
                output: {
                    success: boolean;
                    data: any;
                    errorMessage?: undefined;
                } | {
                    success: boolean;
                    data: null;
                    errorMessage: any;
                };
                meta: object;
            }>;
            getItemInfo: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    lastReqDt: string;
                    bhfId?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
            saveItemComposition: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    composition: {
                        itemCd: string;
                        cpstItemCd: string;
                        cpstQty: number;
                        regrId: string;
                        regrNm: string;
                    };
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        imports: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getImportedItems: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    tin: string;
                    bhfId: string;
                    lastReqDt: string;
                    accessToken?: string | undefined;
                    cmcKey?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
            confirmImportedItem: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    tin: string;
                    bhfId: string;
                    conversion: {
                        taskCd: string;
                        dclDe: string;
                        itemSeq: number;
                        hsCd: string;
                        itemClsCd: string;
                        itemCd: string;
                        imptItemSttsCd: string;
                        remark: string | null;
                        modrNm: string;
                        modrId: string;
                    };
                    accessToken?: string | undefined;
                    cmcKey?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        sales: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            sendSalesTransaction: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    transaction: any;
                };
                output: {
                    success: boolean;
                    data: any;
                    errorMessage?: undefined;
                } | {
                    success: boolean;
                    data: null;
                    errorMessage: any;
                };
                meta: object;
            }>;
            getSalesTransactions: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    lastReqDt: string;
                    bhfId?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
            getInvoiceDetail: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    invcNo: string;
                };
                output: {
                    success: boolean;
                    data: any;
                };
                meta: object;
            }>;
        }>>;
        purchases: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getPurchaseTransactions: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    lastReqDt: string;
                    bhfId?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: any;
                    errorMessage?: undefined;
                } | {
                    success: boolean;
                    data: null;
                    errorMessage: any;
                };
                meta: object;
            }>;
            sendPurchaseTransaction: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    purchase: any;
                    bhfId?: string | undefined;
                };
                output: {
                    success: boolean;
                    data: any;
                    errorMessage?: undefined;
                } | {
                    success: boolean;
                    data: null;
                    errorMessage: any;
                };
                meta: object;
            }>;
        }>>;
        stock: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getStockMovements: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    lastReqDt: string;
                };
                output: {
                    success: boolean;
                    data: any;
                    errorMessage?: undefined;
                } | {
                    success: boolean;
                    data: null;
                    errorMessage: any;
                };
                meta: object;
            }>;
            sendStockIO: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    stockData: any;
                };
                output: {
                    success: boolean;
                    data: any;
                    errorMessage?: undefined;
                } | {
                    success: boolean;
                    data: null;
                    errorMessage: any;
                };
                meta: object;
            }>;
            saveStockMaster: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    stockMaster: {
                        itemCd: string;
                        rsdQty: number;
                        regrId: string;
                        regrNm: string;
                        modrNm: string;
                        modrId: string;
                    };
                };
                output: {
                    success: boolean;
                    data: any;
                    errorMessage?: undefined;
                } | {
                    success: boolean;
                    data: null;
                    errorMessage: any;
                };
                meta: object;
            }>;
        }>>;
    }>>;
    reports: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        sales: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getSalesReportOverview: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    from?: unknown;
                    to?: unknown;
                    monthsTrend?: number | undefined;
                    topTeamsLimit?: number | undefined;
                };
                output: {
                    executive: {
                        mrr: number;
                        mrrPreviousMonth: number;
                        mrrChangePercent: number;
                        mrrChangeAmount: number;
                        currency: string;
                    };
                    mrrByCategory: {
                        category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                        label: string;
                        mrr: number;
                        subscriptionCount: number;
                    }[];
                    mrrMovement: {
                        newMrr: number;
                        lostMrr: number;
                        existingMrr: number;
                        netChange: number;
                        currency: string;
                    };
                    revenueTrend: {
                        month: string;
                        year: number;
                        paidRevenue: number;
                        invoicedAmount: number;
                        invoiceCount: number;
                        paidInvoiceCount: number;
                    }[];
                    customer: {
                        arpc: number;
                        customerCount: number;
                        currency: string;
                    };
                    revenueByTeam: {
                        teamId: string;
                        teamName: string;
                        amount: number;
                        currency: string;
                        percentOfTotal?: number | undefined;
                    }[];
                    commission: {
                        commissionSubscriptionCount: number;
                        estimatedFeesAmount: number;
                        currency: string;
                        hasBaseData: boolean;
                    };
                    activeSubscriptions: {
                        webHosting: number;
                        emailHosting: number;
                        byCategory: Record<"AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING", number>;
                        totalActive: number;
                    };
                    domainRenewalRate: {
                        renewedCount: number;
                        dueCount: number;
                        ratePercent: number;
                        periodLabel: string;
                    };
                    invoicing: {
                        invoicedThisMonth: number;
                        paidThisMonth: number;
                        overdueCount: number;
                        outstandingAmount: number;
                        currency: string;
                    };
                    revenueByProduct: {
                        productId: string;
                        productName: string;
                        category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                        mrr: number;
                        subscriptionCount: number;
                    }[];
                    revenueByPlan: {
                        planId: string;
                        planName: string;
                        productName: string;
                        mrr: number;
                        subscriptionCount: number;
                    }[];
                    billingMix: {
                        billingCycle: string;
                        mrr: number;
                        subscriptionCount: number;
                        percentOfMrr: number;
                    }[];
                    averageDealSize: {
                        mean: number;
                        median: number;
                        currency: string;
                    };
                    revenueConcentration: {
                        top5Percent: number;
                        top10Percent: number;
                        top5Amount: number;
                        top10Amount: number;
                        totalAmount: number;
                    };
                    churnRate: {
                        churnedCount: number;
                        activeAtStartCount: number;
                        ratePercent: number;
                        lostMrr: number;
                        periodLabel: string;
                    };
                    subscriptionTenure: {
                        label: string;
                        monthsMin: number;
                        monthsMax: number | null;
                        subscriptionCount: number;
                    }[];
                    upgradesDowngrades: {
                        upgradesCount: number;
                        downgradesCount: number;
                        upgradesMrrImpact: number;
                        downgradesMrrImpact: number;
                        periodLabel: string;
                    };
                    autoRenewRate: {
                        withAutoRenew: number;
                        withoutAutoRenew: number;
                        ratePercent: number;
                        totalActive: number;
                    };
                    renewalsDue: {
                        days30: {
                            count: number;
                            mrr: number;
                        };
                        days60: {
                            count: number;
                            mrr: number;
                        };
                        days90: {
                            count: number;
                            mrr: number;
                        };
                        currency: string;
                    };
                    expiringSoon: {
                        count: number;
                        mrr: number;
                        withinDays: number;
                        currency: string;
                    };
                    paymentVelocity: {
                        avgDaysToPay: number;
                        medianDaysToPay: number;
                        invoiceCount: number;
                    };
                    overdueAging: {
                        bucket0_30: {
                            count: number;
                            amount: number;
                        };
                        bucket31_60: {
                            count: number;
                            amount: number;
                        };
                        bucket61_90: {
                            count: number;
                            amount: number;
                        };
                        bucket90Plus: {
                            count: number;
                            amount: number;
                        };
                        totalCount: number;
                        totalAmount: number;
                        currency: string;
                    };
                    invoiceStatusMix: {
                        DRAFT: number;
                        SENT: number;
                        PARTIALLY_PAID: number;
                        PAID: number;
                        OVERDUE: number;
                        CANCELLED: number;
                        WRITTEN_OFF: number;
                        totalCount: number;
                    };
                    taxAndCredits: {
                        taxCollectedThisMonth: number;
                        taxCollectedPeriod: number;
                        discountsThisMonth: number;
                        creditNotesIssuedPeriod: number;
                        currency: string;
                    };
                    revenueByPaymentMethod: {
                        method: string;
                        amount: number;
                        count: number;
                        percentOfTotal: number;
                    }[];
                    newCustomers: {
                        thisMonth: number;
                        previousMonth: number;
                        periodLabel: string;
                    };
                    newSubscriptionsByProduct: {
                        productId: string;
                        productName: string;
                        category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                        count: number;
                    }[];
                    orderPipeline: {
                        PENDING: {
                            count: number;
                            value: number;
                        };
                        PROCESSING: {
                            count: number;
                            value: number;
                        };
                        COMPLETED: {
                            count: number;
                            value: number;
                        };
                        FAILED: {
                            count: number;
                            value: number;
                        };
                        PARTIAL: {
                            count: number;
                            value: number;
                        };
                        totalValue: number;
                        conversionPercent: number;
                        currency: string;
                    };
                    promoEffectiveness: {
                        redemptionsThisPeriod: number;
                        ordersWithPromo: number;
                        revenueWithPromo: number;
                        revenueWithoutPromo: number;
                        topPromos: {
                            promoCode: string;
                            redemptions: number;
                        }[];
                        currency: string;
                    };
                    marginByCategory: {
                        category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                        revenue: number;
                        cost: number;
                        marginPercent: number;
                        subscriptionCount: number;
                    }[];
                    multiProductCustomers: {
                        multiProductCount: number;
                        singleProductCount: number;
                        totalWithSubs: number;
                        multiProductPercent: number;
                    };
                    topCustomersTrend: {
                        teamId: string;
                        teamName: string;
                        mrrCurrent: number;
                        mrrPrevious: number;
                        changePercent: number;
                        changeAmount: number;
                    }[];
                    atRiskCustomers: {
                        count: number;
                        daysWithoutPayment: number;
                        description: string;
                    };
                    timeComparison: {
                        mrrMonthOverMonthPercent: number;
                        paidRevenueMonthOverMonthPercent: number;
                        paidRevenueYearOverYearPercent: number | null;
                        annualRunRate: number;
                        currency: string;
                    };
                };
                meta: object;
            }>;
            getRevenueTrends: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    from?: unknown;
                    to?: unknown;
                    limit?: number | undefined;
                };
                output: {
                    id: string;
                    period: string;
                    date: Date;
                    totalRevenue: number;
                    totalInvoiced: number;
                    totalPaid: number;
                    taxableAmount: number;
                    taxAmount: number;
                    pendingAmount: number;
                    invoiceCount: number;
                    paidInvoiceCount: number;
                    currency: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                meta: object;
            }>;
            getRevenueByService: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    from?: unknown;
                    to?: unknown;
                    limit?: number | undefined;
                };
                output: {
                    id: string;
                    period: string;
                    date: Date;
                    serviceType: string;
                    amount: number;
                    currency: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                meta: object;
            }>;
            getRevenueByCompany: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    from?: unknown;
                    to?: unknown;
                    limit?: number | undefined;
                };
                output: {
                    id: string;
                    period: string;
                    date: Date;
                    teamId: string;
                    teamName: string;
                    amount: number;
                    currency: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                meta: object;
            }>;
            sync: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    period?: "MONTHLY" | "DAILY" | undefined;
                };
                output: {
                    success: boolean;
                };
                meta: object;
            }>;
        }>>;
        creative: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("..").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            getProductionStats: import("@trpc/server").TRPCQueryProcedure<{
                input: {
                    from?: unknown;
                    to?: unknown;
                    limit?: number | undefined;
                };
                output: {
                    id: string;
                    period: string;
                    date: Date;
                    assetsCreated: number;
                    assetsApproved: number;
                    versionsCreated: number;
                    avgVelocityDays: number | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                meta: object;
            }>;
            sync: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    period?: "MONTHLY" | "DAILY" | undefined;
                };
                output: {
                    success: boolean;
                };
                meta: object;
            }>;
        }>>;
    }>>;
    products: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                category?: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING" | undefined;
                serviceType?: string | undefined;
                isActive?: boolean | undefined;
            } | undefined;
            output: {
                id: string;
                name: string;
                description: string | null;
                category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                serviceType: string;
                isActive: boolean;
                sortOrder: number;
                features: unknown[];
                highlights: string[];
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                includePlans?: boolean | undefined;
            };
            output: {
                plans?: any;
                id: string;
                name: string;
                description: string | null;
                category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                serviceType: string;
                isActive: boolean;
                sortOrder: number;
                features: unknown[];
                highlights: string[];
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        getAddOnsForProduct: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                baseProductId: string;
            };
            output: {
                product: {
                    id: string;
                    name: string;
                    description: string | null;
                    category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                    serviceType: string;
                    isActive: boolean;
                    sortOrder: number;
                    features: unknown[];
                    highlights: string[];
                    metadata: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                plans: unknown[];
            }[];
            meta: object;
        }>;
        getHostingProductsForUpsell: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                product: {
                    id: string;
                    name: string;
                    description: string | null;
                    category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                    serviceType: string;
                    isActive: boolean;
                    sortOrder: number;
                    features: unknown[];
                    highlights: string[];
                    metadata: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                plans: unknown[];
            }[];
            meta: object;
        }>;
        getHostingPlansForPricing: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                productFeatures: {
                    key: string;
                    label: string;
                }[];
                plans: {
                    id: string;
                    name: string;
                    niscPrice: string | null;
                    niscCurrency: string;
                    billingCycle: string;
                    isPopular: boolean;
                    isRecommended: boolean;
                    productId: string;
                    productName: string;
                    featureValues: {
                        available: boolean;
                        valueOverride: string | null;
                    }[];
                }[];
            };
            meta: object;
        }>;
        getEmailHostingPlansForPricing: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                productFeatures: {
                    key: string;
                    label: string;
                }[];
                plans: {
                    id: string;
                    name: string;
                    niscPrice: string | null;
                    niscCurrency: string;
                    billingCycle: string;
                    isPopular: boolean;
                    isRecommended: boolean;
                    productId: string;
                    productName: string;
                    featureValues: {
                        available: boolean;
                        valueOverride: string | null;
                    }[];
                }[];
            };
            meta: object;
        }>;
        getPlansForPricingBySlug: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                slug: string;
            };
            output: {
                productFeatures: {
                    key: string;
                    label: string;
                }[];
                plans: {
                    id: string;
                    name: string;
                    niscPrice: string | null;
                    niscCurrency: string;
                    billingCycle: string;
                    isPopular: boolean;
                    isRecommended: boolean;
                    productId: string;
                    productName: string;
                    featureValues: {
                        available: boolean;
                        valueOverride: string | null;
                    }[];
                }[];
            };
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                serviceType: string;
                description?: string | undefined;
                isActive?: boolean | undefined;
                sortOrder?: number | undefined;
                features?: {
                    key: string;
                    label: string;
                    description?: string | undefined;
                }[] | undefined;
                highlights?: string[] | undefined;
                metadata?: Record<string, unknown> | undefined;
            };
            output: {
                id: string;
                name: string;
                description: string | null;
                category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                serviceType: string;
                isActive: boolean;
                sortOrder: number;
                features: unknown[];
                highlights: string[];
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                name?: string | undefined;
                description?: string | undefined;
                category?: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING" | undefined;
                serviceType?: string | undefined;
                isActive?: boolean | undefined;
                sortOrder?: number | undefined;
                features?: {
                    key: string;
                    label: string;
                    description?: string | undefined;
                }[] | undefined;
                highlights?: string[] | undefined;
                metadata?: Record<string, unknown> | undefined;
            };
            output: {
                id: string;
                name: string;
                description: string | null;
                category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                serviceType: string;
                isActive: boolean;
                sortOrder: number;
                features: unknown[];
                highlights: string[];
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        getDefaultPlanIdForProduct: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                productId: string;
            };
            output: string | null;
            meta: object;
        }>;
        getPlanById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                productId: string;
                name: string;
                description: string | null;
                pricingModel: "FIXED" | "COMMISSION";
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                price: string | null;
                currency: string | null;
                setupFee: string | null;
                commissionRate: unknown;
                commissionBase: string | null;
                commissionBaseDescription: string | null;
                planFeatures: unknown[];
                highlights: string[];
                isPopular: boolean;
                isRecommended: boolean;
                isActive: boolean;
                isDefault: boolean;
                sortOrder: number;
                pleskServicePlanId: string | null;
                pleskFilterId: string | null;
                pleskIpAddress: string | null;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        createPlan: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                productId: string;
                name: string;
                pricingModel: "FIXED" | "COMMISSION";
                description?: string | undefined;
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
                price?: string | undefined;
                currency?: string | undefined;
                setupFee?: string | undefined;
                commissionRate?: number | undefined;
                commissionBase?: string | undefined;
                commissionBaseDescription?: string | undefined;
                planFeatures?: {
                    key: string;
                    available: boolean;
                    valueOverride?: string | undefined;
                }[] | undefined;
                highlights?: string[] | undefined;
                isPopular?: boolean | undefined;
                isRecommended?: boolean | undefined;
                isActive?: boolean | undefined;
                isDefault?: boolean | undefined;
                sortOrder?: number | undefined;
                pleskServicePlanId?: string | undefined;
                pleskFilterId?: string | undefined;
                pleskIpAddress?: string | undefined;
                hostingType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
                metadata?: Record<string, unknown> | undefined;
            };
            output: {
                id: string;
                productId: string;
                name: string;
                description: string | null;
                pricingModel: "FIXED" | "COMMISSION";
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                price: string | null;
                currency: string | null;
                setupFee: string | null;
                commissionRate: unknown;
                commissionBase: string | null;
                commissionBaseDescription: string | null;
                planFeatures: unknown[];
                highlights: string[];
                isPopular: boolean;
                isRecommended: boolean;
                isActive: boolean;
                isDefault: boolean;
                sortOrder: number;
                pleskServicePlanId: string | null;
                pleskFilterId: string | null;
                pleskIpAddress: string | null;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        updatePlan: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                productId?: string | undefined;
                name?: string | undefined;
                description?: string | undefined;
                pricingModel?: "FIXED" | "COMMISSION" | undefined;
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
                price?: string | undefined;
                currency?: string | undefined;
                setupFee?: string | undefined;
                commissionRate?: number | undefined;
                commissionBase?: string | undefined;
                commissionBaseDescription?: string | undefined;
                planFeatures?: {
                    key: string;
                    available: boolean;
                    valueOverride?: string | undefined;
                }[] | undefined;
                highlights?: string[] | undefined;
                isPopular?: boolean | undefined;
                isRecommended?: boolean | undefined;
                isActive?: boolean | undefined;
                isDefault?: boolean | undefined;
                sortOrder?: number | undefined;
                pleskServicePlanId?: string | undefined;
                pleskFilterId?: string | undefined;
                pleskIpAddress?: string | undefined;
                hostingType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
                metadata?: Record<string, unknown> | undefined;
            };
            output: {
                id: string;
                productId: string;
                name: string;
                description: string | null;
                pricingModel: "FIXED" | "COMMISSION";
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                price: string | null;
                currency: string | null;
                setupFee: string | null;
                commissionRate: unknown;
                commissionBase: string | null;
                commissionBaseDescription: string | null;
                planFeatures: unknown[];
                highlights: string[];
                isPopular: boolean;
                isRecommended: boolean;
                isActive: boolean;
                isDefault: boolean;
                sortOrder: number;
                pleskServicePlanId: string | null;
                pleskFilterId: string | null;
                pleskIpAddress: string | null;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        deletePlan: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        listPlanUsages: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                productId?: string | undefined;
                productPlanId?: string | undefined;
                usageKind?: string | undefined;
            } | undefined;
            output: {
                id: string;
                productId: string;
                productPlanId: string;
                userId: string | null;
                teamId: string | null;
                usageKind: string;
                limitValue: string;
                overuse: "HARD" | "SOFT";
                period: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        getPlanUsageById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                productId: string;
                productPlanId: string;
                userId: string | null;
                teamId: string | null;
                usageKind: string;
                limitValue: string;
                overuse: "HARD" | "SOFT";
                period: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        createPlanUsage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                productId: string;
                productPlanId: string;
                usageKind: string;
                limitValue: string;
                overuse: "HARD" | "SOFT";
                userId?: string | undefined;
                teamId?: string | undefined;
                period?: string | undefined;
            };
            output: {
                id: string;
                productId: string;
                productPlanId: string;
                userId: string | null;
                teamId: string | null;
                usageKind: string;
                limitValue: string;
                overuse: "HARD" | "SOFT";
                period: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        updatePlanUsage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                userId?: string | null | undefined;
                teamId?: string | null | undefined;
                usageKind?: string | undefined;
                limitValue?: string | undefined;
                overuse?: "HARD" | "SOFT" | undefined;
                period?: string | null | undefined;
            };
            output: {
                id: string;
                productId: string;
                productPlanId: string;
                userId: string | null;
                teamId: string | null;
                usageKind: string;
                limitValue: string;
                overuse: "HARD" | "SOFT";
                period: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        deletePlanUsage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
    clientSubscriptions: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId?: string | undefined;
                teamId?: string | undefined;
                productId?: string | undefined;
                productPlanId?: string | undefined;
                pricingModel?: "FIXED" | "COMMISSION" | undefined;
                status?: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED" | undefined;
                fromDate?: unknown;
                toDate?: unknown;
                limit?: number | undefined;
                offset?: number | undefined;
            } | undefined;
            output: {
                id: string;
                userId: string | null;
                teamId: string | null;
                productId: string;
                productPlanId: string | null;
                orderId: string | null;
                subscribedBy: string | null;
                recordedBy: string | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED";
                subscriptionDate: Date | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                autoRenew: boolean;
                pricingModel: "FIXED" | "COMMISSION";
                agreedPrice: string | null;
                agreedCurrency: string | null;
                agreedCommissionRate: unknown;
                agreedCommissionBase: string | null;
                primaryDomain: string | null;
                pleskFilterId: string | null;
                pleskOwnerId: string | null;
                pleskFtpLogin: string | null;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                openProviderId: number | null;
                domainAuthCode: string | null;
                nameserverGroupId: string | null;
                wpInstallationId: number | null;
                serviceRefs: unknown;
                hostingSubscriptionId: string | null;
                notes: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        listForAgency: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
                search?: string | undefined;
                productFilter?: "hosting" | undefined;
            } | undefined;
            output: {
                id: string;
                userId: string | null;
                teamId: string | null;
                productId: string;
                productPlanId: string | null;
                orderId: string | null;
                subscribedBy: string | null;
                recordedBy: string | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED";
                subscriptionDate: Date | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                autoRenew: boolean;
                pricingModel: "FIXED" | "COMMISSION";
                agreedPrice: string | null;
                agreedCurrency: string | null;
                agreedCommissionRate: unknown;
                agreedCommissionBase: string | null;
                primaryDomain: string | null;
                pleskFilterId: string | null;
                pleskOwnerId: string | null;
                pleskFtpLogin: string | null;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                openProviderId: number | null;
                domainAuthCode: string | null;
                nameserverGroupId: string | null;
                wpInstallationId: number | null;
                serviceRefs: unknown;
                hostingSubscriptionId: string | null;
                notes: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
                productName: string;
                productPlanName: string | null;
                subscriptionName: string | null;
                teamName: string | null;
                userName: string | null;
            }[];
            meta: object;
        }>;
        listForTeamHosting: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamSlug: string;
            };
            output: {
                id: string;
                pleskSubscriptionId: string | null;
                subscriptionName: string | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED";
                productName: string;
                productPlanName: string | null;
                subscriptionDate: Date | null;
                expiryDate: Date | null;
                primaryDomain: string | null;
            }[];
            meta: object;
        }>;
        listForTeamEmailHosting: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamSlug: string;
            };
            output: {
                id: string;
                pleskSubscriptionId: string | null;
                subscriptionName: string | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED";
                productName: string;
                productPlanName: string | null;
                subscriptionDate: Date | null;
                expiryDate: Date | null;
                primaryDomain: string | null;
            }[];
            meta: object;
        }>;
        listForTeamDomains: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamSlug: string;
            };
            output: {
                id: string;
                pleskSubscriptionId: string | null;
                subscriptionName: string | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED";
                productName: string;
                productPlanName: string | null;
                subscriptionDate: Date | null;
                expiryDate: Date | null;
                primaryDomain: string | null;
            }[];
            meta: object;
        }>;
        listForTeam: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamSlug: string;
            };
            output: {
                id: string;
                productName: string;
                productPlanName: string | null;
                subscriptionDate: Date | null;
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED";
            }[];
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                teamSlug?: string | undefined;
                includeRenewals?: boolean | undefined;
                includeCommissions?: boolean | undefined;
            };
            output: {
                commissionEntries?: {
                    id: string;
                    subscriptionId: string;
                    productPlanId: string;
                    teamId: string | null;
                    period: string;
                    baseAmount: unknown;
                    baseAmountDescription: string | null;
                    commissionRate: unknown;
                    commissionAmount: unknown;
                    currency: string;
                    status: "DRAFT" | "PAID" | "INVOICED" | "WAIVED";
                    invoiceId: string | null;
                    notes: string | null;
                    createdBy: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
                renewals?: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    status: string;
                    notes: string | null;
                    billingCycle: string | null;
                    orderId: string | null;
                    subscriptionId: string;
                    renewalType: string;
                    renewedBy: string | null;
                    renewalDate: Date;
                    newExpiryDate: Date | null;
                    newNextRenewalDate: Date | null;
                    renewalPrice: string | null;
                    renewalCurrency: string | null;
                    providerRenewalPrice: string | null;
                    providerRenewalCurrency: string | null;
                }[] | undefined;
                product: {
                    id: string;
                    name: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    metadata: unknown;
                    category: string;
                    serviceType: string;
                    sortOrder: number;
                    features: unknown;
                    highlights: unknown;
                    isAddOn: boolean;
                };
                productPlan: {
                    id: string;
                    name: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    metadata: unknown;
                    currency: string | null;
                    price: string | null;
                    sortOrder: number;
                    highlights: unknown;
                    productId: string;
                    pricingModel: string;
                    billingCycle: string | null;
                    setupFee: string | null;
                    cost: string | null;
                    costCurrency: string | null;
                    commissionRate: string | null;
                    commissionBase: string | null;
                    commissionBaseDescription: string | null;
                    planFeatures: unknown;
                    isPopular: boolean;
                    isRecommended: boolean;
                    isDefault: boolean;
                    pleskServicePlanId: string | null;
                    pleskFilterId: string | null;
                    pleskIpAddress: string | null;
                    hostingType: string | null;
                } | null;
                team: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    baseCurrency: string;
                    logoUrl: string | null;
                    isActive: boolean;
                    createdById: string;
                } | null;
                userName: string | null;
                id: string;
                userId: string | null;
                teamId: string | null;
                productId: string;
                productPlanId: string | null;
                orderId: string | null;
                subscribedBy: string | null;
                recordedBy: string | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED";
                subscriptionDate: Date | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                autoRenew: boolean;
                pricingModel: "FIXED" | "COMMISSION";
                agreedPrice: string | null;
                agreedCurrency: string | null;
                agreedCommissionRate: unknown;
                agreedCommissionBase: string | null;
                primaryDomain: string | null;
                pleskFilterId: string | null;
                pleskOwnerId: string | null;
                pleskFtpLogin: string | null;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                openProviderId: number | null;
                domainAuthCode: string | null;
                nameserverGroupId: string | null;
                wpInstallationId: number | null;
                serviceRefs: unknown;
                hostingSubscriptionId: string | null;
                notes: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        getDomainsProductId: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: string | null;
            meta: object;
        }>;
        getTransferProductId: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                name: string;
            } | null;
            meta: object;
        }>;
        getByOpenProviderId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                openProviderId: number;
            };
            output: {
                id: string;
                userId: string | null;
                teamId: string | null;
                productId: string;
                productPlanId: string | null;
                orderId: string | null;
                subscribedBy: string | null;
                recordedBy: string | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED";
                subscriptionDate: Date | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                autoRenew: boolean;
                pricingModel: "FIXED" | "COMMISSION";
                agreedPrice: string | null;
                agreedCurrency: string | null;
                agreedCommissionRate: unknown;
                agreedCommissionBase: string | null;
                primaryDomain: string | null;
                pleskFilterId: string | null;
                pleskOwnerId: string | null;
                pleskFtpLogin: string | null;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                openProviderId: number | null;
                domainAuthCode: string | null;
                nameserverGroupId: string | null;
                wpInstallationId: number | null;
                serviceRefs: unknown;
                hostingSubscriptionId: string | null;
                notes: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            meta: object;
        }>;
        getOpenProviderIdsWithSubscriptions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                openProviderIds: number[];
            };
            output: number[];
            meta: object;
        }>;
        getHasLinkedSubscriptionByPleskId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                pleskSubscriptionId: string | number;
            };
            output: {
                hasLinked: boolean;
            };
            meta: object;
        }>;
        getPleskSubscriptionIdsWithLinkedSubscription: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                pleskSubscriptionIds: (string | number)[];
            };
            output: string[];
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                productId: string;
                pricingModel: "FIXED" | "COMMISSION";
                name?: string | undefined;
                userId?: string | undefined;
                teamId?: string | undefined;
                productPlanId?: string | undefined;
                orderId?: string | undefined;
                subscribedBy?: string | undefined;
                recordedBy?: string | undefined;
                status?: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED" | undefined;
                subscriptionDate?: unknown;
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
                nextRenewalDate?: unknown;
                expiryDate?: unknown;
                autoRenew?: boolean | undefined;
                agreedPrice?: string | undefined;
                agreedCurrency?: string | undefined;
                agreedCost?: string | undefined;
                agreedCostCurrency?: string | undefined;
                providerCost?: string | undefined;
                providerCostCurrency?: string | undefined;
                agreedCommissionRate?: number | undefined;
                agreedCommissionBase?: string | undefined;
                primaryDomain?: string | undefined;
                pleskFilterId?: string | undefined;
                pleskOwnerId?: string | undefined;
                pleskFtpLogin?: string | undefined;
                pleskFtpPassword?: string | undefined;
                hostingType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
                openProviderId?: number | undefined;
                domainAuthCode?: string | undefined;
                nameserverGroupId?: string | undefined;
                wpInstallationId?: number | undefined;
                serviceRefs?: Record<string, string | string[]> | undefined;
                hostingSubscriptionId?: string | undefined;
                notes?: string | undefined;
                metadata?: Record<string, unknown> | undefined;
            };
            output: {
                id: string;
                userId: string | null;
                teamId: string | null;
                productId: string;
                productPlanId: string | null;
                orderId: string | null;
                subscribedBy: string | null;
                recordedBy: string | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED";
                subscriptionDate: Date | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                autoRenew: boolean;
                pricingModel: "FIXED" | "COMMISSION";
                agreedPrice: string | null;
                agreedCurrency: string | null;
                agreedCommissionRate: unknown;
                agreedCommissionBase: string | null;
                primaryDomain: string | null;
                pleskFilterId: string | null;
                pleskOwnerId: string | null;
                pleskFtpLogin: string | null;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                openProviderId: number | null;
                domainAuthCode: string | null;
                nameserverGroupId: string | null;
                wpInstallationId: number | null;
                serviceRefs: unknown;
                hostingSubscriptionId: string | null;
                notes: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                status?: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED" | undefined;
                subscriptionDate?: unknown;
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
                nextRenewalDate?: unknown;
                expiryDate?: unknown;
                autoRenew?: boolean | undefined;
                agreedPrice?: string | undefined;
                agreedCurrency?: string | undefined;
                agreedCommissionRate?: number | undefined;
                agreedCommissionBase?: string | undefined;
                primaryDomain?: string | undefined;
                pleskFilterId?: string | undefined;
                pleskOwnerId?: string | undefined;
                pleskFtpLogin?: string | undefined;
                pleskFtpPassword?: string | undefined;
                hostingType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
                openProviderId?: number | undefined;
                domainAuthCode?: string | undefined;
                nameserverGroupId?: string | undefined;
                wpInstallationId?: number | undefined;
                serviceRefs?: Record<string, string | string[]> | undefined;
                notes?: string | undefined;
                metadata?: Record<string, unknown> | undefined;
            };
            output: {
                id: string;
                userId: string | null;
                teamId: string | null;
                productId: string;
                productPlanId: string | null;
                orderId: string | null;
                subscribedBy: string | null;
                recordedBy: string | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED";
                subscriptionDate: Date | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                autoRenew: boolean;
                pricingModel: "FIXED" | "COMMISSION";
                agreedPrice: string | null;
                agreedCurrency: string | null;
                agreedCommissionRate: unknown;
                agreedCommissionBase: string | null;
                primaryDomain: string | null;
                pleskFilterId: string | null;
                pleskOwnerId: string | null;
                pleskFtpLogin: string | null;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                openProviderId: number | null;
                domainAuthCode: string | null;
                nameserverGroupId: string | null;
                wpInstallationId: number | null;
                serviceRefs: unknown;
                hostingSubscriptionId: string | null;
                notes: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        cancel: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                reason?: string | undefined;
            };
            output: {
                id: string;
                userId: string | null;
                teamId: string | null;
                productId: string;
                productPlanId: string | null;
                orderId: string | null;
                subscribedBy: string | null;
                recordedBy: string | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED";
                subscriptionDate: Date | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                autoRenew: boolean;
                pricingModel: "FIXED" | "COMMISSION";
                agreedPrice: string | null;
                agreedCurrency: string | null;
                agreedCommissionRate: unknown;
                agreedCommissionBase: string | null;
                primaryDomain: string | null;
                pleskFilterId: string | null;
                pleskOwnerId: string | null;
                pleskFtpLogin: string | null;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                openProviderId: number | null;
                domainAuthCode: string | null;
                nameserverGroupId: string | null;
                wpInstallationId: number | null;
                serviceRefs: unknown;
                hostingSubscriptionId: string | null;
                notes: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        sendRenewalEmail: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subscriptionId: string;
                to: string;
                ccOrBcc?: {
                    type: "cc" | "bcc";
                    email: string;
                } | undefined;
            };
            output: {
                sent: boolean;
            };
            meta: object;
        }>;
        renew: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subscriptionId: string;
                renewalType: "DOMAIN" | "HOSTING" | "FIXED_BILLING";
                renewalDate: unknown;
                renewedBy?: string | undefined;
                newExpiryDate?: unknown;
                newNextRenewalDate?: unknown;
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
                status?: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED" | undefined;
                renewalPrice?: string | undefined;
                renewalCurrency?: string | undefined;
                externalRenewalId?: string | undefined;
                orderId?: string | undefined;
                invoiceId?: string | undefined;
                notes?: string | undefined;
            };
            output: {
                renewalId: string;
                subscription: {
                    id: string;
                    userId: string | null;
                    teamId: string | null;
                    productId: string;
                    productPlanId: string | null;
                    orderId: string | null;
                    subscribedBy: string | null;
                    recordedBy: string | null;
                    status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "FAILED" | "UPGRADED" | "DOWNGRADED";
                    subscriptionDate: Date | null;
                    billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                    nextRenewalDate: Date | null;
                    expiryDate: Date | null;
                    autoRenew: boolean;
                    pricingModel: "FIXED" | "COMMISSION";
                    agreedPrice: string | null;
                    agreedCurrency: string | null;
                    agreedCommissionRate: unknown;
                    agreedCommissionBase: string | null;
                    primaryDomain: string | null;
                    pleskFilterId: string | null;
                    pleskOwnerId: string | null;
                    pleskFtpLogin: string | null;
                    hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                    openProviderId: number | null;
                    domainAuthCode: string | null;
                    nameserverGroupId: string | null;
                    wpInstallationId: number | null;
                    serviceRefs: unknown;
                    hostingSubscriptionId: string | null;
                    notes: string | null;
                    metadata: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
            };
            meta: object;
        }>;
        recordCommission: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subscriptionId: string;
                period: string;
                baseAmount: number;
                baseAmountDescription?: string | undefined;
                currency?: string | undefined;
                notes?: string | undefined;
            };
            output: {
                id: string;
                subscriptionId: string;
                productPlanId: string;
                teamId: string | null;
                period: string;
                baseAmount: unknown;
                baseAmountDescription: string | null;
                commissionRate: unknown;
                commissionAmount: unknown;
                currency: string;
                status: "DRAFT" | "PAID" | "INVOICED" | "WAIVED";
                invoiceId: string | null;
                notes: string | null;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        getCommissionEntries: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                subscriptionId?: string | undefined;
                teamId?: string | undefined;
                status?: "DRAFT" | "PAID" | "INVOICED" | "WAIVED" | undefined;
                periodFrom?: string | undefined;
                periodTo?: string | undefined;
            } | undefined;
            output: {
                id: string;
                subscriptionId: string;
                productPlanId: string;
                teamId: string | null;
                period: string;
                baseAmount: unknown;
                baseAmountDescription: string | null;
                commissionRate: unknown;
                commissionAmount: unknown;
                currency: string;
                status: "DRAFT" | "PAID" | "INVOICED" | "WAIVED";
                invoiceId: string | null;
                notes: string | null;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        updateCommissionEntry: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                status: "DRAFT" | "PAID" | "INVOICED" | "WAIVED";
                invoiceId?: string | undefined;
                notes?: string | undefined;
            };
            output: {
                id: string;
                subscriptionId: string;
                productPlanId: string;
                teamId: string | null;
                period: string;
                baseAmount: unknown;
                baseAmountDescription: string | null;
                commissionRate: unknown;
                commissionAmount: unknown;
                currency: string;
                status: "DRAFT" | "PAID" | "INVOICED" | "WAIVED";
                invoiceId: string | null;
                notes: string | null;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        getDomainSubscriptions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId?: string | undefined;
                teamId?: string | undefined;
            };
            output: {
                id: string;
                name: string | null;
                primaryDomain: string | null;
            }[];
            meta: object;
        }>;
    }>>;
    subscriptionUsage: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getOrCreateUsage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subscriptionId: string;
                usageKind: string;
                initialCredits?: string | undefined;
            };
            output: {
                id: string;
                subscriptionId: string;
                usageKind: string;
                credits: string;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        getUsageById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                subscriptionId: string;
                usageKind: string;
                credits: string;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        listForSubscription: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                subscriptionId: string;
            };
            output: {
                id: string;
                subscriptionId: string;
                usageKind: string;
                credits: string;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        setCredits: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subscriptionUsageId: string;
                credits: string;
                description?: string | undefined;
                metadata?: Record<string, unknown> | undefined;
            };
            output: {
                id: string;
                subscriptionId: string;
                usageKind: string;
                credits: string;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        addCredits: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                subscriptionUsageId: string;
                delta: string;
                action: "CREDIT_USE" | "CREDIT_ADD" | "CREDIT_RESET" | "CREDIT_ADJUST";
                description?: string | undefined;
                metadata?: Record<string, unknown> | undefined;
            };
            output: {
                usage: {
                    id: string;
                    subscriptionId: string;
                    usageKind: string;
                    credits: string;
                    metadata: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                previousCredits: string;
                newCredits: string;
            };
            meta: object;
        }>;
        listActivityLogs: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                subscriptionUsageId: string;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                items: {
                    id: string;
                    subscriptionUsageId: string;
                    userId: string;
                    action: string;
                    description: string | null;
                    metadata: unknown;
                    ipAddress: string | null;
                    userAgent: string | null;
                    createdAt: Date;
                }[];
                total: number;
            };
            meta: object;
        }>;
    }>>;
    niscServiceOrders: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId?: string | undefined;
                teamId?: string | undefined;
                status?: "PENDING" | "PROCESSING" | "FAILED" | "COMPLETED" | "PARTIAL" | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                orders: {
                    id: string;
                    orderNumber: string;
                    userId: string | null;
                    teamId: string | null;
                    status: string;
                    subtotal: string;
                    total: string;
                    currency: string;
                    notes: string | null;
                    failureReason: string | null;
                    createdAt: Date;
                    completedAt: Date | null;
                    user: {
                        id: string;
                        name: string;
                        email: string;
                    } | null;
                    team: {
                        id: string;
                        name: string;
                    } | null;
                    orderItems: {
                        id: string;
                        productId: string;
                        productPlanId: string | null;
                        productName: string;
                        planName: string | null;
                        serviceType: string;
                        description: string | null;
                        itemPrice: string;
                        itemSubtotal: string;
                        status: string;
                        provisioningError: string | null;
                        niscClientSubscriptionId: string | null;
                    }[];
                }[];
                total: number;
            };
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                userId: string | null;
                teamId: string | null;
                metadata: unknown;
                invoiceNumber: string | null;
                subtotal: string;
                currency: string;
                createdBy: string | null;
                invoiceId: string | null;
                total: string;
                notes: string | null;
                orderNumber: string;
                niscProductPromoId: string | null;
                processedAt: Date | null;
                completedAt: Date | null;
                failureReason: string | null;
                qstashMessageId: string | null;
                paymentTransactionId: string | null;
                user: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string;
                    emailVerified: boolean;
                    role: string;
                    agencyRoleId: string | null;
                    status: string;
                    lastAccessedTeamId: string | null;
                    lastLoginAt: Date | null;
                    image: string | null;
                    notificationSoundEnabled: boolean | null;
                    browserNotificationsEnabled: boolean | null;
                    notificationSoundVolume: number | null;
                    browserNotificationPermission: string | null;
                    notificationPreferencesUpdatedAt: Date | null;
                } | null;
                team: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    baseCurrency: string;
                    logoUrl: string | null;
                    isActive: boolean;
                    createdById: string;
                } | null;
                niscProductPromo: {
                    id: string;
                    name: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    code: string;
                    productId: string | null;
                    productPlanId: string | null;
                    discountType: string;
                    discountValue: string | null;
                    discountCurrency: string | null;
                    startDate: Date;
                    endDate: Date | null;
                    usageLimit: number | null;
                    usageCount: number;
                    minOrderValue: string | null;
                } | null;
                orderItems: {
                    id: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    status: string;
                    metadata: unknown;
                    productId: string;
                    billingCycle: string | null;
                    productPlanId: string | null;
                    niscOrderId: string;
                    primaryDomain: string | null;
                    itemPrice: string;
                    itemSubtotal: string;
                    itemCurrency: string;
                    provisioningError: string | null;
                    provisioningErrorDetails: unknown;
                    niscClientSubscriptionId: string | null;
                    domainSubscriptionId: string | null;
                    product: {
                        id: string;
                        name: string;
                        description: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        isActive: boolean;
                        metadata: unknown;
                        category: string;
                        serviceType: string;
                        sortOrder: number;
                        features: unknown;
                        highlights: unknown;
                        isAddOn: boolean;
                    };
                    productPlan: {
                        id: string;
                        name: string;
                        description: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        isActive: boolean;
                        metadata: unknown;
                        currency: string | null;
                        price: string | null;
                        sortOrder: number;
                        highlights: unknown;
                        productId: string;
                        pricingModel: string;
                        billingCycle: string | null;
                        setupFee: string | null;
                        cost: string | null;
                        costCurrency: string | null;
                        commissionRate: string | null;
                        commissionBase: string | null;
                        commissionBaseDescription: string | null;
                        planFeatures: unknown;
                        isPopular: boolean;
                        isRecommended: boolean;
                        isDefault: boolean;
                        pleskServicePlanId: string | null;
                        pleskFilterId: string | null;
                        pleskIpAddress: string | null;
                        hostingType: string | null;
                    } | null;
                    niscClientSubscription: {
                        id: string;
                        name: string | null;
                        description: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        status: string;
                        userId: string | null;
                        teamId: string | null;
                        metadata: unknown;
                        notes: string | null;
                        recordedBy: string | null;
                        productId: string;
                        pricingModel: string;
                        billingCycle: string | null;
                        pleskFilterId: string | null;
                        hostingType: string | null;
                        productPlanId: string | null;
                        orderId: string | null;
                        niscOrderId: string | null;
                        subscribedBy: string | null;
                        subscriptionDate: Date | null;
                        nextRenewalDate: Date | null;
                        expiryDate: Date | null;
                        autoRenew: boolean;
                        upgradedToSubscriptionId: string | null;
                        upgradedAt: Date | null;
                        downgradedToSubscriptionId: string | null;
                        downgradedAt: Date | null;
                        agreedPrice: string | null;
                        agreedCurrency: string | null;
                        agreedCost: string | null;
                        agreedCostCurrency: string | null;
                        providerCost: string | null;
                        providerCostCurrency: string | null;
                        agreedCommissionRate: string | null;
                        agreedCommissionBase: string | null;
                        primaryDomain: string | null;
                        pleskOwnerId: string | null;
                        pleskFtpLogin: string | null;
                        pleskFtpPassword: string | null;
                        openProviderId: number | null;
                        domainAuthCode: string | null;
                        nameserverGroupId: string | null;
                        wpInstallationId: number | null;
                        serviceRefs: unknown;
                        hostingSubscriptionId: string | null;
                    } | null;
                    domainSubscription: {
                        id: string;
                        name: string | null;
                        description: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        status: string;
                        userId: string | null;
                        teamId: string | null;
                        metadata: unknown;
                        notes: string | null;
                        recordedBy: string | null;
                        productId: string;
                        pricingModel: string;
                        billingCycle: string | null;
                        pleskFilterId: string | null;
                        hostingType: string | null;
                        productPlanId: string | null;
                        orderId: string | null;
                        niscOrderId: string | null;
                        subscribedBy: string | null;
                        subscriptionDate: Date | null;
                        nextRenewalDate: Date | null;
                        expiryDate: Date | null;
                        autoRenew: boolean;
                        upgradedToSubscriptionId: string | null;
                        upgradedAt: Date | null;
                        downgradedToSubscriptionId: string | null;
                        downgradedAt: Date | null;
                        agreedPrice: string | null;
                        agreedCurrency: string | null;
                        agreedCost: string | null;
                        agreedCostCurrency: string | null;
                        providerCost: string | null;
                        providerCostCurrency: string | null;
                        agreedCommissionRate: string | null;
                        agreedCommissionBase: string | null;
                        primaryDomain: string | null;
                        pleskOwnerId: string | null;
                        pleskFtpLogin: string | null;
                        pleskFtpPassword: string | null;
                        openProviderId: number | null;
                        domainAuthCode: string | null;
                        nameserverGroupId: string | null;
                        wpInstallationId: number | null;
                        serviceRefs: unknown;
                        hostingSubscriptionId: string | null;
                    } | null;
                }[];
                processingLogs: {
                    id: string;
                    createdAt: Date;
                    niscOrderId: string;
                    step: string;
                    payload: unknown;
                }[];
            };
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                items: {
                    productId: string;
                    productPlanId: string;
                    billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
                    primaryDomain?: string | undefined;
                    domainSubscriptionId?: string | undefined;
                    metadata?: {
                        transferAuthCode?: string | undefined;
                        nameServers?: {
                            name: string;
                            ip?: string | undefined;
                        }[] | undefined;
                    } | undefined;
                }[];
                userId?: string | undefined;
                teamId?: string | undefined;
                promoCode?: string | undefined;
                notes?: string | undefined;
            };
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                userId: string | null;
                teamId: string | null;
                metadata: unknown;
                invoiceNumber: string | null;
                subtotal: string;
                currency: string;
                createdBy: string | null;
                invoiceId: string | null;
                total: string;
                notes: string | null;
                orderNumber: string;
                niscProductPromoId: string | null;
                processedAt: Date | null;
                completedAt: Date | null;
                failureReason: string | null;
                qstashMessageId: string | null;
                paymentTransactionId: string | null;
                user: {
                    id: string;
                    name: string;
                    email: string;
                } | null;
                team: {
                    id: string;
                    name: string;
                } | null;
                orderItems: {
                    id: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    status: string;
                    metadata: unknown;
                    productId: string;
                    billingCycle: string | null;
                    productPlanId: string | null;
                    niscOrderId: string;
                    primaryDomain: string | null;
                    itemPrice: string;
                    itemSubtotal: string;
                    itemCurrency: string;
                    provisioningError: string | null;
                    provisioningErrorDetails: unknown;
                    niscClientSubscriptionId: string | null;
                    domainSubscriptionId: string | null;
                    product: {
                        id: string;
                        name: string;
                        serviceType: string;
                    };
                    productPlan: {
                        id: string;
                        name: string;
                    } | null;
                }[];
            } | undefined;
            meta: object;
        }>;
        createFromPayment: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                checkoutRequestId: string;
                items: {
                    productId: string;
                    itemPrice: string;
                    itemSubtotal: string;
                    productPlanId?: string | null | undefined;
                    billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
                    primaryDomain?: string | undefined;
                    description?: string | undefined;
                    domainSubscriptionId?: string | undefined;
                    metadata?: {
                        transferAuthCode?: string | undefined;
                        nameServers?: {
                            name: string;
                            ip?: string | undefined;
                        }[] | undefined;
                    } | undefined;
                }[];
                currency?: string | undefined;
                teamId?: string | undefined;
            };
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                userId: string | null;
                teamId: string | null;
                metadata: unknown;
                invoiceNumber: string | null;
                subtotal: string;
                currency: string;
                createdBy: string | null;
                invoiceId: string | null;
                total: string;
                notes: string | null;
                orderNumber: string;
                niscProductPromoId: string | null;
                processedAt: Date | null;
                completedAt: Date | null;
                failureReason: string | null;
                qstashMessageId: string | null;
                paymentTransactionId: string | null;
                user: {
                    id: string;
                    name: string;
                    email: string;
                } | null;
                team: {
                    id: string;
                    name: string;
                } | null;
                orderItems: {
                    id: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    status: string;
                    metadata: unknown;
                    productId: string;
                    billingCycle: string | null;
                    productPlanId: string | null;
                    niscOrderId: string;
                    primaryDomain: string | null;
                    itemPrice: string;
                    itemSubtotal: string;
                    itemCurrency: string;
                    provisioningError: string | null;
                    provisioningErrorDetails: unknown;
                    niscClientSubscriptionId: string | null;
                    domainSubscriptionId: string | null;
                    product: {
                        id: string;
                        name: string;
                        serviceType: string;
                    };
                    productPlan: {
                        id: string;
                        name: string;
                    } | null;
                }[];
            } | undefined;
            meta: object;
        }>;
        retry: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                niscOrderId: string;
            };
            output: {
                success: boolean;
                niscOrderId: string;
            };
            meta: object;
        }>;
    }>>;
    publicPricing: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getDefaultMarginConfig: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                success: boolean;
                data: {
                    marginType: string | null;
                    percentageMargin: string | null;
                    fixedMargin: string | null;
                    roundOff: string | null;
                } | null;
                error?: string | undefined;
            };
            meta: object;
        }>;
        getExchangeRatesPublic: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                baseCurrency?: string | undefined;
            } | undefined;
            output: {
                success: boolean;
                data: {
                    base: string;
                    rates: Record<string, number>;
                    timestamp: number;
                } | null;
                error?: string | undefined;
            };
            meta: object;
        }>;
        convertPricesPublic: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                prices: {
                    amount: number;
                    currency: string;
                }[];
                targetCurrency: string;
            };
            output: {
                success: boolean;
                data?: {
                    originalAmount: number;
                    convertedAmount: number;
                    rate: number;
                    currency: string;
                }[] | undefined;
                error?: string | undefined;
            };
            meta: object;
        }>;
    }>>;
    agencyRbac: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        permissionCatalog: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: ("/agency/clients" | "/agency/billing" | "/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/hosting" | "/agency/wordpress" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/creative-assets" | "/agency/gen-ai/image-gen-studio" | "/agency/gen-ai/image-generator" | "/agency/gen-ai/background-remover" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/manage-teams" | "/agency/manage-users" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/branches" | "/agency/kra-etims/settings" | "/agency/reports/sales" | "/agency/reports/creative")[];
            meta: object;
        }>;
        rolesList: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                name: string;
                description: string | null;
                isSystem: boolean;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        roleById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                roleId: string;
            };
            output: {
                id: string;
                name: string;
                description: string | null;
                isSystem: boolean;
                createdAt: Date;
                updatedAt: Date;
                permissionKeys: ("/agency/clients" | "/agency/billing" | "/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/hosting" | "/agency/wordpress" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/creative-assets" | "/agency/gen-ai/image-gen-studio" | "/agency/gen-ai/image-generator" | "/agency/gen-ai/background-remover" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/manage-teams" | "/agency/manage-users" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/branches" | "/agency/kra-etims/settings" | "/agency/reports/sales" | "/agency/reports/creative")[];
            };
            meta: object;
        }>;
        roleCreate: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                description?: string | undefined;
            };
            output: {
                id: string;
                name: string;
                description: string | null;
                isSystem: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        roleUpdate: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                roleId: string;
                name?: string | undefined;
                description?: string | undefined;
            };
            output: {
                id: string;
                name: string;
                description: string | null;
                isSystem: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        roleDelete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                roleId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        permissionsList: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                key: "/agency/clients" | "/agency/billing" | "/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/hosting" | "/agency/wordpress" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/creative-assets" | "/agency/gen-ai/image-gen-studio" | "/agency/gen-ai/image-generator" | "/agency/gen-ai/background-remover" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/manage-teams" | "/agency/manage-users" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/branches" | "/agency/kra-etims/settings" | "/agency/reports/sales" | "/agency/reports/creative";
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        permissionUpsert: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                key: "/agency/clients" | "/agency/billing" | "/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/hosting" | "/agency/wordpress" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/creative-assets" | "/agency/gen-ai/image-gen-studio" | "/agency/gen-ai/image-generator" | "/agency/gen-ai/background-remover" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/manage-teams" | "/agency/manage-users" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/branches" | "/agency/kra-etims/settings" | "/agency/reports/sales" | "/agency/reports/creative";
                description?: string | undefined;
            };
            output: {
                id: string;
                key: "/agency/clients" | "/agency/billing" | "/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/hosting" | "/agency/wordpress" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/creative-assets" | "/agency/gen-ai/image-gen-studio" | "/agency/gen-ai/image-generator" | "/agency/gen-ai/background-remover" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/manage-teams" | "/agency/manage-users" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/branches" | "/agency/kra-etims/settings" | "/agency/reports/sales" | "/agency/reports/creative";
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        rolePermissionsSet: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                roleId: string;
                permissionKeys?: ("/agency/clients" | "/agency/billing" | "/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/hosting" | "/agency/wordpress" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/creative-assets" | "/agency/gen-ai/image-gen-studio" | "/agency/gen-ai/image-generator" | "/agency/gen-ai/background-remover" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/manage-teams" | "/agency/manage-users" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/branches" | "/agency/kra-etims/settings" | "/agency/reports/sales" | "/agency/reports/creative")[] | undefined;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        userAgencyRoleAssign: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                roleId: string | null;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        myMenuAccess: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                roleId: string | null;
                roleName: string | null;
                allowedKeys: ("/agency/clients" | "/agency/billing" | "/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/hosting" | "/agency/wordpress" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/creative-assets" | "/agency/gen-ai/image-gen-studio" | "/agency/gen-ai/image-generator" | "/agency/gen-ai/background-remover" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/manage-teams" | "/agency/manage-users" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/branches" | "/agency/kra-etims/settings" | "/agency/reports/sales" | "/agency/reports/creative")[];
            };
            meta: object;
        }>;
    }>>;
}>>;
export type AppRouter = typeof appRouter;
