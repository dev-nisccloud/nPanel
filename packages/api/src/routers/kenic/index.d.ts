/**
 * KENIC EPP integration (.ke and other KENIC TLDs).
 * Supported TLDs: .ke, .co.ke, .or.ke, .ne.ke, .me.ke, .mobi.ke, .info.ke, .sc.ke, .ac.ke (.go.ke excluded)
 * Contact create → domain create → domain transfer (RFC 3733, 5731).
 */
export declare const kenicRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    greeting: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
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
        ctx: import("../..").Context;
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
        ctx: import("../..").Context;
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
                loginResultExtValue?: import("./domain-check").EppResultExtValue | undefined;
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
                checkResultExtValue?: import("./domain-check").EppResultExtValue | undefined;
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
                normalized: import("../../lib/epp/domain-check-types").DomainCheckNormalized | null;
                checkResultCode: string;
                checkResultMsg: string;
                parseError?: undefined;
            };
            meta: object;
        }>;
    }>>;
    tlds: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
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
        ctx: import("../..").Context;
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
                    elements?: ("name" | "email" | "addr" | "fax" | "org" | "voice")[] | undefined;
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
        ctx: import("../..").Context;
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
        ctx: import("../..").Context;
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
            output: import("../../lib/kenic-transfer-request").ExecuteKenicTransferResult;
            meta: object;
        }>;
    }>>;
    configStatus: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
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
            output: import("../../lib/epp/epp-client").EppTlsPeerInspectResult;
            meta: object;
        }>;
    }>>;
    /** Agency domains portfolio: list all .ke domains registered through this agency. */
    domainList: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: Record<string, never> | undefined;
            output: {
                success: boolean;
                data: {
                    id: string;
                    domain: string;
                    status: any;
                    registrationDate: string;
                    expiryDate: string;
                    clientName: string;
                    clientEmail: string;
                    tld: string;
                    autoRenewal: boolean;
                    nameservers: string[];
                    source: "kenic";
                }[];
            };
            meta: object;
        }>;
        info: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                domain: string;
            };
            output: {
                success: boolean;
                data: {
                    domain: any;
                    roid: any;
                    status: import("../../lib/epp/kenic-domain-status").KenicPortfolioStatus;
                    isTransferLocked: boolean;
                    isServerTransferLocked: boolean;
                    allStatuses: {
                        status: any;
                        label: any;
                    }[];
                    registrant: any;
                    registrantInfo: {
                        handle: any;
                        roid: any;
                        name: any;
                        organization: any;
                        address: {
                            street: any;
                            city: any;
                            state: any;
                            postcode: any;
                            country: any;
                        };
                        voice: any;
                        fax: any;
                        email: any;
                        clID: any;
                        crID: any;
                        crDate: any;
                        upDate: any;
                        status: any;
                    } | null;
                    contacts: {
                        type: any;
                        handle: any;
                    }[];
                    nameservers: any[];
                    clID: any;
                    crID: any;
                    crDate: any;
                    exDate: string | undefined;
                    upID: any;
                    upDate: any;
                    trDate: any;
                    rgpStatuses: any[];
                    authInfo: any;
                    raw: string;
                    parsed: any;
                };
            };
            meta: object;
        }>;
        updateNameservers: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domain: string;
                nameservers: string[];
            };
            output: {
                success: boolean;
                message: string;
            };
            meta: object;
        }>;
        setTransferLock: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domain: string;
                locked: boolean;
            };
            output: {
                success: boolean;
                message: string;
            };
            meta: object;
        }>;
        updateAuthCode: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domain: string;
                authCode: string;
            };
            output: {
                success: boolean;
                message: string;
            };
            meta: object;
        }>;
    }>>;
}>>;
