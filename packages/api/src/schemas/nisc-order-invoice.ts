import { z } from "zod";

/**
 * API-layer schema for Nisc order data used when creating an invoice.
 * Independent of Prisma/DB. Use in createInvoiceForNiscOrder and callers.
 */

const nullableString = z.string().optional().nullable();

/** Billing cycle for subscription/plan – API enum. */
export const billingCycleSchema = z.enum(["MONTHLY", "YEARLY", "BIENNIALLY"]);
export type BillingCycleType = z.infer<typeof billingCycleSchema>;

/** Product reference in an order item. */
export const orderItemProductSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	serviceType: nullableString,
});
/** Product plan reference (name only), optional for items without a plan. */
export const orderItemProductPlanSchema = z.object({
	name: z.string(),
}).nullable();

/** Single Nisc order item as used for invoice creation. */
export const niscOrderItemForInvoiceSchema = z.object({
	productId: z.string().optional(),
	itemPrice: z.string(),
	itemSubtotal: z.string(),
	primaryDomain: nullableString,
	billingCycle: nullableString,
	description: nullableString,
	metadata: z.record(z.unknown()).optional().nullable(),
	product: orderItemProductSchema,
	productPlan: orderItemProductPlanSchema,
});
export type NiscOrderItemForInvoice = z.infer<typeof niscOrderItemForInvoiceSchema>;

/** Nisc order with items as accepted for auto-invoice creation. */
export const niscOrderForInvoiceSchema = z.object({
	id: z.string(),
	teamId: z.string().nullable(),
	currency: z.string(),
	orderNumber: z.string(),
	createdAt: z.coerce.date(),
	orderItems: z.array(niscOrderItemForInvoiceSchema),
});
export type NiscOrderForInvoice = z.infer<typeof niscOrderForInvoiceSchema>;
