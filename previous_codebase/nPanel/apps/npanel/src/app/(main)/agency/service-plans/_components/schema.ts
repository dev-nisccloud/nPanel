import { z } from "zod";

// Service Plan Type Enum - matches API schema
export const servicePlanTypeSchema = z.enum([
	"HOSTING",
	"SEO",
	"VIDEOGRAPHY",
	"VISUAL_CREATIVE",
	"SOCIAL_MEDIA_MARKETING",
	"PAY_PER_CLICK_ADVERTISING",
]);

// Hosting sub-type enum (for HOSTING plans)
export const hostingSubTypeSchema = z.enum([
	"WEB_HOSTING",
	"EMAIL_HOSTING",
	"RESELLER_HOSTING",
	"VPS_HOSTING",
	"DEDICATED_HOSTING",
]);

// Billing Cycle Enum
export const billingCycleSchema = z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]);

// Service Plan Schema - matches API output
export const servicePlanSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	planType: servicePlanTypeSchema,
	hostingSubType: hostingSubTypeSchema.nullable(),
	features: z.array(z.string()),
	highlights: z.array(z.string()),
	isPopular: z.boolean(),
	isRecommended: z.boolean(),
	niscPrice: z.string().nullable(),
	niscCurrency: z.string(),
	billingCycle: billingCycleSchema,
	setupFee: z.string().nullable(),
	isActive: z.boolean(),
	isDefault: z.boolean(),
	pleskServicePlanId: z.string().nullable(),
	pleskFilterId: z.string().nullable(),
	pleskIpAddress: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type ServicePlan = z.infer<typeof servicePlanSchema>;
export type ServicePlanType = z.infer<typeof servicePlanTypeSchema>;
export type HostingSubType = z.infer<typeof hostingSubTypeSchema>;
export type BillingCycle = z.infer<typeof billingCycleSchema>;

