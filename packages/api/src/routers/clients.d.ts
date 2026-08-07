export declare const clientsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
            role: "CUSTOMER" | "AGENCY_SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENCY_USER";
            status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
            image: string | null;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
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
        }[];
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            email: string;
            password: string;
            role?: "CUSTOMER" | "AGENCY_SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENCY_USER" | undefined;
            generalEmailsAccepted?: boolean | null | undefined;
            invoiceEmailsAccepted?: boolean | null | undefined;
            supportEmailsAccepted?: boolean | null | undefined;
            productEmailsAccepted?: boolean | null | undefined;
            domainEmailsAccepted?: boolean | null | undefined;
            affiliateEmailsAccepted?: boolean | null | undefined;
            marketingEmailsAccepted?: boolean | null | undefined;
            smsMarketingAccepted?: boolean | null | undefined;
            adminNotes?: string | null | undefined;
            howDidYouFindUs?: string | null | undefined;
            acceptedTermsAndConditions?: boolean | null | undefined;
        };
        output: {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            role: "CUSTOMER" | "AGENCY_SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENCY_USER";
            status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
            image: string | null;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
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
        };
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            userId: string;
            name?: string | undefined;
            email?: string | undefined;
            role?: "CUSTOMER" | "AGENCY_SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENCY_USER" | undefined;
            generalEmailsAccepted?: boolean | null | undefined;
            invoiceEmailsAccepted?: boolean | null | undefined;
            supportEmailsAccepted?: boolean | null | undefined;
            productEmailsAccepted?: boolean | null | undefined;
            domainEmailsAccepted?: boolean | null | undefined;
            affiliateEmailsAccepted?: boolean | null | undefined;
            marketingEmailsAccepted?: boolean | null | undefined;
            smsMarketingAccepted?: boolean | null | undefined;
            adminNotes?: string | null | undefined;
            howDidYouFindUs?: string | null | undefined;
            acceptedTermsAndConditions?: boolean | null | undefined;
        };
        output: {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            role: "CUSTOMER" | "AGENCY_SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENCY_USER";
            status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
            image: string | null;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
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
    getTeams: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userId: string;
        };
        output: {
            id: string;
            name: string;
            slug: string;
            role: string;
            isActive: boolean;
            createdAt: Date;
            logoUrl: string | null;
        }[];
        meta: object;
    }>;
    getInvoiceBillingSummary: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userId: string;
        };
        output: {
            currency: string;
            totalInvoices: number;
            totalAmount: number;
            buckets: {
                key: "cancelled" | "paid" | "draft" | "unpaid" | "refunded";
                label: string;
                count: number;
                amount: number;
            }[];
        };
        meta: object;
    }>;
    getInvoices: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userId: string;
        };
        output: {
            id: string;
            invoiceNumber: string | null;
            customerName: string | null;
            customerEmail: string | null;
            status: string;
            amount: string | null;
            currency: string;
            dueDate: Date | null;
            issueDate: Date | null;
            createdAt: Date;
        }[];
        meta: object;
    }>;
    getSubscriptions: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userId: string;
        };
        output: {
            id: string;
            teamId: string | null;
            status: string;
            billingCycle: string;
            subscriptionDate: Date | null;
            nextRenewalDate: Date | null;
            autoRenew: boolean;
            notes: string | null;
            createdAt: Date;
        }[];
        meta: object;
    }>;
    getQuotations: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userId: string;
        };
        output: {
            id: string;
            quotationNumber: string | null;
            customerName: string | null;
            customerEmail: string | null;
            status: string;
            amount: string | null;
            currency: string;
            issueDate: Date | null;
            createdAt: Date;
        }[];
        meta: object;
    }>;
    getTransactions: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userId: string;
        };
        output: {
            id: string;
            gateway: string;
            amount: string;
            currency: string;
            status: string;
            receiptNumber: string | null;
            accountReference: string | null;
            initiatedAt: Date;
            processedAt: Date | null;
            createdAt: Date;
        }[];
        meta: object;
    }>;
}>>;
