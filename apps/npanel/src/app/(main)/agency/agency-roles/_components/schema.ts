import { z } from "zod";

// UI-layer enums and schemas – independent from API and DB.
// Keep string values in sync with API but do not import from it.

export const agencyMenuKeysUi = [
	"/agency/dashboard",

	"/agency/domains",
	"/agency/tlds",
	"/agency/domain-transfer",
	"/agency/domains-portfolio",

	"/agency/hosting",
	"/agency/wordpress",

	"/agency/social-media-marketing",
	"/agency/social-media-marketing/facebook",
	"/agency/social-media-marketing/linkedin",

	"/agency/ad-campaigns",
	"/agency/ad-campaigns/meta-ads",
	"/agency/ad-campaigns/google-ads",
	"/agency/ad-campaigns/linkedin-ads",

	"/agency/email-marketing",
	"/agency/email-marketing/campaigns",
	"/agency/email-marketing/domain-configuration",
	"/agency/email-marketing/audiences",
	"/agency/email-marketing/email-builder",

	"/agency/seo",
	"/agency/seo-reports",

	"/agency/creative-assets",

	"/agency/gen-ai/image-gen-studio",
	"/agency/gen-ai/image-generator",
	"/agency/gen-ai/background-remover",

	"/agency/nisc-services",
	"/agency/nisc-service-orders",

	"/agency/clients",
	"/agency/manage-teams",
	"/agency/manage-users",

	"/agency/billing",
	"/agency/transactions",
	"/agency/invoices",
	"/agency/subscriptions",
	"/agency/quotations",

	"/agency/kra-etims",
	"/agency/kra-etims/sales",
	"/agency/kra-etims/purchases",
	"/agency/kra-etims/stock",
	"/agency/kra-etims/products",
	"/agency/kra-etims/branches",
	"/agency/kra-etims/settings",

	"/agency/reports/sales",
	"/agency/reports/creative",
] as const;

export const agencyMenuKeyUiSchema = z.enum(agencyMenuKeysUi);
export type AgencyMenuKeyUi = z.infer<typeof agencyMenuKeyUiSchema>;

export const agencyRoleUiSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	isSystem: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type AgencyRoleUi = z.infer<typeof agencyRoleUiSchema>;

export const agencyPermissionUiSchema = z.object({
	id: z.string(),
	key: agencyMenuKeyUiSchema,
	description: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type AgencyPermissionUi = z.infer<typeof agencyPermissionUiSchema>;

export const agencyRoleWithPermissionsUiSchema = agencyRoleUiSchema.extend({
	permissionKeys: z.array(agencyMenuKeyUiSchema),
});

export type AgencyRoleWithPermissionsUi = z.infer<typeof agencyRoleWithPermissionsUiSchema>;

export const createRoleFormSchema = z.object({
	name: z.string().min(2, "Role name is required").max(80),
	description: z.string().max(400).optional(),
	permissionKeys: z.array(agencyMenuKeyUiSchema).default([]),
});

export type CreateRoleFormData = z.infer<typeof createRoleFormSchema>;

