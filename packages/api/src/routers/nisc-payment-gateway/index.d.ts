/**
 * Nisc Payment Gateway - tRPC Router (Agency Side)
 *
 * SECURITY: Requires authentication (protectedProcedure)
 * ACCESS CONTROL: Team-based permissions (only team members can manage their merchants)
 *
 * ENDPOINTS:
 * - Merchant Management (create, list, update, suspend)
 * - Credentials Management (add, update, verify)
 * - API Keys Management (create, list, revoke)
 * - Transaction Logs (list, details)
 * - Request Logs (list, filter)
 * - Access Logs (analytics, billing)
 */
/**
 * Nisc Payment Gateway Router (Agency Side)
 *
 * STRUCTURE:
 * - niscPaymentGateway.merchants.*
 * - niscPaymentGateway.credentials.*
 * - niscPaymentGateway.apiKeys.*
 * - niscPaymentGateway.transactions.*
 * - niscPaymentGateway.requestLogs.*
 * - niscPaymentGateway.accessLogs.*
 */
export declare const niscPaymentGatewayRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    merchants: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                merchantName: string;
                merchantEmail: string;
                merchantPhone?: string | undefined;
                merchantWebsite?: string | undefined;
                businessType?: "BUSINESS" | "INDIVIDUAL" | "NGO" | undefined;
                businessName?: string | undefined;
                businessRegistration?: string | undefined;
                teamId?: string | undefined;
                settings?: {
                    webhookUrl?: string | undefined;
                    webhookSecret?: string | undefined;
                    allowedOrigins?: string[] | undefined;
                    notificationEmails?: string[] | undefined;
                    ipWhitelist?: string[] | undefined;
                } | undefined;
                notes?: string | undefined;
            };
            output: {
                success: boolean;
                merchant: {
                    id: string;
                    status: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    createdById: string;
                    teamId: string | null;
                    notes: string | null;
                    metadata: unknown;
                    closedAt: Date | null;
                    settings: {
                        webhookUrl?: string;
                        webhookSecret?: string;
                        allowedOrigins?: string[];
                        notificationEmails?: string[];
                        ipWhitelist?: string[];
                    };
                    businessName: string | null;
                    merchantName: string;
                    merchantEmail: string;
                    merchantPhone: string | null;
                    merchantWebsite: string | null;
                    businessType: string;
                    businessRegistration: string | null;
                    suspendedAt: Date | null;
                } | undefined;
            };
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                status?: "ACTIVE" | "PENDING" | "SUSPENDED" | "CLOSED" | undefined;
                teamIds?: string[] | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                merchants: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    merchantName: string;
                    merchantEmail: string;
                    merchantPhone: string | null;
                    merchantWebsite: string | null;
                    businessType: string;
                    businessName: string | null;
                    businessRegistration: string | null;
                    status: string;
                    settings: {
                        webhookUrl?: string;
                        webhookSecret?: string;
                        allowedOrigins?: string[];
                        notificationEmails?: string[];
                        ipWhitelist?: string[];
                    };
                    metadata: unknown;
                    notes: string | null;
                    createdById: string;
                    createdAt: Date;
                    updatedAt: Date;
                    suspendedAt: Date | null;
                    closedAt: Date | null;
                }[];
                pagination: {
                    limit: number;
                    offset: number;
                    hasMore: boolean;
                };
            };
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                merchant: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    merchantName: string;
                    merchantEmail: string;
                    merchantPhone: string | null;
                    merchantWebsite: string | null;
                    businessType: string;
                    businessName: string | null;
                    businessRegistration: string | null;
                    status: string;
                    settings: {
                        webhookUrl?: string;
                        webhookSecret?: string;
                        allowedOrigins?: string[];
                        notificationEmails?: string[];
                        ipWhitelist?: string[];
                    };
                    metadata: unknown;
                    notes: string | null;
                    createdById: string;
                    createdAt: Date;
                    updatedAt: Date;
                    suspendedAt: Date | null;
                    closedAt: Date | null;
                };
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                merchantName?: string | undefined;
                merchantEmail?: string | undefined;
                merchantPhone?: string | undefined;
                merchantWebsite?: string | undefined;
                businessType?: "BUSINESS" | "INDIVIDUAL" | "NGO" | undefined;
                businessName?: string | undefined;
                businessRegistration?: string | undefined;
                settings?: {
                    webhookUrl?: string | undefined;
                    webhookSecret?: string | undefined;
                    allowedOrigins?: string[] | undefined;
                    notificationEmails?: string[] | undefined;
                    ipWhitelist?: string[] | undefined;
                } | undefined;
                notes?: string | undefined;
            };
            output: {
                success: boolean;
                merchant: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    merchantName: string;
                    merchantEmail: string;
                    merchantPhone: string | null;
                    merchantWebsite: string | null;
                    businessType: string;
                    businessName: string | null;
                    businessRegistration: string | null;
                    status: string;
                    settings: {
                        webhookUrl?: string;
                        webhookSecret?: string;
                        allowedOrigins?: string[];
                        notificationEmails?: string[];
                        ipWhitelist?: string[];
                    };
                    metadata: unknown;
                    notes: string | null;
                    createdById: string;
                    createdAt: Date;
                    updatedAt: Date;
                    suspendedAt: Date | null;
                    closedAt: Date | null;
                } | undefined;
            };
            meta: object;
        }>;
        updateStatus: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                status: "ACTIVE" | "SUSPENDED" | "CLOSED";
                reason?: string | undefined;
            };
            output: {
                success: boolean;
                merchant: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    merchantName: string;
                    merchantEmail: string;
                    merchantPhone: string | null;
                    merchantWebsite: string | null;
                    businessType: string;
                    businessName: string | null;
                    businessRegistration: string | null;
                    status: string;
                    settings: {
                        webhookUrl?: string;
                        webhookSecret?: string;
                        allowedOrigins?: string[];
                        notificationEmails?: string[];
                        ipWhitelist?: string[];
                    };
                    metadata: unknown;
                    notes: string | null;
                    createdById: string;
                    createdAt: Date;
                    updatedAt: Date;
                    suspendedAt: Date | null;
                    closedAt: Date | null;
                } | undefined;
            };
            meta: object;
        }>;
        getStats: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamIds?: string[] | undefined;
            } | undefined;
            output: {
                totalApiKeys: number;
                activeApiKeys: number;
                totalTransactions: number;
                successfulTransactions: number;
            };
            meta: object;
        }>;
    }>>;
    credentials: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        add: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                merchantId: string;
                provider: "MPESA" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE";
                environment: "SANDBOX" | "PRODUCTION";
                credentials: any;
            };
            output: {
                success: boolean;
                credentials: {
                    id: string;
                    provider: string;
                    environment: string;
                    isActive: boolean;
                };
            };
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                merchantId: string;
                provider?: "MPESA" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE" | undefined;
            };
            output: {
                credentials: {
                    id: string;
                    provider: string;
                    environment: string;
                    isActive: boolean;
                    lastVerifiedAt: Date | null;
                    verificationStatus: string | null;
                    createdAt: Date;
                }[];
            };
            meta: object;
        }>;
        getDecrypted: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                credentials: import("../../lib/nisc-payment-gateway-encryption").ProviderCredentials;
                provider: string;
                environment: string;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                credentials: any;
                environment?: "SANDBOX" | "PRODUCTION" | undefined;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        deactivate: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        test: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                provider: "MPESA" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE";
                environment: "SANDBOX" | "PRODUCTION";
                credentials: any;
            };
            output: {
                success: boolean;
                message: any;
            };
            meta: object;
        }>;
    }>>;
    apiKeys: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                merchantId: string;
                name: string;
                environment: "test" | "SANDBOX" | "PRODUCTION" | "live";
                permissions?: any[] | undefined;
                rateLimit?: number | undefined;
                allowedIps?: string[] | undefined;
                expiresAt?: Date | undefined;
            };
            output: {
                success: boolean;
                apiKey: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    isActive: boolean;
                    createdById: string;
                    metadata: unknown;
                    expiresAt: Date | null;
                    permissions: string[];
                    keyHash: string;
                    lastUsedAt: Date | null;
                    merchantId: string;
                    environment: string;
                    keyPrefix: string;
                    rateLimit: number;
                    allowedIps: string[] | null;
                    revokedAt: Date | null;
                    revokedById: string | null;
                } | undefined;
                key: string;
            };
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                merchantId: string;
                environment?: "test" | "SANDBOX" | "PRODUCTION" | "live" | undefined;
                isActive?: boolean | undefined;
            };
            output: {
                apiKeys: {
                    id: string;
                    name: string;
                    keyPrefix: string;
                    permissions: string[];
                    environment: string;
                    rateLimit: number;
                    allowedIps: string[] | null;
                    isActive: boolean;
                    expiresAt: Date | null;
                    lastUsedAt: Date | null;
                    createdAt: Date;
                }[];
            };
            meta: object;
        }>;
        revoke: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
    transactions: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                merchantId: string;
                status?: "PENDING" | "PROCESSING" | "CANCELLED" | "SUCCESS" | "FAILED" | undefined;
                provider?: string | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                transactions: {
                    id: string;
                    merchantId: string;
                    apiKeyId: string;
                    paymentTransactionId: string;
                    clientReferenceId: string | null;
                    clientMetadata: unknown;
                    provider: string;
                    status: string;
                    webhookDeliveryStatus: string;
                    createdAt: Date;
                    updatedAt: Date;
                    gateway: string;
                    gatewayStatus: string | null;
                    gatewayMessage: string | null;
                    merchantRequestId: string | null;
                    checkoutRequestId: string | null;
                    receiptNumber: string | null;
                    amount: string;
                    paidAmount: string | null;
                    currency: string;
                    accountReference: string | null;
                    transactionDesc: string | null;
                    phoneNumber: string | null;
                    paymentStatus: string;
                    rawResponse: unknown;
                    initiatedAt: Date;
                    processedAt: Date | null;
                    failedAt: Date | null;
                }[];
                pagination: {
                    limit: number;
                    offset: number;
                    hasMore: boolean;
                };
            };
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                transaction: {
                    id: string;
                    merchantId: string;
                    apiKeyId: string;
                    paymentTransactionId: string;
                    clientReferenceId: string | null;
                    clientMetadata: unknown;
                    provider: string;
                    status: string;
                    webhookDeliveryStatus: string;
                    createdAt: Date;
                    updatedAt: Date;
                    gateway: string;
                    gatewayStatus: string | null;
                    gatewayMessage: string | null;
                    merchantRequestId: string | null;
                    checkoutRequestId: string | null;
                    receiptNumber: string | null;
                    amount: string;
                    paidAmount: string | null;
                    currency: string;
                    accountReference: string | null;
                    transactionDesc: string | null;
                    phoneNumber: string | null;
                    paymentStatus: string;
                    rawResponse: unknown;
                    initiatedAt: Date;
                    processedAt: Date | null;
                    failedAt: Date | null;
                };
            };
            meta: object;
        }>;
    }>>;
    requestLogs: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                merchantId: string;
                apiKeyId?: string | undefined;
                endpoint?: string | undefined;
                statusCode?: number | undefined;
                success?: boolean | undefined;
                startDate?: Date | undefined;
                endDate?: Date | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                logs: {
                    id: string;
                    endpoint: string;
                    method: string;
                    statusCode: number;
                    success: boolean;
                    ipAddress: string | null;
                    timestamp: Date;
                    durationMs: number;
                }[];
                pagination: {
                    limit: number;
                    offset: number;
                    hasMore: boolean;
                };
            };
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                log: {
                    id: string;
                    merchantId: string;
                    apiKeyId: string;
                    endpoint: string;
                    method: string;
                    path: string;
                    requestHeaders: unknown;
                    requestBody: unknown;
                    requestSize: number | null;
                    rawRequest: string | null;
                    ipAddress: string | null;
                    userAgent: string | null;
                    country: string | null;
                    statusCode: number;
                    success: boolean;
                    errorCode: string | null;
                    errorMessage: string | null;
                    responseBody: unknown;
                    responseSize: number | null;
                    rawResponse: string | null;
                    timestamp: Date;
                    durationMs: number;
                    gatewayTransactionId: string | null;
                    paymentTransactionId: string | null;
                    rateLimitRemaining: number | null;
                    rateLimitHit: boolean;
                    year: number;
                    month: number;
                    day: number;
                    hour: number;
                    metadata: unknown;
                };
            };
            meta: object;
        }>;
    }>>;
    accessLogs: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getMonthlyStats: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                merchantId: string;
                year: number;
                month: number;
            };
            output: {
                merchantId: string;
                year: number;
                month: number;
                stats: import("../../lib/nisc-payment-gateway-access-log").AccessLogStats;
            };
            meta: object;
        }>;
        getCurrentMonthStats: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                merchantId: string;
            };
            output: {
                merchantId: string;
                year: number;
                month: number;
                stats: import("../../lib/nisc-payment-gateway-access-log").AccessLogStats;
            };
            meta: object;
        }>;
        getDailyStats: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                merchantId: string;
                year: number;
                month: number;
                day: number;
            };
            output: {
                merchantId: string;
                year: number;
                month: number;
                day: number;
                stats: import("../../lib/nisc-payment-gateway-access-log").AccessLogStats;
            };
            meta: object;
        }>;
        getBillingSummary: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                merchantId: string;
                year: number;
                month: number;
                pricePerRequest?: number | undefined;
            };
            output: {
                merchantId: string;
                year: number;
                month: number;
                stats: import("../../lib/nisc-payment-gateway-access-log").AccessLogStats;
                billing: {
                    billableRequests: number;
                    pricePerRequest: number;
                    totalBill: number;
                    currency: string;
                };
            };
            meta: object;
        }>;
    }>>;
}>>;
