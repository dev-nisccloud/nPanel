/**
 * Email Marketing Router
 *
 * - Domains: Manage email domains via Resend
 * - Campaigns: Email campaigns with per-campaign recipients (CampaignRecipient)
 * - Email events: Resend webhook events per recipient (EmailEvent)
 */
export declare const emailMarketingRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    domains: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainName: string;
                teamId?: string | null | undefined;
            };
            output: {
                id: string;
                domainName: string;
                status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                resendDomainId: string | null;
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
                verificationStatus: string | null;
                verificationData: unknown;
                dnsRecords: unknown;
            };
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                domainName: string;
                status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                resendDomainId: string | null;
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
                verificationStatus: string | null;
                verificationData: unknown;
                dnsRecords: unknown;
            };
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId?: string | null | undefined;
                status?: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED" | undefined;
                search?: string | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                domains: {
                    id: string;
                    domainName: string;
                    status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                    resendDomainId: string | null;
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    verifiedAt: Date | null;
                }[];
                total: number;
            };
            meta: object;
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                domainName?: string | undefined;
                verificationStatus?: string | null | undefined;
                verificationData?: unknown;
                dnsRecords?: unknown;
                status?: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED" | undefined;
            };
            output: {
                id: string;
                domainName: string;
                status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                resendDomainId: string | null;
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
                verificationStatus: string | null;
                verificationData: unknown;
                dnsRecords: unknown;
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
        verify: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                domainName: string;
                status: "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";
                resendDomainId: string | null;
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
                verificationStatus: string | null;
                verificationData: unknown;
                dnsRecords: unknown;
            };
            meta: object;
        }>;
    }>>;
    campaigns: import("@trpc/server").TRPCBuiltRouter<{
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
    emailEvents: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                campaignRecipientId: string;
                type: "email_bounced" | "email_clicked" | "email_complained" | "email_delivered" | "email_delivery_delayed" | "email_failed" | "email_opened" | "email_received" | "email_scheduled" | "email_sent" | "email_suppressed";
                eventCreatedAt: Date;
                resendEmailId: string | null;
                data: unknown;
                createdAt: Date;
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
    audiences: import("@trpc/server").TRPCBuiltRouter<{
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
}>>;
