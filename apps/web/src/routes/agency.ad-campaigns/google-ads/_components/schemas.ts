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
	hasRefreshToken: z.boolean().optional(),
	accessTokenExpiresAt: z.string().nullable().optional(),
	isExpired: z.boolean().optional(),
	scope: z.string().nullable().optional(),
	status: z.string().optional(),
	userId: z.string().optional(),
	connected: z.boolean(), // Main field to check connection status
});

export type StoredCredentials = z.infer<typeof storedCredentialsSchema>;

// Google Ads Account Schema (matches API response)
export const googleAdsAccountSchema = z.object({
	customerId: z.string(),
	resourceName: z.string().optional(),
	accountName: z.string().nullable().optional(),
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

