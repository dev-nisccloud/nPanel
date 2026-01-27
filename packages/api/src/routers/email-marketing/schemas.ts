import { z } from "zod";

/**
 * Email Marketing API Schemas
 * Independent from DB/Prisma. Used for input validation and output shaping.
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

export const contactStatusSchema = z.enum([
	"ACTIVE",
	"UNSUBSCRIBED",
	"BOUNCED",
	"COMPLAINED",
	"INACTIVE",
]);
export type ContactStatus = z.infer<typeof contactStatusSchema>;

export const campaignStatusSchema = z.enum([
	"DRAFT",
	"SCHEDULED",
	"SENDING",
	"SENT",
	"PAUSED",
	"CANCELLED",
	"FAILED",
]);
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

export const campaignTypeSchema = z.enum(["TRANSACTIONAL", "MARKETING"]);
export type CampaignType = z.infer<typeof campaignTypeSchema>;

export const emailLogStatusSchema = z.enum([
	"PENDING",
	"SENT",
	"DELIVERED",
	"BOUNCED",
	"FAILED",
	"OPENED",
	"CLICKED",
	"COMPLAINED",
	"UNSUBSCRIBED",
]);
export type EmailLogStatus = z.infer<typeof emailLogStatusSchema>;

export const emailLogTypeSchema = z.enum(["TRANSACTIONAL", "CAMPAIGN"]);
export type EmailLogType = z.infer<typeof emailLogTypeSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const optStr = () => z.string().optional();
const optStrNullable = () => z.string().optional().nullable();
const optDate = () => z.coerce.date().optional();
const optDateNullable = () => z.coerce.date().optional().nullable();
const optInt = () => z.number().int().optional();
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
// CONTACT SCHEMAS
// ============================================================================

export const contactCreateInputSchema = z.object({
	email: z.string().email("Invalid email address"),
	firstName: optStrNullable(),
	lastName: optStrNullable(),
	phone: optStrNullable(),
	company: optStrNullable(),
	jobTitle: optStrNullable(),
	address: optStrNullable(),
	city: optStrNullable(),
	state: optStrNullable(),
	country: optStrNullable(),
	postalCode: optStrNullable(),
	customFields: optJson(),
	teamId: optStrNullable(),
});
export type ContactCreateInput = z.infer<typeof contactCreateInputSchema>;

export const contactUpdateInputSchema = z.object({
	id: z.string().min(1),
	email: z.string().email("Invalid email address").optional(),
	firstName: optStrNullable(),
	lastName: optStrNullable(),
	phone: optStrNullable(),
	company: optStrNullable(),
	jobTitle: optStrNullable(),
	address: optStrNullable(),
	city: optStrNullable(),
	state: optStrNullable(),
	country: optStrNullable(),
	postalCode: optStrNullable(),
	status: contactStatusSchema.optional(),
	customFields: optJson(),
});
export type ContactUpdateInput = z.infer<typeof contactUpdateInputSchema>;

export const contactListFiltersSchema = z.object({
	teamId: optStrNullable(),
	status: contactStatusSchema.optional(),
	search: optStr(),
	limit: z.number().int().min(1).max(100).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type ContactListFilters = z.infer<typeof contactListFiltersSchema>;

export const contactSummarySchema = z.object({
	id: z.string(),
	email: z.string(),
	firstName: z.string().nullable(),
	lastName: z.string().nullable(),
	status: contactStatusSchema,
	userId: z.string(),
	teamId: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type ContactSummary = z.infer<typeof contactSummarySchema>;

export const contactDetailSchema = contactSummarySchema.extend({
	phone: z.string().nullable(),
	company: z.string().nullable(),
	jobTitle: z.string().nullable(),
	address: z.string().nullable(),
	city: z.string().nullable(),
	state: z.string().nullable(),
	country: z.string().nullable(),
	postalCode: z.string().nullable(),
	customFields: z.unknown().nullable(),
	lastContactedAt: z.date().nullable(),
	unsubscribedAt: z.date().nullable(),
});
export type ContactDetail = z.infer<typeof contactDetailSchema>;

export const contactListResponseSchema = z.object({
	contacts: z.array(contactSummarySchema),
	total: z.number().int().nonnegative(),
});
export type ContactListResponse = z.infer<typeof contactListResponseSchema>;

// ============================================================================
// EMAIL TEMPLATE SCHEMAS
// ============================================================================

export const emailTemplateCreateInputSchema = z.object({
	name: z.string().min(1, "Template name is required"),
	description: optStrNullable(),
	subject: optStrNullable(),
	htmlContent: optStrNullable(),
	textContent: optStrNullable(),
	variables: optJson(),
	teamId: optStrNullable(),
});
export type EmailTemplateCreateInput = z.infer<
	typeof emailTemplateCreateInputSchema
>;

export const emailTemplateUpdateInputSchema = z.object({
	id: z.string().min(1),
	name: optStr(),
	description: optStrNullable(),
	subject: optStrNullable(),
	htmlContent: optStrNullable(),
	textContent: optStrNullable(),
	variables: optJson(),
	isActive: z.boolean().optional(),
});
export type EmailTemplateUpdateInput = z.infer<
	typeof emailTemplateUpdateInputSchema
>;

export const emailTemplateListFiltersSchema = z.object({
	teamId: optStrNullable(),
	isActive: z.boolean().optional(),
	search: optStr(),
	limit: z.number().int().min(1).max(100).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type EmailTemplateListFilters = z.infer<
	typeof emailTemplateListFiltersSchema
>;

export const emailTemplateSummarySchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	subject: z.string().nullable(),
	isActive: z.boolean(),
	userId: z.string(),
	teamId: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type EmailTemplateSummary = z.infer<typeof emailTemplateSummarySchema>;

export const emailTemplateDetailSchema = emailTemplateSummarySchema.extend({
	htmlContent: z.string().nullable(),
	textContent: z.string().nullable(),
	variables: z.unknown().nullable(),
	metadata: z.unknown().nullable(),
});
export type EmailTemplateDetail = z.infer<typeof emailTemplateDetailSchema>;

export const emailTemplateListResponseSchema = z.object({
	templates: z.array(emailTemplateSummarySchema),
	total: z.number().int().nonnegative(),
});
export type EmailTemplateListResponse = z.infer<
	typeof emailTemplateListResponseSchema
>;

// ============================================================================
// CAMPAIGN SCHEMAS
// ============================================================================

export const campaignCreateInputSchema = z.object({
	name: z.string().min(1, "Campaign name is required"),
	description: optStrNullable(),
	subject: z.string().min(1, "Subject is required"),
	fromEmail: z.string().email("Invalid from email address"),
	fromName: optStrNullable(),
	type: campaignTypeSchema.optional(),
	recipientEmails: z.array(z.string().email("Invalid email address")).min(1, "At least one recipient email is required"),
	emailDomainId: optStrNullable(),
	emailTemplateId: optStrNullable(),
	htmlContent: optStrNullable(),
	textContent: optStrNullable(),
	scheduledAt: optDateNullable(),
	metadata: optJson(),
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
	type: campaignTypeSchema.optional(),
	status: campaignStatusSchema.optional(),
	recipientEmails: z.array(z.string().email("Invalid email address")).optional(),
	emailDomainId: optStrNullable(),
	emailTemplateId: optStrNullable(),
	htmlContent: optStrNullable(),
	textContent: optStrNullable(),
	scheduledAt: optDateNullable(),
	metadata: optJson(),
});
export type CampaignUpdateInput = z.infer<typeof campaignUpdateInputSchema>;

export const campaignListFiltersSchema = z.object({
	teamId: optStrNullable(),
	status: campaignStatusSchema.optional(),
	type: campaignTypeSchema.optional(),
	search: optStr(),
	limit: z.number().int().min(1).max(100).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type CampaignListFilters = z.infer<typeof campaignListFiltersSchema>;

export const campaignSummarySchema = z.object({
	id: z.string(),
	name: z.string(),
	subject: z.string(),
	fromEmail: z.string(),
	type: campaignTypeSchema,
	status: campaignStatusSchema,
	recipientEmails: z.array(z.string()),
	totalRecipients: z.number().int(),
	sentCount: z.number().int(),
	deliveredCount: z.number().int(),
	openedCount: z.number().int(),
	clickedCount: z.number().int(),
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
	emailTemplateId: z.string().nullable(),
	htmlContent: z.string().nullable(),
	textContent: z.string().nullable(),
	bouncedCount: z.number().int(),
	complainedCount: z.number().int(),
	unsubscribedCount: z.number().int(),
	metadata: z.unknown().nullable(),
});
export type CampaignDetail = z.infer<typeof campaignDetailSchema>;

export const campaignListResponseSchema = z.object({
	campaigns: z.array(campaignSummarySchema),
	total: z.number().int().nonnegative(),
});
export type CampaignListResponse = z.infer<typeof campaignListResponseSchema>;

// Campaign actions
export const campaignSendInputSchema = z.object({
	id: z.string().min(1),
});
export type CampaignSendInput = z.infer<typeof campaignSendInputSchema>;

export const campaignPauseInputSchema = z.object({
	id: z.string().min(1),
});
export type CampaignPauseInput = z.infer<typeof campaignPauseInputSchema>;

// ============================================================================
// EMAIL LOG SCHEMAS
// ============================================================================

export const emailLogListFiltersSchema = z.object({
	teamId: optStrNullable(),
	campaignId: optStr(),
	contactId: optStr(),
	emailDomainId: optStr(),
	status: emailLogStatusSchema.optional(),
	type: emailLogTypeSchema.optional(),
	toEmail: optStr(),
	search: optStr(),
	limit: z.number().int().min(1).max(100).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type EmailLogListFilters = z.infer<typeof emailLogListFiltersSchema>;

export const emailLogSummarySchema = z.object({
	id: z.string(),
	toEmail: z.string(),
	fromEmail: z.string(),
	subject: z.string(),
	type: emailLogTypeSchema,
	status: emailLogStatusSchema,
	resendEmailId: z.string().nullable(),
	campaignId: z.string().nullable(),
	contactId: z.string().nullable(),
	createdAt: z.date(),
	sentAt: z.date().nullable(),
	deliveredAt: z.date().nullable(),
});
export type EmailLogSummary = z.infer<typeof emailLogSummarySchema>;

export const emailLogDetailSchema = emailLogSummarySchema.extend({
	resendMessageId: z.string().nullable(),
	emailDomainId: z.string().nullable(),
	htmlContent: z.string().nullable(),
	textContent: z.string().nullable(),
	openedAt: z.date().nullable(),
	clickedAt: z.date().nullable(),
	bouncedAt: z.date().nullable(),
	complainedAt: z.date().nullable(),
	unsubscribedAt: z.date().nullable(),
	errorMessage: z.string().nullable(),
	metadata: z.unknown().nullable(),
	updatedAt: z.date(),
});
export type EmailLogDetail = z.infer<typeof emailLogDetailSchema>;

export const emailLogListResponseSchema = z.object({
	emailLogs: z.array(emailLogSummarySchema),
	total: z.number().int().nonnegative(),
});
export type EmailLogListResponse = z.infer<typeof emailLogListResponseSchema>;
