import { z } from "zod";

// ============================================================================
// INDEPENDENT FRONTEND SCHEMAS - Not importing from API
// ============================================================================

export const integrationStatusSchema = z.enum([
	"ACTIVE",
	"INACTIVE",
	"EXPIRED",
	"REVOKED",
	"PENDING",
]);

export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;

export const storedCredentialsSchema = z.object({
	integrationId: z.string(),
	hasAccessToken: z.boolean(),
	accessTokenExpiresAt: z.string().nullable(),
	isExpired: z.boolean(),
	scope: z.string().nullable(),
	status: z.string(),
	userId: z.string(),
	connected: z.boolean().optional(),
});

export type StoredCredentials = z.infer<typeof storedCredentialsSchema>;

export const instagramProfileSchema = z.object({
	id: z.string(),
	user_id: z.string().optional(),
	username: z.string().optional(),
	account_type: z.string().optional(),
	media_count: z.number().optional(),
	profile_picture_url: z.string().optional(),
	name: z.string().optional(),
	biography: z.string().optional(),
	followers_count: z.number().optional(),
	follows_count: z.number().optional(),
});

export type InstagramProfile = z.infer<typeof instagramProfileSchema>;
