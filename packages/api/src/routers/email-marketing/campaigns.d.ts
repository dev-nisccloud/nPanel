export declare const emailMarketingCampaignsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            subject: string;
            fromEmail: string;
            recipientEmails: string[];
            description?: string | null | undefined;
            fromName?: string | null | undefined;
            emailDomainId?: string | null | undefined;
            htmlContent?: string | null | undefined;
            textContent?: string | null | undefined;
            scheduledAt?: unknown;
            teamId?: string | null | undefined;
        };
        output: {
            id: string;
            name: string;
            subject: string;
            fromEmail: string;
            status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "FAILED" | "CANCELLED";
            recipientCount: number;
            userId: string;
            teamId: string | null;
            createdAt: Date;
            updatedAt: Date;
            scheduledAt: Date | null;
            sentAt: Date | null;
            description: string | null;
            fromName: string | null;
            emailDomainId: string | null;
            htmlContent: string | null;
            textContent: string | null;
            recipients: {
                id: string;
                campaignId: string;
                toEmail: string;
                resendId: string | null;
                resendMessageId: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
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
            subject: string;
            fromEmail: string;
            status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "FAILED" | "CANCELLED";
            recipientCount: number;
            userId: string;
            teamId: string | null;
            createdAt: Date;
            updatedAt: Date;
            scheduledAt: Date | null;
            sentAt: Date | null;
            description: string | null;
            fromName: string | null;
            emailDomainId: string | null;
            htmlContent: string | null;
            textContent: string | null;
            recipients: {
                id: string;
                campaignId: string;
                toEmail: string;
                resendId: string | null;
                resendMessageId: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId?: string | null | undefined;
            status?: "DRAFT" | "SCHEDULED" | "COMPLETED" | "FAILED" | "CANCELLED" | undefined;
            search?: string | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            campaigns: {
                id: string;
                name: string;
                subject: string;
                fromEmail: string;
                status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "FAILED" | "CANCELLED";
                recipientCount: number;
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
                scheduledAt: Date | null;
                sentAt: Date | null;
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
            subject?: string | undefined;
            fromEmail?: string | undefined;
            fromName?: string | null | undefined;
            recipientEmails?: string[] | undefined;
            emailDomainId?: string | null | undefined;
            htmlContent?: string | null | undefined;
            textContent?: string | null | undefined;
            scheduledAt?: unknown;
        };
        output: {
            id: string;
            name: string;
            subject: string;
            fromEmail: string;
            status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "FAILED" | "CANCELLED";
            recipientCount: number;
            userId: string;
            teamId: string | null;
            createdAt: Date;
            updatedAt: Date;
            scheduledAt: Date | null;
            sentAt: Date | null;
            description: string | null;
            fromName: string | null;
            emailDomainId: string | null;
            htmlContent: string | null;
            textContent: string | null;
            recipients: {
                id: string;
                campaignId: string;
                toEmail: string;
                resendId: string | null;
                resendMessageId: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
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
    send: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            immediate?: boolean | undefined;
        };
        output: {
            success: boolean;
            message: string;
            sendJobId: string;
            messageId: string;
            scheduledFor: number | null;
        };
        meta: object;
    }>;
    cancel: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
            cancelledAt: string;
        };
        meta: object;
    }>;
    addRecipients: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            campaignId: string;
            emails: string[];
        };
        output: {
            added: number;
        };
        meta: object;
    }>;
    listRecipients: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            campaignId: string;
            search?: string | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            recipients: {
                id: string;
                campaignId: string;
                toEmail: string;
                resendId: string | null;
                resendMessageId: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            total: number;
        };
        meta: object;
    }>;
}>>;
