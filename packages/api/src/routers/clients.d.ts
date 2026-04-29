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
            role: "CUSTOMER" | "AGENCY_USER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN";
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
            role?: "CUSTOMER" | "AGENCY_USER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | undefined;
        };
        output: {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            role: "CUSTOMER" | "AGENCY_USER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN";
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
            role?: "CUSTOMER" | "AGENCY_USER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | undefined;
        };
        output: {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            role: "CUSTOMER" | "AGENCY_USER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN";
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
