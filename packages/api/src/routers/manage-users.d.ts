export declare const manageUsersRouter: import("@trpc/server").TRPCBuiltRouter<{
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
