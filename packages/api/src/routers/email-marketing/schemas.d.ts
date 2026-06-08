import { z } from "zod";
/**
 * Email Marketing API Schemas
 * Independent from DB/Prisma. Used for input validation and output shaping.
 * Do not import enums or types from the db layer.
 */
export declare const emailDomainStatusSchema: z.ZodEnum<{
    PENDING: "PENDING";
    EXPIRED: "EXPIRED";
    FAILED: "FAILED";
    VERIFIED: "VERIFIED";
}>;
export type EmailDomainStatus = z.infer<typeof emailDomainStatusSchema>;
export declare const emailCampaignStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    SCHEDULED: "SCHEDULED";
    COMPLETED: "COMPLETED";
    FAILED: "FAILED";
    CANCELLED: "CANCELLED";
}>;
export type EmailCampaignStatus = z.infer<typeof emailCampaignStatusSchema>;
export declare const audienceContactStatusSchema: z.ZodEnum<{
    SUBSCRIBED: "SUBSCRIBED";
    UNSUBSCRIBED: "UNSUBSCRIBED";
}>;
export type AudienceContactStatus = z.infer<typeof audienceContactStatusSchema>;
export declare const emailEventTypeSchema: z.ZodEnum<{
    email_bounced: "email_bounced";
    email_clicked: "email_clicked";
    email_complained: "email_complained";
    email_delivered: "email_delivered";
    email_delivery_delayed: "email_delivery_delayed";
    email_failed: "email_failed";
    email_opened: "email_opened";
    email_received: "email_received";
    email_scheduled: "email_scheduled";
    email_sent: "email_sent";
    email_suppressed: "email_suppressed";
}>;
export type EmailEventType = z.infer<typeof emailEventTypeSchema>;
/** Resend webhook type string (e.g. "email.bounced") -> API enum */
export declare const RESEND_EVENT_TYPE_TO_ENUM: Record<string, z.infer<typeof emailEventTypeSchema>>;
export declare const emailDomainCreateInputSchema: z.ZodObject<{
    domainName: z.ZodString;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type EmailDomainCreateInput = z.infer<typeof emailDomainCreateInputSchema>;
export declare const emailDomainUpdateInputSchema: z.ZodObject<{
    id: z.ZodString;
    domainName: z.ZodOptional<z.ZodString>;
    verificationStatus: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    verificationData: z.ZodNullable<z.ZodOptional<z.ZodUnknown>>;
    dnsRecords: z.ZodNullable<z.ZodOptional<z.ZodUnknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        EXPIRED: "EXPIRED";
        FAILED: "FAILED";
        VERIFIED: "VERIFIED";
    }>>;
}, z.core.$strip>;
export type EmailDomainUpdateInput = z.infer<typeof emailDomainUpdateInputSchema>;
export declare const emailDomainListFiltersSchema: z.ZodObject<{
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        EXPIRED: "EXPIRED";
        FAILED: "FAILED";
        VERIFIED: "VERIFIED";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type EmailDomainListFilters = z.infer<typeof emailDomainListFiltersSchema>;
export declare const emailDomainSummarySchema: z.ZodObject<{
    id: z.ZodString;
    domainName: z.ZodString;
    status: z.ZodEnum<{
        PENDING: "PENDING";
        EXPIRED: "EXPIRED";
        FAILED: "FAILED";
        VERIFIED: "VERIFIED";
    }>;
    resendDomainId: z.ZodNullable<z.ZodString>;
    userId: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    verifiedAt: z.ZodNullable<z.ZodDate>;
}, z.core.$strip>;
export type EmailDomainSummary = z.infer<typeof emailDomainSummarySchema>;
export declare const emailDomainDetailSchema: z.ZodObject<{
    id: z.ZodString;
    domainName: z.ZodString;
    status: z.ZodEnum<{
        PENDING: "PENDING";
        EXPIRED: "EXPIRED";
        FAILED: "FAILED";
        VERIFIED: "VERIFIED";
    }>;
    resendDomainId: z.ZodNullable<z.ZodString>;
    userId: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    verifiedAt: z.ZodNullable<z.ZodDate>;
    verificationStatus: z.ZodNullable<z.ZodString>;
    verificationData: z.ZodNullable<z.ZodUnknown>;
    dnsRecords: z.ZodNullable<z.ZodUnknown>;
}, z.core.$strip>;
export type EmailDomainDetail = z.infer<typeof emailDomainDetailSchema>;
export declare const emailDomainListResponseSchema: z.ZodObject<{
    domains: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        domainName: z.ZodString;
        status: z.ZodEnum<{
            PENDING: "PENDING";
            EXPIRED: "EXPIRED";
            FAILED: "FAILED";
            VERIFIED: "VERIFIED";
        }>;
        resendDomainId: z.ZodNullable<z.ZodString>;
        userId: z.ZodString;
        teamId: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        verifiedAt: z.ZodNullable<z.ZodDate>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export type EmailDomainListResponse = z.infer<typeof emailDomainListResponseSchema>;
export declare const campaignCreateInputSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    subject: z.ZodString;
    fromEmail: z.ZodString;
    fromName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    recipientEmails: z.ZodArray<z.ZodString>;
    emailDomainId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    htmlContent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    textContent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CampaignCreateInput = z.infer<typeof campaignCreateInputSchema>;
export declare const campaignUpdateInputSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    subject: z.ZodOptional<z.ZodString>;
    fromEmail: z.ZodOptional<z.ZodString>;
    fromName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    recipientEmails: z.ZodOptional<z.ZodArray<z.ZodString>>;
    emailDomainId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    htmlContent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    textContent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
}, z.core.$strip>;
export type CampaignUpdateInput = z.infer<typeof campaignUpdateInputSchema>;
export declare const campaignListFiltersSchema: z.ZodObject<{
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
        CANCELLED: "CANCELLED";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type CampaignListFilters = z.infer<typeof campaignListFiltersSchema>;
export declare const campaignRecipientSummarySchema: z.ZodObject<{
    id: z.ZodString;
    campaignId: z.ZodString;
    toEmail: z.ZodString;
    resendId: z.ZodNullable<z.ZodString>;
    resendMessageId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type CampaignRecipientSummary = z.infer<typeof campaignRecipientSummarySchema>;
export declare const campaignSummarySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    subject: z.ZodString;
    fromEmail: z.ZodString;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
        CANCELLED: "CANCELLED";
    }>;
    recipientCount: z.ZodNumber;
    userId: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    scheduledAt: z.ZodNullable<z.ZodDate>;
    sentAt: z.ZodNullable<z.ZodDate>;
}, z.core.$strip>;
export type CampaignSummary = z.infer<typeof campaignSummarySchema>;
export declare const campaignDetailSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    subject: z.ZodString;
    fromEmail: z.ZodString;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
        CANCELLED: "CANCELLED";
    }>;
    recipientCount: z.ZodNumber;
    userId: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    scheduledAt: z.ZodNullable<z.ZodDate>;
    sentAt: z.ZodNullable<z.ZodDate>;
    description: z.ZodNullable<z.ZodString>;
    fromName: z.ZodNullable<z.ZodString>;
    emailDomainId: z.ZodNullable<z.ZodString>;
    htmlContent: z.ZodNullable<z.ZodString>;
    textContent: z.ZodNullable<z.ZodString>;
    recipients: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        campaignId: z.ZodString;
        toEmail: z.ZodString;
        resendId: z.ZodNullable<z.ZodString>;
        resendMessageId: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CampaignDetail = z.infer<typeof campaignDetailSchema>;
export declare const campaignListResponseSchema: z.ZodObject<{
    campaigns: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        subject: z.ZodString;
        fromEmail: z.ZodString;
        status: z.ZodEnum<{
            DRAFT: "DRAFT";
            SCHEDULED: "SCHEDULED";
            COMPLETED: "COMPLETED";
            FAILED: "FAILED";
            CANCELLED: "CANCELLED";
        }>;
        recipientCount: z.ZodNumber;
        userId: z.ZodString;
        teamId: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        scheduledAt: z.ZodNullable<z.ZodDate>;
        sentAt: z.ZodNullable<z.ZodDate>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export type CampaignListResponse = z.infer<typeof campaignListResponseSchema>;
export declare const campaignSendInputSchema: z.ZodObject<{
    id: z.ZodString;
    immediate: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type CampaignSendInput = z.infer<typeof campaignSendInputSchema>;
export declare const campaignCancelInputSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type CampaignCancelInput = z.infer<typeof campaignCancelInputSchema>;
export declare const campaignRecipientAddInputSchema: z.ZodObject<{
    campaignId: z.ZodString;
    emails: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type CampaignRecipientAddInput = z.infer<typeof campaignRecipientAddInputSchema>;
export declare const campaignRecipientListFiltersSchema: z.ZodObject<{
    campaignId: z.ZodString;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type CampaignRecipientListFilters = z.infer<typeof campaignRecipientListFiltersSchema>;
export declare const campaignRecipientListResponseSchema: z.ZodObject<{
    recipients: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        campaignId: z.ZodString;
        toEmail: z.ZodString;
        resendId: z.ZodNullable<z.ZodString>;
        resendMessageId: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export type CampaignRecipientListResponse = z.infer<typeof campaignRecipientListResponseSchema>;
export declare const audienceCreateInputSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type AudienceCreateInput = z.infer<typeof audienceCreateInputSchema>;
export declare const audienceUpdateInputSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type AudienceUpdateInput = z.infer<typeof audienceUpdateInputSchema>;
export declare const audienceListFiltersSchema: z.ZodObject<{
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type AudienceListFilters = z.infer<typeof audienceListFiltersSchema>;
export declare const audienceSummarySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    userId: z.ZodNullable<z.ZodString>;
    teamId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    contactsCount: z.ZodNumber;
}, z.core.$strip>;
export type AudienceSummary = z.infer<typeof audienceSummarySchema>;
export declare const audienceDetailSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    userId: z.ZodNullable<z.ZodString>;
    teamId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    contactsCount: z.ZodNumber;
    subscribedCount: z.ZodNumber;
    unsubscribedCount: z.ZodNumber;
}, z.core.$strip>;
export type AudienceDetail = z.infer<typeof audienceDetailSchema>;
export declare const audienceListResponseSchema: z.ZodObject<{
    audiences: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        userId: z.ZodNullable<z.ZodString>;
        teamId: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        contactsCount: z.ZodNumber;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export type AudienceListResponse = z.infer<typeof audienceListResponseSchema>;
export declare const audienceContactCreateInputSchema: z.ZodObject<{
    audienceId: z.ZodString;
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phoneNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    emailAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    company: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        SUBSCRIBED: "SUBSCRIBED";
        UNSUBSCRIBED: "UNSUBSCRIBED";
    }>>;
}, z.core.$strip>;
export type AudienceContactCreateInput = z.infer<typeof audienceContactCreateInputSchema>;
export declare const audienceContactUpdateInputSchema: z.ZodObject<{
    id: z.ZodString;
    audienceId: z.ZodString;
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phoneNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    emailAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    company: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
        SUBSCRIBED: "SUBSCRIBED";
        UNSUBSCRIBED: "UNSUBSCRIBED";
    }>>>;
}, z.core.$strip>;
export type AudienceContactUpdateInput = z.infer<typeof audienceContactUpdateInputSchema>;
export declare const audienceContactBulkCreateItemSchema: z.ZodObject<{
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phoneNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    emailAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    company: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
        SUBSCRIBED: "SUBSCRIBED";
        UNSUBSCRIBED: "UNSUBSCRIBED";
    }>>>;
}, z.core.$strip>;
export type AudienceContactBulkCreateItem = z.infer<typeof audienceContactBulkCreateItemSchema>;
export declare const audienceContactBulkCreateInputSchema: z.ZodObject<{
    audienceId: z.ZodString;
    contacts: z.ZodArray<z.ZodObject<{
        name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        phoneNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        emailAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        company: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
            SUBSCRIBED: "SUBSCRIBED";
            UNSUBSCRIBED: "UNSUBSCRIBED";
        }>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type AudienceContactBulkCreateInput = z.infer<typeof audienceContactBulkCreateInputSchema>;
export declare const audienceContactSummarySchema: z.ZodObject<{
    id: z.ZodString;
    audienceId: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    phoneNumber: z.ZodNullable<z.ZodString>;
    emailAddress: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    company: z.ZodNullable<z.ZodString>;
    status: z.ZodNullable<z.ZodEnum<{
        SUBSCRIBED: "SUBSCRIBED";
        UNSUBSCRIBED: "UNSUBSCRIBED";
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type AudienceContactSummary = z.infer<typeof audienceContactSummarySchema>;
export declare const audienceContactListFiltersSchema: z.ZodObject<{
    audienceId: z.ZodString;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        SUBSCRIBED: "SUBSCRIBED";
        UNSUBSCRIBED: "UNSUBSCRIBED";
    }>>;
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type AudienceContactListFilters = z.infer<typeof audienceContactListFiltersSchema>;
export declare const audienceContactListResponseSchema: z.ZodObject<{
    contacts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        audienceId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
        phoneNumber: z.ZodNullable<z.ZodString>;
        emailAddress: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        company: z.ZodNullable<z.ZodString>;
        status: z.ZodNullable<z.ZodEnum<{
            SUBSCRIBED: "SUBSCRIBED";
            UNSUBSCRIBED: "UNSUBSCRIBED";
        }>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export type AudienceContactListResponse = z.infer<typeof audienceContactListResponseSchema>;
export declare const emailEventListFiltersSchema: z.ZodObject<{
    campaignRecipientId: z.ZodOptional<z.ZodString>;
    campaignId: z.ZodOptional<z.ZodString>;
    recipientEmail: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        email_bounced: "email_bounced";
        email_clicked: "email_clicked";
        email_complained: "email_complained";
        email_delivered: "email_delivered";
        email_delivery_delayed: "email_delivery_delayed";
        email_failed: "email_failed";
        email_opened: "email_opened";
        email_received: "email_received";
        email_scheduled: "email_scheduled";
        email_sent: "email_sent";
        email_suppressed: "email_suppressed";
    }>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type EmailEventListFilters = z.infer<typeof emailEventListFiltersSchema>;
export declare const emailEventSummarySchema: z.ZodObject<{
    id: z.ZodString;
    campaignRecipientId: z.ZodString;
    type: z.ZodEnum<{
        email_bounced: "email_bounced";
        email_clicked: "email_clicked";
        email_complained: "email_complained";
        email_delivered: "email_delivered";
        email_delivery_delayed: "email_delivery_delayed";
        email_failed: "email_failed";
        email_opened: "email_opened";
        email_received: "email_received";
        email_scheduled: "email_scheduled";
        email_sent: "email_sent";
        email_suppressed: "email_suppressed";
    }>;
    eventCreatedAt: z.ZodDate;
    resendEmailId: z.ZodNullable<z.ZodString>;
    data: z.ZodUnknown;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type EmailEventSummary = z.infer<typeof emailEventSummarySchema>;
/** Event in list response; may include recipientEmail when listing by campaignId */
export declare const emailEventInListSchema: z.ZodObject<{
    id: z.ZodString;
    campaignRecipientId: z.ZodString;
    type: z.ZodEnum<{
        email_bounced: "email_bounced";
        email_clicked: "email_clicked";
        email_complained: "email_complained";
        email_delivered: "email_delivered";
        email_delivery_delayed: "email_delivery_delayed";
        email_failed: "email_failed";
        email_opened: "email_opened";
        email_received: "email_received";
        email_scheduled: "email_scheduled";
        email_sent: "email_sent";
        email_suppressed: "email_suppressed";
    }>;
    eventCreatedAt: z.ZodDate;
    resendEmailId: z.ZodNullable<z.ZodString>;
    data: z.ZodUnknown;
    createdAt: z.ZodDate;
    recipientEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    link: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type EmailEventInList = z.infer<typeof emailEventInListSchema>;
export declare const emailEventDetailSchema: z.ZodObject<{
    id: z.ZodString;
    campaignRecipientId: z.ZodString;
    type: z.ZodEnum<{
        email_bounced: "email_bounced";
        email_clicked: "email_clicked";
        email_complained: "email_complained";
        email_delivered: "email_delivered";
        email_delivery_delayed: "email_delivery_delayed";
        email_failed: "email_failed";
        email_opened: "email_opened";
        email_received: "email_received";
        email_scheduled: "email_scheduled";
        email_sent: "email_sent";
        email_suppressed: "email_suppressed";
    }>;
    eventCreatedAt: z.ZodDate;
    resendEmailId: z.ZodNullable<z.ZodString>;
    data: z.ZodUnknown;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type EmailEventDetail = z.infer<typeof emailEventDetailSchema>;
export declare const emailEventListResponseSchema: z.ZodObject<{
    events: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        campaignRecipientId: z.ZodString;
        type: z.ZodEnum<{
            email_bounced: "email_bounced";
            email_clicked: "email_clicked";
            email_complained: "email_complained";
            email_delivered: "email_delivered";
            email_delivery_delayed: "email_delivery_delayed";
            email_failed: "email_failed";
            email_opened: "email_opened";
            email_received: "email_received";
            email_scheduled: "email_scheduled";
            email_sent: "email_sent";
            email_suppressed: "email_suppressed";
        }>;
        eventCreatedAt: z.ZodDate;
        resendEmailId: z.ZodNullable<z.ZodString>;
        data: z.ZodUnknown;
        createdAt: z.ZodDate;
        recipientEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        link: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export type EmailEventListResponse = z.infer<typeof emailEventListResponseSchema>;
/** Top clicked links: URL + click count */
export declare const topClickedLinksInputSchema: z.ZodObject<{
    campaignId: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type TopClickedLinksInput = z.infer<typeof topClickedLinksInputSchema>;
export declare const topClickedLinkItemSchema: z.ZodObject<{
    url: z.ZodString;
    clicks: z.ZodNumber;
}, z.core.$strip>;
export type TopClickedLinkItem = z.infer<typeof topClickedLinkItemSchema>;
export declare const topClickedLinksResponseSchema: z.ZodArray<z.ZodObject<{
    url: z.ZodString;
    clicks: z.ZodNumber;
}, z.core.$strip>>;
export type TopClickedLinksResponse = z.infer<typeof topClickedLinksResponseSchema>;
export declare const campaignEventSummaryInputSchema: z.ZodObject<{
    campaignId: z.ZodString;
}, z.core.$strip>;
export type CampaignEventSummaryInput = z.infer<typeof campaignEventSummaryInputSchema>;
export declare const campaignEventSummarySchema: z.ZodObject<{
    delivered: z.ZodNumber;
    bounced: z.ZodNumber;
    suppressed: z.ZodNumber;
    opened: z.ZodNumber;
    openedTotal: z.ZodNumber;
    clicked: z.ZodNumber;
    clickedTotal: z.ZodNumber;
    complained: z.ZodNumber;
    unsubscribed: z.ZodNumber;
    totalRecipients: z.ZodNumber;
}, z.core.$strip>;
export type CampaignEventSummary = z.infer<typeof campaignEventSummarySchema>;
export declare const emailGlobalEventsInputSchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export type EmailGlobalEventsInput = z.infer<typeof emailGlobalEventsInputSchema>;
export declare const emailGlobalEventSchema: z.ZodObject<{
    type: z.ZodEnum<{
        email_bounced: "email_bounced";
        email_clicked: "email_clicked";
        email_complained: "email_complained";
        email_delivered: "email_delivered";
        email_delivery_delayed: "email_delivery_delayed";
        email_failed: "email_failed";
        email_opened: "email_opened";
        email_received: "email_received";
        email_scheduled: "email_scheduled";
        email_sent: "email_sent";
        email_suppressed: "email_suppressed";
    }>;
    eventCreatedAt: z.ZodDate;
}, z.core.$strip>;
export type EmailGlobalEvent = z.infer<typeof emailGlobalEventSchema>;
export declare const emailGlobalEventsResponseSchema: z.ZodArray<z.ZodObject<{
    type: z.ZodEnum<{
        email_bounced: "email_bounced";
        email_clicked: "email_clicked";
        email_complained: "email_complained";
        email_delivered: "email_delivered";
        email_delivery_delayed: "email_delivery_delayed";
        email_failed: "email_failed";
        email_opened: "email_opened";
        email_received: "email_received";
        email_scheduled: "email_scheduled";
        email_sent: "email_sent";
        email_suppressed: "email_suppressed";
    }>;
    eventCreatedAt: z.ZodDate;
}, z.core.$strip>>;
export type EmailGlobalEventsResponse = z.infer<typeof emailGlobalEventsResponseSchema>;
