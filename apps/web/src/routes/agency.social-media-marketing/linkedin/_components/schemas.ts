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
	accessTokenExpiresAt: z.string().nullable(),
	isExpired: z.boolean(),
	scope: z.string().nullable(),
	status: z.string(),
	userId: z.string(),
});

export type StoredCredentials = z.infer<typeof storedCredentialsSchema>;

// LinkedIn Organization Schema
export const linkedInOrganizationSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
	username: z.string().optional(),
	picture: z.string().nullable(),
	access_token: z.string().optional(),
});

export type LinkedInOrganization = z.infer<typeof linkedInOrganizationSchema>;

// Organizations List Response Schema
export const organizationsListResponseSchema = z.object({
	success: z.boolean(),
	data: z.array(linkedInOrganizationSchema),
	meta: z.object({
		retrieved_at: z.string(),
		total_organizations: z.number(),
	}),
});

export type OrganizationsListResponse = z.infer<typeof organizationsListResponseSchema>;

// Page Content Item Schema (for LinkedIn posts)
export type PageContentItem = {
	id: string;
	message?: string | null;
	story?: string | null;
	created_time: string;
	permalink_url?: string | null;
	link?: string | null;
	full_picture?: string | null;
	likes?: {
		summary?: {
			total_count?: number;
		};
	} | null;
	comments?: {
		summary?: {
			total_count?: number;
		};
	} | null;
	shares?: {
		count?: number;
	} | null;
	attachments?: {
		data?: Array<{
			media?: any;
			subattachments?: {
				data?: Array<any>;
			};
		}>;
	} | null;
};




