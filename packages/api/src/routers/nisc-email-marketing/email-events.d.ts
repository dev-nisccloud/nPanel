export declare const niscEmailMarketingEmailEventsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            type: string;
            eventCreatedAt: Date;
            recipientEmail: string | null;
            link: string | null;
            data: Record<string, unknown> | null;
            campaignId: string | null;
            campaignName: string | null;
            subject: string | null;
            fromEmail: string | null;
            fromName: string | null;
            htmlContent: string | null;
            textContent: string | null;
        };
        meta: object;
    }>;
    getGlobalEvents: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from?: unknown;
            to?: unknown;
        };
        output: {
            type: "email_bounced" | "email_clicked" | "email_complained" | "email_delivered" | "email_delivery_delayed" | "email_failed" | "email_opened" | "email_received" | "email_scheduled" | "email_sent" | "email_suppressed";
            eventCreatedAt: Date;
        }[];
        meta: object;
    }>;
    getCampaignSummary: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            campaignId: string;
        };
        output: {
            delivered: number;
            bounced: number;
            suppressed: number;
            opened: number;
            openedTotal: number;
            clicked: number;
            clickedTotal: number;
            complained: number;
            unsubscribed: number;
            totalRecipients: number;
        };
        meta: object;
    }>;
    getCampaignReport: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            campaignId: string;
        };
        output: {
            campaign: {
                creator: {
                    name: string | null;
                    email: string | null;
                };
                companyName: string | null;
                id: string;
                userId: string;
                teamId: string | null;
                name: string;
                subject: string;
                fromEmail: string;
                fromName: string | null;
                replyTo: string | null;
                status: string;
                totalRecipients: number;
                scheduledAt: Date | null;
                sentAt: Date | null;
                completedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            timing: {
                avgDeliveryMs: number | null;
                avgOpenMs: number | null;
                avgClickMs: number | null;
                sendDurationMs: number | null;
            };
        };
        meta: object;
    }>;
    getBounceBreakdown: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            campaignId: string;
        };
        output: {
            campaignId: string;
            byType: Record<string, number>;
            topSubTypes: {
                bounceSubType: string;
                count: number;
            }[];
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            campaignRecipientId?: string | undefined;
            campaignId?: string | undefined;
            recipientEmail?: string | undefined;
            type?: "email_bounced" | "email_clicked" | "email_complained" | "email_delivered" | "email_delivery_delayed" | "email_failed" | "email_opened" | "email_received" | "email_scheduled" | "email_sent" | "email_suppressed" | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            events: {
                id: string;
                campaignRecipientId: string;
                type: "email_bounced" | "email_clicked" | "email_complained" | "email_delivered" | "email_delivery_delayed" | "email_failed" | "email_opened" | "email_received" | "email_scheduled" | "email_sent" | "email_suppressed";
                eventCreatedAt: Date;
                resendEmailId: string | null;
                data: unknown;
                createdAt: Date;
                recipientEmail?: string | null | undefined;
                link?: string | null | undefined;
            }[];
            total: number;
        };
        meta: object;
    }>;
    getTopClickedLinks: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            campaignId: string;
            limit?: number | undefined;
        };
        output: {
            url: string;
            clicks: number;
        }[];
        meta: object;
    }>;
}>>;
