export declare const ordersRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId?: string | undefined;
            status?: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "REFUNDED" | "COMPLETED" | "PARTIAL" | undefined;
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
                status: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "REFUNDED" | "COMPLETED" | "PARTIAL";
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
                    billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | "TRIENNIALLY" | "QUADRENNIALLY";
                    itemPrice: string;
                    itemSubtotal: string;
                    itemCurrency: string;
                    domainName: string | null;
                    description: string | null;
                    adminDescription: string | null;
                    notes: string | null;
                    status: "PENDING" | "FAILED" | "PROVISIONED" | "SKIPPED" | "PROVISIONING";
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
            status: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "REFUNDED" | "COMPLETED" | "PARTIAL";
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
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | "TRIENNIALLY" | "QUADRENNIALLY";
                itemPrice: string;
                itemSubtotal: string;
                itemCurrency: string;
                domainName: string | null;
                description: string | null;
                adminDescription: string | null;
                notes: string | null;
                status: "PENDING" | "FAILED" | "PROVISIONED" | "SKIPPED" | "PROVISIONING";
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
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | "TRIENNIALLY" | "QUADRENNIALLY";
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
                status: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "REFUNDED" | "COMPLETED" | "PARTIAL";
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
                    billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | "TRIENNIALLY" | "QUADRENNIALLY";
                    itemPrice: string;
                    itemSubtotal: string;
                    itemCurrency: string;
                    domainName: string | null;
                    description: string | null;
                    adminDescription: string | null;
                    notes: string | null;
                    status: "PENDING" | "FAILED" | "PROVISIONED" | "SKIPPED" | "PROVISIONING";
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
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | "TRIENNIALLY" | "QUADRENNIALLY";
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
                status: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "REFUNDED" | "COMPLETED" | "PARTIAL";
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
                    billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | "TRIENNIALLY" | "QUADRENNIALLY";
                    itemPrice: string;
                    itemSubtotal: string;
                    itemCurrency: string;
                    domainName: string | null;
                    description: string | null;
                    adminDescription: string | null;
                    notes: string | null;
                    status: "PENDING" | "FAILED" | "PROVISIONED" | "SKIPPED" | "PROVISIONING";
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
                status: "PENDING" | "FAILED" | "PROVISIONED" | "SKIPPED" | "PROVISIONING";
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
                status: "PENDING" | "FAILED" | "PROVISIONED" | "SKIPPED" | "PROVISIONING";
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
