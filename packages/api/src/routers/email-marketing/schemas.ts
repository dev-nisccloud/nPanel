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
export type EmailDomainStatus = z.infer<typeof emailDomainStatusSchema>;

export const emailCampaignStatusSchema = z.enum([
	"DRAFT",
	"SCHEDULED",
	"COMPLETED",
	"FAILED",
	"CANCELLED",
]);
export type EmailCampaignStatus = z.infer<typeof emailCampaignStatusSchema>;

export const audienceContactStatusSchema = z.enum([
	"SUBSCRIBED",
	"UNSUBSCRIBED",
]);
export type AudienceContactStatus = z.infer<typeof audienceContactStatusSchema>;

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
export type EmailEventType = z.infer<typeof emailEventTypeSchema>;

/** Resend webhook type string (e.g. "email.bounced") -> API enum */
export const RESEND_EVENT_TYPE_TO_ENUM: Record<string, z.infer<typeof emailEventTypeSchema>> = {
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
export type EmailDomainCreateInput = z.infer<
	typeof emailDomainCreateInputSchema
>;

export const emailDomainUpdateInputSchema = z.object({
	id: z.string().min(1),
	domainName: optStr(),
	verificationStatus: optStrNullable(),
	verificationData: optJson(),
	dnsRecords: optJson(),
	status: emailDomainStatusSchema.optional(),
});
export type EmailDomainUpdateInput = z.infer<
	typeof emailDomainUpdateInputSchema
>;

export const emailDomainListFiltersSchema = z.object({
	teamId: optStrNullable(),
	status: emailDomainStatusSchema.optional(),
	search: optStr(),
	limit: z.number().int().min(1).max(100).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type EmailDomainListFilters = z.infer<
	typeof emailDomainListFiltersSchema
>;

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
export type EmailDomainSummary = z.infer<typeof emailDomainSummarySchema>;

export const emailDomainDetailSchema = emailDomainSummarySchema.extend({
	verificationStatus: z.string().nullable(),
	verificationData: z.unknown().nullable(),
	dnsRecords: z.unknown().nullable(),
});
export type EmailDomainDetail = z.infer<typeof emailDomainDetailSchema>;

export const emailDomainListResponseSchema = z.object({
	domains: z.array(emailDomainSummarySchema),
	total: z.number().int().nonnegative(),
});
export type EmailDomainListResponse = z.infer<
	typeof emailDomainListResponseSchema
>;

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
export type CampaignCreateInput = z.infer<typeof campaignCreateInputSchema>;

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
export type CampaignUpdateInput = z.infer<typeof campaignUpdateInputSchema>;

export const campaignListFiltersSchema = z.object({
	teamId: optStrNullable(),
	status: emailCampaignStatusSchema.optional(),
	search: optStr(),
	limit: z.number().int().min(1).max(100).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type CampaignListFilters = z.infer<typeof campaignListFiltersSchema>;

export const campaignRecipientSummarySchema = z.object({
	id: z.string(),
	campaignId: z.string(),
	toEmail: z.string(),
	resendId: z.string().nullable(),
	resendMessageId: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type CampaignRecipientSummary = z.infer<
	typeof campaignRecipientSummarySchema
>;

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
export type CampaignSummary = z.infer<typeof campaignSummarySchema>;

export const campaignDetailSchema = campaignSummarySchema.extend({
	description: z.string().nullable(),
	fromName: z.string().nullable(),
	emailDomainId: z.string().nullable(),
	htmlContent: z.string().nullable(),
	textContent: z.string().nullable(),
	recipients: z.array(campaignRecipientSummarySchema),
});
export type CampaignDetail = z.infer<typeof campaignDetailSchema>;

export const campaignListResponseSchema = z.object({
	campaigns: z.array(campaignSummarySchema),
	total: z.number().int().nonnegative(),
});
export type CampaignListResponse = z.infer<
	typeof campaignListResponseSchema
>;

export const campaignSendInputSchema = z.object({
	id: z.string().min(1),
	/** If true, send now. If false/undefined and campaign.scheduledAt is in the future, schedule for that time. */
	immediate: z.boolean().optional(),
});
export type CampaignSendInput = z.infer<typeof campaignSendInputSchema>;

export const campaignCancelInputSchema = z.object({
	id: z.string().min(1),
});
export type CampaignCancelInput = z.infer<typeof campaignCancelInputSchema>;

// ============================================================================
// CAMPAIGN RECIPIENT SCHEMAS
// ============================================================================

export const campaignRecipientAddInputSchema = z.object({
	campaignId: z.string().min(1),
	emails: z.array(z.string().email("Invalid email address")).min(1),
});
export type CampaignRecipientAddInput = z.infer<
	typeof campaignRecipientAddInputSchema
>;

export const campaignRecipientListFiltersSchema = z.object({
	campaignId: z.string().min(1),
	search: optStr(),
	limit: z.number().int().min(1).max(500).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type CampaignRecipientListFilters = z.infer<
	typeof campaignRecipientListFiltersSchema
>;

export const campaignRecipientListResponseSchema = z.object({
	recipients: z.array(campaignRecipientSummarySchema),
	total: z.number().int().nonnegative(),
});
export type CampaignRecipientListResponse = z.infer<
	typeof campaignRecipientListResponseSchema
>;

// ============================================================================
// AUDIENCE & CONTACT SCHEMAS
// ============================================================================

export const audienceCreateInputSchema = z.object({
	name: z.string().min(1, "Audience name is required"),
	description: optStrNullable(),
	teamId: optStrNullable(),
});
export type AudienceCreateInput = z.infer<typeof audienceCreateInputSchema>;

export const audienceUpdateInputSchema = z.object({
	id: z.string().min(1),
	name: optStr(),
	description: optStrNullable(),
});
export type AudienceUpdateInput = z.infer<typeof audienceUpdateInputSchema>;

export const audienceListFiltersSchema = z.object({
	teamId: optStrNullable(),
	search: optStr(),
	limit: z.number().int().min(1).max(100).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type AudienceListFilters = z.infer<typeof audienceListFiltersSchema>;

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
export type AudienceSummary = z.infer<typeof audienceSummarySchema>;

export const audienceDetailSchema = audienceSummarySchema.extend({
	subscribedCount: z.number().int().nonnegative(),
	unsubscribedCount: z.number().int().nonnegative(),
});
export type AudienceDetail = z.infer<typeof audienceDetailSchema>;

export const audienceListResponseSchema = z.object({
	audiences: z.array(audienceSummarySchema),
	total: z.number().int().nonnegative(),
});
export type AudienceListResponse = z.infer<typeof audienceListResponseSchema>;

export const audienceContactCreateInputSchema = z.object({
	audienceId: z.string().min(1),
	name: optStrNullable(),
	phoneNumber: optStrNullable(),
	emailAddress: optStrNullable(),
	description: optStrNullable(),
	company: optStrNullable(),
	status: audienceContactStatusSchema.optional(),
});
export type AudienceContactCreateInput = z.infer<
	typeof audienceContactCreateInputSchema
>;

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
export type AudienceContactUpdateInput = z.infer<
	typeof audienceContactUpdateInputSchema
>;

export const audienceContactBulkCreateItemSchema = z.object({
	name: optStrNullable(),
	phoneNumber: optStrNullable(),
	emailAddress: optStrNullable(),
	description: optStrNullable(),
	company: optStrNullable(),
	status: audienceContactStatusSchema.optional().nullable(),
});
export type AudienceContactBulkCreateItem = z.infer<
	typeof audienceContactBulkCreateItemSchema
>;

export const audienceContactBulkCreateInputSchema = z.object({
	audienceId: z.string().min(1),
	contacts: z.array(audienceContactBulkCreateItemSchema).min(1),
});
export type AudienceContactBulkCreateInput = z.infer<
	typeof audienceContactBulkCreateInputSchema
>;

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
export type AudienceContactSummary = z.infer<
	typeof audienceContactSummarySchema
>;

export const audienceContactListFiltersSchema = z.object({
	audienceId: z.string().min(1),
	search: optStr(),
	status: audienceContactStatusSchema.optional(),
	from: optDate(),
	to: optDate(),
	limit: z.number().int().min(1).max(500).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type AudienceContactListFilters = z.infer<
	typeof audienceContactListFiltersSchema
>;

export const audienceContactListResponseSchema = z.object({
	contacts: z.array(audienceContactSummarySchema),
	total: z.number().int().nonnegative(),
});
export type AudienceContactListResponse = z.infer<
	typeof audienceContactListResponseSchema
>;

// ============================================================================
// EMAIL EVENT SCHEMAS (Resend webhook events)
// ============================================================================

export const emailEventListFiltersSchema = z.object({
	campaignRecipientId: optStr(),
	campaignId: optStr(),
	type: emailEventTypeSchema.optional(),
	limit: z.number().int().min(1).max(100).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type EmailEventListFilters = z.infer<
	typeof emailEventListFiltersSchema
>;

export const emailEventSummarySchema = z.object({
	id: z.string(),
	campaignRecipientId: z.string(),
	type: emailEventTypeSchema,
	eventCreatedAt: z.date(),
	resendEmailId: z.string().nullable(),
	data: z.unknown(),
	createdAt: z.date(),
});
export type EmailEventSummary = z.infer<typeof emailEventSummarySchema>;

/** Event in list response; may include recipientEmail when listing by campaignId */
export const emailEventInListSchema = emailEventSummarySchema.extend({
	recipientEmail: z.string().nullable().optional(),
});
export type EmailEventInList = z.infer<typeof emailEventInListSchema>;

export const emailEventDetailSchema = emailEventSummarySchema;
export type EmailEventDetail = z.infer<typeof emailEventDetailSchema>;

export const emailEventListResponseSchema = z.object({
	events: z.array(emailEventInListSchema),
	total: z.number().int().nonnegative(),
});
export type EmailEventListResponse = z.infer<
	typeof emailEventListResponseSchema
>;

/** Top clicked links: URL + click count */
export const topClickedLinksInputSchema = z.object({
	campaignId: z.string().min(1),
	limit: z.number().int().min(1).max(50).optional().default(10),
});
export type TopClickedLinksInput = z.infer<typeof topClickedLinksInputSchema>;

export const topClickedLinkItemSchema = z.object({
	url: z.string(),
	clicks: z.number().int().nonnegative(),
});
export type TopClickedLinkItem = z.infer<typeof topClickedLinkItemSchema>;

export const topClickedLinksResponseSchema = z.array(topClickedLinkItemSchema);
export type TopClickedLinksResponse = z.infer<
	typeof topClickedLinksResponseSchema
>;

// Campaign event summary (aggregated counts per type for metric cards)
export const campaignEventSummaryInputSchema = z.object({
	campaignId: z.string().min(1),
});
export type CampaignEventSummaryInput = z.infer<
	typeof campaignEventSummaryInputSchema
>;

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
export type CampaignEventSummary = z.infer<typeof campaignEventSummarySchema>;
// Global email events (for agency dashboard)
export const emailGlobalEventsInputSchema = z.object({
	from: optDate(),
	to: optDate(),
});
export type EmailGlobalEventsInput = z.infer<typeof emailGlobalEventsInputSchema>;

export const emailGlobalEventSchema = z.object({
	type: emailEventTypeSchema,
	eventCreatedAt: z.date(),
});
export type EmailGlobalEvent = z.infer<typeof emailGlobalEventSchema>;

export const emailGlobalEventsResponseSchema = z.array(emailGlobalEventSchema);
export type EmailGlobalEventsResponse = z.infer<
	typeof emailGlobalEventsResponseSchema
>;
