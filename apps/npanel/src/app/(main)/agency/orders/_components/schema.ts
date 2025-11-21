import { z } from "zod";

// Frontend schema - independent from API and DB schemas
export const orderStatusSchema = z.enum([
	"PENDING",
	"PROCESSING",
	"COMPLETED",
	"FAILED",
	"CANCELLED",
	"REFUNDED",
	"PARTIAL",
]);

export const orderTypeSchema = z.enum([
	"DOMAIN_REGISTRATION",
	"DOMAIN_RENEWAL",
	"DOMAIN_TRANSFER",
	"HOSTING_SUBSCRIPTION",
	"HOSTING_RENEWAL",
	"HOSTING_UPGRADE",
	"EMAIL_HOSTING",
	"SSL_CERTIFICATE",
	"BACKUP_SERVICE",
	"CUSTOM_SERVICE",
]);

export const billingCycleSchema = z.enum(["MONTHLY", "YEARLY", "BIENNIALLY", "CUSTOM"]);

export const orderItemStatusSchema = z.enum(["PENDING", "PROVISIONING", "PROVISIONED", "FAILED", "SKIPPED"]);

export const orderItemSchema = z.object({
	id: z.string(),
	orderId: z.string(),
	niscServicePlanId: z.string(),
	billingCycle: billingCycleSchema,
	itemPrice: z.string(),
	itemSubtotal: z.string(),
	itemCurrency: z.string(),
	domainName: z.string().nullable(),
	description: z.string().nullable(),
	adminDescription: z.string().nullable(),
	notes: z.string().nullable(),
	status: orderItemStatusSchema,
	isProvisioned: z.boolean(),
	provisioningError: z.string().nullable(),
	hostingSubscriptionId: z.string().nullable(),
	metadata: z.any().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	// Relations
	niscServicePlan: z.object({
		id: z.string(),
		name: z.string(),
		planType: z.string(),
		hostingSubType: z.string().nullable(),
	}).optional(),
	hostingSubscription: z.object({
		id: z.string(),
		pleskName: z.string().nullable(),
		status: z.string(),
		primaryDomain: z.string().nullable(),
	}).optional(),
});

export const orderSchema = z.object({
	id: z.string(),
	orderNumber: z.string(),
	teamId: z.string(),
	createdBy: z.string().nullable(),
	type: orderTypeSchema,
	status: orderStatusSchema,
	description: z.string().nullable(),
	domainRegistrationId: z.string().nullable(),
	hostingSubscriptionId: z.string().nullable(),
	subtotal: z.string().nullable(),
	discount: z.string().nullable(),
	isTaxable: z.boolean().nullable(),
	taxPercentage: z.number().nullable(),
	taxAmount: z.string().nullable(),
	total: z.string().nullable(),
	currency: z.string(),
	promoCode: z.string().nullable(),
	promoId: z.string().nullable(),
	invoiceNumber: z.string().nullable(),
	processedBy: z.string().nullable(),
	processedAt: z.date().nullable(),
	completedAt: z.date().nullable(),
	notes: z.string().nullable(),
	metadata: z.any().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	// Relations
	team: z.object({
		id: z.string(),
		name: z.string(),
		slug: z.string(),
	}).optional(),
	hostingSubscription: z.object({
		id: z.string(),
		pleskName: z.string().nullable(),
		status: z.string(),
		primaryDomain: z.string().nullable(),
	}).optional(),
	orderItems: z.array(orderItemSchema).optional(),
});

export type Order = z.infer<typeof orderSchema>;
