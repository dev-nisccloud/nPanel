export declare const userProfileRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get current user's full profile information
     */
    getUserInfo: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            image: string | null;
            role: "CUSTOMER" | "AGENCY_SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENCY_USER";
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
    /**
     * Update user profile information
     */
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
    /**
     * Get all active sessions for current user
     */
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
    /**
     * Revoke a specific session
     */
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
    /**
     * Revoke all sessions for the current user, including the current session.
     */
    revokeAllSessions: import("@trpc/server").TRPCMutationProcedure<{
        input: void;
        output: {
            success: boolean;
            revokedCount: number;
            message?: string | undefined;
        };
        meta: object;
    }>;
    /**
     * Get user information by ID with optional field selection
     * This is useful for cases where you only need specific user fields
     */
    getUserById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userId: string;
            fields?: ("id" | "name" | "email" | "emailVerified" | "role" | "status" | "lastLoginAt" | "image" | "createdAt" | "updatedAt" | "profile")[] | undefined;
        };
        output: Record<string, unknown>;
        meta: object;
    }>;
    /**
     * Get multiple users by IDs in a single request (batched)
     * Returns a map of userId -> user data for efficient lookups
     */
    getUsersByIds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userIds: string[];
            fields?: ("id" | "name" | "email" | "emailVerified" | "role" | "status" | "lastLoginAt" | "image" | "createdAt" | "updatedAt" | "profile")[] | undefined;
        };
        output: Record<string, any>;
        meta: object;
    }>;
    /**
     * Agency: list customer users with profile completeness for domain registrant selection.
     */
    listCustomersForRegistrant: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            name: string;
            email: string;
            profileComplete: boolean;
            missingFields: string[];
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
        }[];
        meta: object;
    }>;
}>>;
