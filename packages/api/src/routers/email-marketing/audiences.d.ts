export declare const emailMarketingAudiencesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
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
