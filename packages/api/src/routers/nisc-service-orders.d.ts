export declare const niscServiceOrdersRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userId?: string | undefined;
            teamId?: string | undefined;
            status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL" | undefined;
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
                invoiceId: string | null;
                invoiceNumber: string | null;
                metadata: unknown;
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
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            teamId: string | null;
            notes: string | null;
            completedAt: Date | null;
            metadata: unknown;
            createdBy: string | null;
            qstashMessageId: string | null;
            paymentTransactionId: string | null;
            currency: string;
            invoiceNumber: string | null;
            subtotal: string;
            invoiceId: string | null;
            total: string;
            orderNumber: string;
            niscProductPromoId: string | null;
            processedAt: Date | null;
            failureReason: string | null;
            user: {
                id: string;
                name: string;
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
                generalEmailsAccepted: boolean | null;
                invoiceEmailsAccepted: boolean | null;
                supportEmailsAccepted: boolean | null;
                productEmailsAccepted: boolean | null;
                domainEmailsAccepted: boolean | null;
                affiliateEmailsAccepted: boolean | null;
                marketingEmailsAccepted: boolean | null;
                smsMarketingAccepted: boolean | null;
                adminNotes: string | null;
                howDidYouFindUs: string | null;
                acceptedTermsAndConditions: boolean | null;
                banned: boolean | null;
                banReason: string | null;
                banExpires: Date | null;
                createdAt: Date;
                updatedAt: Date;
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
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                isActive: boolean;
                productId: string | null;
                code: string;
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
                status: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                primaryDomain: string | null;
                metadata: unknown;
                productId: string;
                billingCycle: string | null;
                productPlanId: string | null;
                niscOrderId: string;
                itemPrice: string;
                itemSubtotal: string;
                itemCurrency: string;
                provisioningError: string | null;
                provisioningErrorDetails: unknown;
                niscClientSubscriptionId: string | null;
                domainSubscriptionId: string | null;
                niscClientSubscription: {
                    id: string;
                    name: string | null;
                    status: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string | null;
                    description: string | null;
                    primaryDomain: string | null;
                    teamId: string | null;
                    notes: string | null;
                    metadata: unknown;
                    productId: string;
                    recordedBy: string | null;
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
                product: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    isActive: boolean;
                    category: string;
                    metadata: unknown;
                    serviceType: string;
                    sortOrder: number;
                    features: unknown;
                    highlights: unknown;
                    isAddOn: boolean;
                    etimsItemCd: string | null;
                    etimsItemClsCd: string | null;
                    etimsTaxTyCd: string | null;
                    etimsDefaultPrice: string | null;
                    etimsPkgUnitCd: string | null;
                    etimsQtyUnitCd: string | null;
                };
                productPlan: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    isActive: boolean;
                    metadata: unknown;
                    productId: string;
                    price: string | null;
                    currency: string | null;
                    sortOrder: number;
                    highlights: unknown;
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
                domainSubscription: {
                    id: string;
                    name: string | null;
                    status: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string | null;
                    description: string | null;
                    primaryDomain: string | null;
                    teamId: string | null;
                    notes: string | null;
                    metadata: unknown;
                    productId: string;
                    recordedBy: string | null;
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
                payload: unknown;
                niscOrderId: string;
                step: string;
            }[];
        };
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            items: {
                productId: string;
                productPlanId: string;
                metadata: unknown;
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
                primaryDomain?: string | undefined;
                domainSubscriptionId?: string | undefined;
            }[];
            userId?: string | undefined;
            teamId?: string | undefined;
            promoCode?: string | undefined;
            notes?: string | undefined;
        };
        output: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            teamId: string | null;
            notes: string | null;
            completedAt: Date | null;
            metadata: unknown;
            createdBy: string | null;
            qstashMessageId: string | null;
            paymentTransactionId: string | null;
            currency: string;
            invoiceNumber: string | null;
            subtotal: string;
            invoiceId: string | null;
            total: string;
            orderNumber: string;
            niscProductPromoId: string | null;
            processedAt: Date | null;
            failureReason: string | null;
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
                status: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                primaryDomain: string | null;
                metadata: unknown;
                productId: string;
                billingCycle: string | null;
                productPlanId: string | null;
                niscOrderId: string;
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
    /**
     * Create a Nisc order from a successful M-Pesa payment (agency: logged-in user only).
     * Verifies payment by checkoutRequestId, creates order with paymentTransactionId, enqueues processing, sends "order received" email.
     */
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
                metadata?: Record<string, unknown> | null | undefined;
            }[];
            currency?: string | undefined;
            teamId?: string | undefined;
            billedForUserId?: string | undefined;
            skipInvoice?: boolean | undefined;
        };
        output: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            teamId: string | null;
            notes: string | null;
            completedAt: Date | null;
            metadata: unknown;
            createdBy: string | null;
            qstashMessageId: string | null;
            paymentTransactionId: string | null;
            currency: string;
            invoiceNumber: string | null;
            subtotal: string;
            invoiceId: string | null;
            total: string;
            orderNumber: string;
            niscProductPromoId: string | null;
            processedAt: Date | null;
            failureReason: string | null;
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
                status: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                primaryDomain: string | null;
                metadata: unknown;
                productId: string;
                billingCycle: string | null;
                productPlanId: string | null;
                niscOrderId: string;
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
    /**
     * Create order from a SUCCESS Jenga card payment using metadata stored at initiate time.
     * Used by the post-redirect return page so the closed dialog payload is not required.
     */
    createFromJengaPayment: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            orderReference: string;
        };
        output: unknown;
        meta: object;
    }>;
}>>;
