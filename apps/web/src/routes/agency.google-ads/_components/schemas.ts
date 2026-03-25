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
	integrationId: z.string(),
	hasAccessToken: z.boolean(),
	hasRefreshToken: z.boolean().optional(),
	accessTokenExpiresAt: z.string().nullable(),
	isExpired: z.boolean(),
	scope: z.string().nullable(),
	status: z.string(),
	userId: z.string(),
});

export type StoredCredentials = z.infer<typeof storedCredentialsSchema>;

// Google Ads Account Schema
export const googleAdsAccountSchema = z.object({
	customerId: z.string(),
	resourceName: z.string().optional(),
	accountName: z.string().nullable(),
	currencyCode: z.string().nullable().optional(),
	timeZone: z.string().nullable().optional(),
	status: z.enum(["ACTIVE", "PAUSED", "REMOVED"]).optional(),
});

export type GoogleAdsAccount = z.infer<typeof googleAdsAccountSchema>;

// Accounts List Response Schema
export const accountsListResponseSchema = z.object({
	success: z.boolean(),
	data: z.array(googleAdsAccountSchema),
	meta: z.object({
		retrieved_at: z.string(),
		total_accounts: z.number(),
	}),
});

export type AccountsListResponse = z.infer<typeof accountsListResponseSchema>;


