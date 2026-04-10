export declare const niscEmailMarketingRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
                id: `${string}-${string}-${string}-${string}-${string}`;
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
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                ok: boolean;
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
        deleteContact: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                audienceId: string;
            };
            output: {
                ok: boolean;
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
    campaigns: import("@trpc/server").TRPCBuiltRouter<{
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
    domains: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        listAllVerified: import("@trpc/server").TRPCQueryProcedure<{
            input: Record<string, never> | undefined;
            output: {
                domains: {
                    id: string;
                    domainName: string;
                }[];
            };
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainName: string;
                teamId?: string | null | undefined;
            };
            output: {
                id: string;
                domainName: string;
                status: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
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
                status: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
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
        verify: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                domainName: string;
                status: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
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
                ok: boolean;
            };
            meta: object;
        }>;
        listLegacy: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId?: string | null | undefined;
                status?: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED" | undefined;
                search?: string | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                domains: {
                    id: string;
                    domainName: string;
                    status: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
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
        add: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainName: string;
                teamId?: string | null | undefined;
            };
            output: {
                id: string;
                domainName: string;
                status: "PENDING" | "VERIFIED" | "FAILED" | "DELETING";
                dkimStatus: "NotStarted" | "Pending" | "Success" | "Failed" | "TemporaryFailure";
                mailFromMode: "DEFAULT" | "CUSTOM";
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
                dkimTokens: string[];
                feedbackForwardingDisabled: boolean;
                mailFromStatus?: string | null | undefined;
                dnsRecords?: unknown;
                mailFromDomain?: string | null | undefined;
            };
            meta: object;
        }>;
        verifyCheck: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                domainName: string;
                status: "PENDING" | "VERIFIED" | "FAILED" | "DELETING";
                dkimStatus: "NotStarted" | "Pending" | "Success" | "Failed" | "TemporaryFailure";
                mailFromMode: "DEFAULT" | "CUSTOM";
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
                dkimTokens: string[];
                feedbackForwardingDisabled: boolean;
                mailFromStatus?: string | null | undefined;
                dnsRecords?: unknown;
                mailFromDomain?: string | null | undefined;
            };
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId?: string | null | undefined;
                status?: "PENDING" | "VERIFIED" | "FAILED" | "DELETING" | undefined;
                search?: string | null | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                domains: {
                    id: string;
                    domainName: string;
                    status: "PENDING" | "VERIFIED" | "FAILED" | "DELETING";
                    dkimStatus: "NotStarted" | "Pending" | "Success" | "Failed" | "TemporaryFailure";
                    mailFromMode: "DEFAULT" | "CUSTOM";
                    userId: string;
                    teamId: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    verifiedAt: Date | null;
                    mailFromStatus?: string | null | undefined;
                }[];
                total: number;
            };
            meta: object;
        }>;
        remove: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
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
    quota: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        status: import("@trpc/server").TRPCQueryProcedure<{
            input: Record<string, never> | undefined;
            output: {
                windowStart: Date;
                windowEnd: Date;
                maxSendRate: number;
                max24HourSend: number;
                sentLast24HoursAtStart: number;
                reservedEmails: number;
                remainingEmails: number;
            };
            meta: object;
        }>;
    }>>;
    sesUsage: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        quotaLive: import("@trpc/server").TRPCQueryProcedure<{
            input: Record<string, never> | undefined;
            output: {
                maxSendRate: number;
                max24HourSend: number;
                sentLast24Hours: number;
                remaining24HourSend: number;
            };
            meta: object;
        }>;
        listDomainsLive: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
            } | undefined;
            output: {
                domains: {
                    id: string;
                    domainName: string;
                    status: string;
                    verificationStatus: import("@aws-sdk/client-ses").VerificationStatus;
                    dnsRecords: {
                        record: "MX" | "CNAME" | "TXT";
                        type: "MX" | "CNAME" | "TXT";
                        name: string;
                        value: string;
                    }[];
                    connected: boolean;
                    connectedDomainId: string | null;
                    connectedTeamId: string | null;
                }[];
            };
            meta: object;
        }>;
        verifyDomainLive: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainName: string;
            };
            output: {
                domainName: string;
                status: string;
                verificationStatus: import("@aws-sdk/client-ses").VerificationStatus;
                dnsRecords: {
                    record: "MX" | "CNAME" | "TXT";
                    type: "MX" | "CNAME" | "TXT";
                    name: string;
                    value: string;
                }[];
            };
            meta: object;
        }>;
        connectToNPanel: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainName: string;
                teamId?: string | null | undefined;
            };
            output: {
                id: string;
                domainName: string;
                alreadyConnected: boolean;
            };
            meta: object;
        }>;
        disconnectFromNPanel: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                domainName: string;
            };
            output: {
                ok: boolean;
            };
            meta: object;
        }>;
    }>>;
    sesIdentities: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                identityType?: "Domain" | "EmailAddress" | undefined;
                maxPages?: number | undefined;
            } | undefined;
            output: {
                identityType: "Domain" | "EmailAddress";
                identities: string[];
                count: number;
                truncated: boolean;
            };
            meta: object;
        }>;
    }>>;
}>>;
