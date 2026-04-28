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
});

export type StoredCredentials = z.infer<typeof storedCredentialsSchema>;

// Instagram Ads Account Schema (matches API response)
export const instagramAdsAccountSchema = z.object({
	id: z.string(),
	accountId: z.string(),
	accountName: z.string().nullable().optional(),
	currency: z.string().nullable().optional(),
	timezone: z.string().nullable().optional(),
	status: z.enum([
		"ACTIVE",
		"DISABLED",
		"UNSETTLED",
		"PENDING_REVIEW",
		"IN_GRACE_PERIOD",
		"PENDING_CLOSURE",
		"CLOSED",
	]).optional(),
	spendLimit: z.string().nullable().optional(),
	amountSpent: z.string().nullable().optional(),
	balance: z.string().nullable().optional(),
});

export type InstagramAdsAccount = z.infer<typeof instagramAdsAccountSchema>;

// Accounts List Response Schema
export const accountsListResponseSchema = z.object({
	success: z.boolean(),
	data: z.array(instagramAdsAccountSchema),
	meta: z.object({
		retrieved_at: z.string(),
		total_accounts: z.number(),
	}),
});

export type AccountsListResponse = z.infer<typeof accountsListResponseSchema>;

// Instagram Ads Campaign Schema (matches API response)
export const instagramAdsCampaignSchema = z.object({
	id: z.string(),
	campaignId: z.string(),
	campaignName: z.string().nullable().optional(),
	objective: z.enum([
		"OUTCOME_TRAFFIC",
		"OUTCOME_ENGAGEMENT",
		"OUTCOME_LEADS",
		"OUTCOME_APP_PROMOTION",
		"OUTCOME_SALES",
		"OUTCOME_AWARENESS",
		"OUTCOME_VIDEO_VIEWS",
		"OUTCOME_NONE",
	]).optional(),
	status: z.enum(["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"]).optional(),
	dailyBudget: z.string().nullable().optional(),
	lifetimeBudget: z.string().nullable().optional(),
	startTime: z.string().nullable().optional(),
	stopTime: z.string().nullable().optional(),
});

export type InstagramAdsCampaign = z.infer<typeof instagramAdsCampaignSchema>;

// Campaigns List Response Schema
export const campaignsListResponseSchema = z.object({
	success: z.boolean(),
	data: z.array(instagramAdsCampaignSchema),
	meta: z.object({
		retrieved_at: z.string(),
		total_campaigns: z.number(),
	}),
});

export type CampaignsListResponse = z.infer<typeof campaignsListResponseSchema>;



