/**
 * Nisc Service Orders – independent API schemas and enums.
 * No Prisma or DB types. Used for router input/output and data transformation.
 * UI layer may define its own schemas with the same enum values for full independence.
 */

import { z } from "zod";

// ============================================================================
// Enums – independent from database schema
// ============================================================================

export const billingCycleSchema = z.enum([
	"MONTHLY",
	"YEARLY",
	"BIENNIALLY",
	"CUSTOM",
]);
export type BillingCycle = z.infer<typeof billingCycleSchema>;

export const niscOrderStatusSchema = z.enum([
	"PENDING",
	"PROCESSING",
	"COMPLETED",
	"FAILED",
	"PARTIAL",
]);
export type NiscOrderStatus = z.infer<typeof niscOrderStatusSchema>;

export const niscOrderItemStatusSchema = z.enum([
	"PENDING",
	"PROCESSING",
	"PROVISIONED",
	"FAILED",
	"SKIPPED",
]);
export type NiscOrderItemStatus = z.infer<typeof niscOrderItemStatusSchema>;

// ============================================================================
// Shared shapes (metadata, name servers)
// ============================================================================

export const transferItemMetadataSchema = z
	.object({
		/** Set when checkout starts (createCheckoutRequest); reused on createFromPayment. */
		domainTransferRequestId: z.string().optional(),
		transferAuthCode: z.string().optional(),
		nameServers: z
			.array(z.object({ name: z.string(), ip: z.string().optional() }))
			.optional(),
		useRegistrantInfo: z.enum(["myself", "customer"]).optional(),
		manualRegistrantDetails: z
			.object({
				firstName: z.string().optional(),
				lastName: z.string().optional(),
				email: z.string().optional(),
				address: z.string().optional(),
				city: z.string().optional(),
				country: z.string().optional(),
				postalCode: z.string().optional(),
				phone: z.string().optional(),
			})
			.optional(),
	})
	.optional();
export type TransferItemMetadata = z.infer<typeof transferItemMetadataSchema>;

// ============================================================================
// Create order (agency manual order)
// ============================================================================

export const createOrderItemSchema = z.object({
	productId: z.string(),
	productPlanId: z.string(),
	billingCycle: billingCycleSchema.optional(),
	primaryDomain: z.string().optional(),
	domainSubscriptionId: z.string().optional(),
	metadata: transferItemMetadataSchema,
});

export const createOrderInputSchema = z
	.object({
		userId: z.string().optional(),
		teamId: z.string().optional(),
		items: z.array(createOrderItemSchema).min(1),
		promoCode: z.string().optional(),
		notes: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (!data.userId && !data.teamId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Either userId or teamId is required",
				path: ["userId"],
			});
		}
	});
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

// ============================================================================
// Get all / get by id / retry
// ============================================================================

export const getAllNiscOrdersInputSchema = z.object({
	userId: z.string().optional(),
	teamId: z.string().optional(),
	status: niscOrderStatusSchema.optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});
export type GetAllNiscOrdersInput = z.infer<typeof getAllNiscOrdersInputSchema>;

export const getNiscOrderByIdInputSchema = z.object({ id: z.string() });
export type GetNiscOrderByIdInput = z.infer<typeof getNiscOrderByIdInputSchema>;

export const retryNiscOrderInputSchema = z.object({ niscOrderId: z.string() });
export type RetryNiscOrderInput = z.infer<typeof retryNiscOrderInputSchema>;

// ============================================================================
// Create from payment (checkout flow)
// ============================================================================

export const createFromPaymentItemSchema = z.object({
	productId: z.string(),
	productPlanId: z.string().nullable().optional(),
	billingCycle: billingCycleSchema.optional(),
	primaryDomain: z.string().optional(),
	description: z.string().optional(),
	itemPrice: z.string(),
	itemSubtotal: z.string(),
	domainSubscriptionId: z.string().optional(),
	metadata: transferItemMetadataSchema,
});
export type CreateFromPaymentItemInput = z.infer<typeof createFromPaymentItemSchema>;

export const createFromPaymentInputSchema = z.object({
	checkoutRequestId: z.string().min(1),
	items: z.array(createFromPaymentItemSchema).min(1),
	currency: z.string().default("KES"),
	teamId: z.string().optional(),
	/** Agency only: order / subscription owner (e.g. end customer user) instead of the payer session user. */
	billedForUserId: z.string().min(1).optional(),
});
export type CreateFromPaymentInput = z.infer<typeof createFromPaymentInputSchema>;
