export declare const niscEmailMarketingCampaignsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId?: string | null | undefined;
            status?: "DRAFT" | "SCHEDULED" | "FAILED" | "COMPLETED" | "CANCELLED" | undefined;
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
                status: "DRAFT" | "SCHEDULED" | "FAILED" | "COMPLETED" | "CANCELLED";
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
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            name: string;
            subject: string;
            fromEmail: string;
            status: "DRAFT" | "SCHEDULED" | "FAILED" | "COMPLETED" | "CANCELLED";
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
            id: `${string}-${string}-${string}-${string}-${string}`;
        };
        meta: object;
    }>;
    send: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            immediate?: boolean | undefined;
        };
        output: {
            ok: boolean;
            status: string;
            qstashMessageId?: undefined;
        } | {
            ok: boolean;
            qstashMessageId: string;
            status?: undefined;
        };
        meta: object;
    }>;
    cancel: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            cancelledAt: string;
        };
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            ok: boolean;
        };
        meta: object;
    }>;
}>>;
