import { z } from "zod";
/**
 * Email Marketing API Schemas
 * Independent from DB/Prisma. Used for input validation and output shaping.
 * Do not import enums or types from the db layer.
 */
// ============================================================================
// ENUMS - Independent from database enums
// ============================================================================
export const emailDomainStatusSchema = z.enum([
    "PENDING",
    "VERIFIED",
    "FAILED",
    "EXPIRED",
]);
export const emailCampaignStatusSchema = z.enum([
    "DRAFT",
    "SCHEDULED",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
]);
export const audienceContactStatusSchema = z.enum([
    "SUBSCRIBED",
    "UNSUBSCRIBED",
]);
export const emailEventTypeSchema = z.enum([
    "email_bounced",
    "email_clicked",
    "email_complained",
    "email_delivered",
    "email_delivery_delayed",
    "email_failed",
    "email_opened",
    "email_received",
    "email_scheduled",
    "email_sent",
    "email_suppressed",
]);
/** Resend webhook type string (e.g. "email.bounced") -> API enum */
export const RESEND_EVENT_TYPE_TO_ENUM = {
    "email.bounced": "email_bounced",
    "email.clicked": "email_clicked",
    "email.complained": "email_complained",
    "email.delivered": "email_delivered",
    "email.delivery_delayed": "email_delivery_delayed",
    "email.failed": "email_failed",
    "email.opened": "email_opened",
    "email.received": "email_received",
    "email.scheduled": "email_scheduled",
    "email.sent": "email_sent",
    "email.suppressed": "email_suppressed",
};
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const optStr = () => z.string().optional();
const optStrNullable = () => z.string().optional().nullable();
const optDate = () => z.coerce.date().optional();
const optDateNullable = () => z.coerce.date().optional().nullable();
const optJson = () => z.unknown().optional().nullable();
// ============================================================================
// EMAIL DOMAIN SCHEMAS
// ============================================================================
export const emailDomainCreateInputSchema = z.object({
    domainName: z.string().min(1, "Domain name is required"),
    teamId: optStrNullable(),
});
export const emailDomainUpdateInputSchema = z.object({
    id: z.string().min(1),
    domainName: optStr(),
    verificationStatus: optStrNullable(),
    verificationData: optJson(),
    dnsRecords: optJson(),
    status: emailDomainStatusSchema.optional(),
});
export const emailDomainListFiltersSchema = z.object({
    teamId: optStrNullable(),
    status: emailDomainStatusSchema.optional(),
    search: optStr(),
    limit: z.number().int().min(1).max(100).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
});
export const emailDomainSummarySchema = z.object({
    id: z.string(),
    domainName: z.string(),
    status: emailDomainStatusSchema,
    resendDomainId: z.string().nullable(),
    userId: z.string(),
    teamId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    verifiedAt: z.date().nullable(),
});
export const emailDomainDetailSchema = emailDomainSummarySchema.extend({
    verificationStatus: z.string().nullable(),
    verificationData: z.unknown().nullable(),
    dnsRecords: z.unknown().nullable(),
});
export const emailDomainListResponseSchema = z.object({
    domains: z.array(emailDomainSummarySchema),
    total: z.number().int().nonnegative(),
});
// ============================================================================
// EMAIL CAMPAIGN SCHEMAS
// ============================================================================
export const campaignCreateInputSchema = z.object({
    name: z.string().min(1, "Campaign name is required"),
    description: optStrNullable(),
    subject: z.string().min(1, "Subject is required"),
    fromEmail: z.string().email("Invalid from email address"),
    fromName: optStrNullable(),
    recipientEmails: z
        .array(z.string().email("Invalid email address"))
        .min(1, "At least one recipient email is required"),
    emailDomainId: optStrNullable(),
    htmlContent: optStrNullable(),
    textContent: optStrNullable(),
    scheduledAt: optDateNullable(),
    teamId: optStrNullable(),
});
export const campaignUpdateInputSchema = z.object({
    id: z.string().min(1),
    name: optStr(),
    description: optStrNullable(),
    subject: optStr(),
    fromEmail: z.string().email("Invalid from email address").optional(),
    fromName: optStrNullable(),
    recipientEmails: z
        .array(z.string().email("Invalid email address"))
        .optional(),
    emailDomainId: optStrNullable(),
    htmlContent: optStrNullable(),
    textContent: optStrNullable(),
    scheduledAt: optDateNullable(),
});
export const campaignListFiltersSchema = z.object({
    teamId: optStrNullable(),
    status: emailCampaignStatusSchema.optional(),
    search: optStr(),
    limit: z.number().int().min(1).max(100).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
});
export const campaignRecipientSummarySchema = z.object({
    id: z.string(),
    campaignId: z.string(),
    toEmail: z.string(),
    resendId: z.string().nullable(),
    resendMessageId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const campaignSummarySchema = z.object({
    id: z.string(),
    name: z.string(),
    subject: z.string(),
    fromEmail: z.string(),
    status: emailCampaignStatusSchema,
    recipientCount: z.number().int(),
    userId: z.string(),
    teamId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    scheduledAt: z.date().nullable(),
    sentAt: z.date().nullable(),
});
export const campaignDetailSchema = campaignSummarySchema.extend({
    description: z.string().nullable(),
    fromName: z.string().nullable(),
    emailDomainId: z.string().nullable(),
    htmlContent: z.string().nullable(),
    textContent: z.string().nullable(),
    recipients: z.array(campaignRecipientSummarySchema),
});
export const campaignListResponseSchema = z.object({
    campaigns: z.array(campaignSummarySchema),
    total: z.number().int().nonnegative(),
});
export const campaignSendInputSchema = z.object({
    id: z.string().min(1),
    /** If true, send now. If false/undefined and campaign.scheduledAt is in the future, schedule for that time. */
    immediate: z.boolean().optional(),
});
export const campaignCancelInputSchema = z.object({
    id: z.string().min(1),
});
// ============================================================================
// CAMPAIGN RECIPIENT SCHEMAS
// ============================================================================
export const campaignRecipientAddInputSchema = z.object({
    campaignId: z.string().min(1),
    emails: z.array(z.string().email("Invalid email address")).min(1),
});
export const campaignRecipientListFiltersSchema = z.object({
    campaignId: z.string().min(1),
    search: optStr(),
    limit: z.number().int().min(1).max(500).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
});
export const campaignRecipientListResponseSchema = z.object({
    recipients: z.array(campaignRecipientSummarySchema),
    total: z.number().int().nonnegative(),
});
// ============================================================================
// AUDIENCE & CONTACT SCHEMAS
// ============================================================================
export const audienceCreateInputSchema = z.object({
    name: z.string().min(1, "Audience name is required"),
    description: optStrNullable(),
    teamId: optStrNullable(),
});
export const audienceUpdateInputSchema = z.object({
    id: z.string().min(1),
    name: optStr(),
    description: optStrNullable(),
});
export const audienceListFiltersSchema = z.object({
    teamId: optStrNullable(),
    search: optStr(),
    limit: z.number().int().min(1).max(100).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
});
export const audienceSummarySchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    userId: z.string().nullable(),
    teamId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    contactsCount: z.number().int().nonnegative(),
});
export const audienceDetailSchema = audienceSummarySchema.extend({
    subscribedCount: z.number().int().nonnegative(),
    unsubscribedCount: z.number().int().nonnegative(),
});
export const audienceListResponseSchema = z.object({
    audiences: z.array(audienceSummarySchema),
    total: z.number().int().nonnegative(),
});
export const audienceContactCreateInputSchema = z.object({
    audienceId: z.string().min(1),
    name: optStrNullable(),
    phoneNumber: optStrNullable(),
    emailAddress: optStrNullable(),
    description: optStrNullable(),
    company: optStrNullable(),
    status: audienceContactStatusSchema.optional(),
});
export const audienceContactUpdateInputSchema = z.object({
    id: z.string().min(1),
    audienceId: z.string().min(1),
    name: optStrNullable(),
    phoneNumber: optStrNullable(),
    emailAddress: optStrNullable(),
    description: optStrNullable(),
    company: optStrNullable(),
    status: audienceContactStatusSchema.optional().nullable(),
});
export const audienceContactBulkCreateItemSchema = z.object({
    name: optStrNullable(),
    phoneNumber: optStrNullable(),
    emailAddress: optStrNullable(),
    description: optStrNullable(),
    company: optStrNullable(),
    status: audienceContactStatusSchema.optional().nullable(),
});
export const audienceContactBulkCreateInputSchema = z.object({
    audienceId: z.string().min(1),
    contacts: z.array(audienceContactBulkCreateItemSchema).min(1),
});
export const audienceContactSummarySchema = z.object({
    id: z.string(),
    audienceId: z.string(),
    name: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    emailAddress: z.string().nullable(),
    description: z.string().nullable(),
    company: z.string().nullable(),
    status: audienceContactStatusSchema.nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const audienceContactListFiltersSchema = z.object({
    audienceId: z.string().min(1),
    search: optStr(),
    status: audienceContactStatusSchema.optional(),
    from: optDate(),
    to: optDate(),
    limit: z.number().int().min(1).max(500).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
});
export const audienceContactListResponseSchema = z.object({
    contacts: z.array(audienceContactSummarySchema),
    total: z.number().int().nonnegative(),
});
// ============================================================================
// EMAIL EVENT SCHEMAS (Resend webhook events)
// ============================================================================
export const emailEventListFiltersSchema = z.object({
    campaignRecipientId: optStr(),
    campaignId: optStr(),
    /** Filter by recipient email (substring match). */
    recipientEmail: optStr(),
    type: emailEventTypeSchema.optional(),
    limit: z.number().int().min(1).max(100).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
});
export const emailEventSummarySchema = z.object({
    id: z.string(),
    campaignRecipientId: z.string(),
    type: emailEventTypeSchema,
    eventCreatedAt: z.date(),
    resendEmailId: z.string().nullable(),
    data: z.unknown(),
    createdAt: z.date(),
});
/** Event in list response; may include recipientEmail when listing by campaignId */
export const emailEventInListSchema = emailEventSummarySchema.extend({
    recipientEmail: z.string().nullable().optional(),
    /** Click event link when available (Nisc/SES stores it separately). */
    link: z.string().nullable().optional(),
});
export const emailEventDetailSchema = emailEventSummarySchema;
export const emailEventListResponseSchema = z.object({
    events: z.array(emailEventInListSchema),
    total: z.number().int().nonnegative(),
});
/** Top clicked links: URL + click count */
export const topClickedLinksInputSchema = z.object({
    campaignId: z.string().min(1),
    limit: z.number().int().min(1).max(50).optional().default(10),
});
export const topClickedLinkItemSchema = z.object({
    url: z.string(),
    clicks: z.number().int().nonnegative(),
});
export const topClickedLinksResponseSchema = z.array(topClickedLinkItemSchema);
// Campaign event summary (aggregated counts per type for metric cards)
export const campaignEventSummaryInputSchema = z.object({
    campaignId: z.string().min(1),
});
export const campaignEventSummarySchema = z.object({
    delivered: z.number().int().nonnegative(),
    bounced: z.number().int().nonnegative(),
    suppressed: z.number().int().nonnegative(),
    // Engagement: unique = distinct recipients (for rates ≤100%), total = event count (for aggregates)
    opened: z.number().int().nonnegative(),
    openedTotal: z.number().int().nonnegative(),
    clicked: z.number().int().nonnegative(),
    clickedTotal: z.number().int().nonnegative(),
    complained: z.number().int().nonnegative(),
    unsubscribed: z.number().int().nonnegative(),
    totalRecipients: z.number().int().nonnegative(),
});
// Global email events (for agency dashboard)
export const emailGlobalEventsInputSchema = z.object({
    from: optDate(),
    to: optDate(),
});
export const emailGlobalEventSchema = z.object({
    type: emailEventTypeSchema,
    eventCreatedAt: z.date(),
});
export const emailGlobalEventsResponseSchema = z.array(emailGlobalEventSchema);
