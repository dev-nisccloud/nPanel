import { z } from "zod";

/**
 * Nisc Service Orders – UI-layer schemas and enums.
 * Fully independent from DB/Prisma. Enum values must stay in sync with API (nisc-service-orders-schemas).
 * Used for forms and display only; no imports from API or db.
 */

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

export const createOrderItemSchema = z.object({
	productId: z.string().min(1, "Product is required"),
	productPlanId: z.string().min(1, "Plan is required"),
	billingCycle: billingCycleSchema.optional(),
	primaryDomain: z.string().optional(),
	domainSubscriptionId: z.string().optional(),
});

export const createOrderFormSchema = z
	.object({
		userId: z.string().optional(),
		teamId: z.string().optional(),
		items: z.array(createOrderItemSchema).min(1, "At least one item is required"),
		promoCode: z.string().optional(),
		notes: z.string().optional(),
	})
	.refine((data) => data.userId != null || data.teamId != null, {
		message: "Select either a user or a team (or both)",
		path: ["teamId"],
	});

export type CreateOrderFormData = z.infer<typeof createOrderFormSchema>;
export type CreateOrderItem = z.infer<typeof createOrderItemSchema>;
