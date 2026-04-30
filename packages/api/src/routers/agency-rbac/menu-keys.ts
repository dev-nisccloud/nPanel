import { z } from "zod";

/**
 * Agency sidebar permission keys – API-layer enum.
 * Independent from Prisma/DB. DB stores them as plain strings.
 *
 * Convention: use the route path as the permission key.
 * This makes it trivial for the UI to filter sidebar items by URL.
 */
export const agencyMenuKeys = [
	"/agency/dashboard",

	"/agency/domains",
	"/agency/tlds",
	"/agency/domain-transfer",
	"/agency/domains-portfolio",

	"/agency/hosting",
	"/agency/dedicated-servers",
	"/agency/vps",
	"/agency/vds",
	"/agency/wordpress",

	"/agency/social-media-marketing",
	"/agency/social-media-marketing/facebook",
	"/agency/social-media-marketing/instagram",
	"/agency/social-media-marketing/linkedin",

	"/agency/ad-campaigns",
	"/agency/ad-campaigns/meta-ads",
	"/agency/ad-campaigns/instagram-ads",
	"/agency/ad-campaigns/google-ads",
	"/agency/ad-campaigns/linkedin-ads",

	"/agency/email-marketing",
	"/agency/email-marketing/campaigns",
	"/agency/email-marketing/domain-configuration",
	"/agency/email-marketing/audiences",
	"/agency/email-marketing/email-builder",

	"/agency/nisc-email-marketing",
	"/agency/nisc-email-marketing/campaigns",
	"/agency/nisc-email-marketing/audiences",
	"/agency/nisc-email-marketing/email-builder",
	"/agency/nisc-email-marketing/domain-configuration",
	"/agency/nisc-email-marketing/email-events",

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

	"/agency/kra-etims/sales",
	"/agency/kra-etims/purchases",
	"/agency/kra-etims/products",
	"/agency/kra-etims/customers",
	"/agency/kra-etims/branches",
	"/agency/kra-etims/settings",

	"/agency/digitax/sales",
	"/agency/digitax/purchases",
	"/agency/digitax/products",
	"/agency/digitax/customers",
	"/agency/digitax/branches",
	"/agency/digitax/notices",
	"/agency/digitax/verifications",

	"/agency/reports/sales",
	"/agency/reports/creative",

	"/agency/nisc-reports/revenue",
	"/agency/nisc-reports/invoices",
	"/agency/nisc-reports/quotations",
	"/agency/nisc-reports/subscriptions",
	"/agency/nisc-reports/clients",
	"/agency/nisc-reports/profitability",
	"/agency/nisc-reports/payments",
	"/agency/nisc-reports/tax",

	"/agency/cronjobs",
] as const;

export const agencyMenuKeySchema = z.enum(agencyMenuKeys);
export type AgencyMenuKey = z.infer<typeof agencyMenuKeySchema>;

