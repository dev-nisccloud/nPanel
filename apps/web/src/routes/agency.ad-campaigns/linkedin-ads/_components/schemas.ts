import { z } from "zod";

// ============================================================================
// INDEPENDENT FRONTEND SCHEMAS - Not importing from API
// ============================================================================

// Integration Status Schema
export const integrationStatusSchema = z.enum([
	"ACTIVE",
	"INACTIVE",
	"EXPIRED",
	"REVOKED",
	"PENDING",
]);

export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;

// Stored Credentials Schema
export const storedCredentialsSchema = z.object({
	integrationId: z.string().optional(),
	hasAccessToken: z.boolean().optional(),
	accessTokenExpiresAt: z.string().nullable().optional(),
	isExpired: z.boolean().optional(),
	scope: z.string().nullable().optional(),
	status: z.string().optional(),
	userId: z.string().optional(),
	connected: z.boolean(), // Main field to check connection status
	hasAdsScopes: z.boolean().optional(), // Indicates if Marketing API scopes are present
});

export type StoredCredentials = z.infer<typeof storedCredentialsSchema>;

// LinkedIn Ads Account Schema (matches API response)
export const linkedInAdsAccountSchema = z.object({
	id: z.string(),
	name: z.string().nullable().optional(),
	currency: z.string().nullable().optional(),
	timezone: z.string().nullable().optional(),
	status: z.string().nullable().optional(),
	servingStatuses: z.array(z.string()).optional(),
	reference: z.string().nullable().optional(),
	type: z.string().nullable().optional(),
});

export type LinkedInAdsAccount = z.infer<typeof linkedInAdsAccountSchema>;

// Accounts List Response Schema
export const accountsListResponseSchema = z.object({
	success: z.boolean(),
	data: z.array(linkedInAdsAccountSchema),
	meta: z.object({
		retrieved_at: z.string(),
		total_accounts: z.number(),
	}),
});

export type AccountsListResponse = z.infer<typeof accountsListResponseSchema>;

// Campaign Group Schema (Campaigns in UI)
export const linkedInAdsCampaignGroupSchema = z.object({
	id: z.string(),
	name: z.string().nullable().optional(),
	status: z.string().nullable().optional(),
	account: z.string().nullable().optional(),
	runSchedule: z.any().nullable().optional(),
	created: z.number().nullable().optional(),
	lastModified: z.number().nullable().optional(),
	insights: z
		.object({
			impressions: z.number().nullable().optional(),
			clicks: z.number().nullable().optional(),
			spend: z.number().nullable().optional(),
			cpc: z.string().nullable().optional(),
			ctr: z.string().nullable().optional(),
			externalWebsiteConversions: z.number().nullable().optional(),
			oneClickLeads: z.number().nullable().optional(),
			videoViews: z.number().nullable().optional(),
			videoCompletions: z.number().nullable().optional(),
		})
		.nullable()
		.optional(),
});

export type LinkedInAdsCampaignGroup = z.infer<typeof linkedInAdsCampaignGroupSchema>;

// Campaign Schema (Campaigns in UI)
export const linkedInAdsCampaignSchema = z.object({
	id: z.string(),
	name: z.string().nullable().optional(),
	status: z.string().nullable().optional(),
	campaignGroup: z.string().nullable().optional(),
	account: z.string().nullable().optional(),
	runSchedule: z.any().nullable().optional(),
	costType: z.string().nullable().optional(),
	unitCost: z.string().nullable().optional(),
	dailyBudget: z.string().nullable().optional(),
	totalBudget: z.string().nullable().optional(),
	targetingCriteria: z.any().nullable().optional(),
	created: z.number().nullable().optional(),
	lastModified: z.number().nullable().optional(),
	insights: z
		.object({
			impressions: z.number().nullable().optional(),
			clicks: z.number().nullable().optional(),
			spend: z.number().nullable().optional(),
			cpc: z.string().nullable().optional(),
			ctr: z.string().nullable().optional(),
			externalWebsiteConversions: z.number().nullable().optional(),
			oneClickLeads: z.number().nullable().optional(),
			videoViews: z.number().nullable().optional(),
			videoCompletions: z.number().nullable().optional(),
		})
		.nullable()
		.optional(),
});

export type LinkedInAdsCampaign = z.infer<typeof linkedInAdsCampaignSchema>;

// Creative Schema (Ads in UI)
export const linkedInAdsCreativeSchema = z.object({
	id: z.string(),
	name: z.string().nullable().optional(),
	status: z.string().nullable().optional(),
	campaign: z.string().nullable().optional(),
	type: z.string().nullable().optional(),
	variables: z.any().nullable().optional(),
	created: z.number().nullable().optional(),
	lastModified: z.number().nullable().optional(),
	changeAuditStamps: z.any().nullable().optional(),
	insights: z
		.object({
			impressions: z.number().nullable().optional(),
			clicks: z.number().nullable().optional(),
			spend: z.number().nullable().optional(),
			cpc: z.string().nullable().optional(),
			ctr: z.string().nullable().optional(),
			externalWebsiteConversions: z.number().nullable().optional(),
			oneClickLeads: z.number().nullable().optional(),
			videoViews: z.number().nullable().optional(),
			videoCompletions: z.number().nullable().optional(),
		})
		.nullable()
		.optional(),
});

export type LinkedInAdsCreative = z.infer<typeof linkedInAdsCreativeSchema>;

