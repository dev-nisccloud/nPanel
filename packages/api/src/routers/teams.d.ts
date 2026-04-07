export declare const teamsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Create a new team
     * Also creates the first team member with OWNER role
     */
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
