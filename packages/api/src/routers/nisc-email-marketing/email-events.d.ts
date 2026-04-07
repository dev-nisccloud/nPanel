export declare const niscEmailMarketingEmailEventsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            campaignRecipientId?: string | undefined;
            campaignId?: string | undefined;
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
