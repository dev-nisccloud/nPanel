import { z } from "zod";

/**
 * Enumerations mirroring the Prisma schema while remaining independent
 * from the generated Prisma types. These are shared across inputs and outputs.
 */
export const invoiceStatusSchema = z.enum([
	"DRAFT",
	"SENT",
	"PARTIALLY_PAID",
	"PAID",
	"OVERDUE",
	"CANCELLED",
	"WRITTEN_OFF",
]);
export type InvoiceStatusType = z.infer<typeof invoiceStatusSchema>;

export const invoicePaymentStatusSchema = z.enum([
	"PENDING",
	"COMPLETED",
	"FAILED",
	"REFUNDED",
]);
export type InvoicePaymentStatusType = z.infer<typeof invoicePaymentStatusSchema>;

export const invoicePaymentMethodSchema = z.enum([
	"BANK_TRANSFER",
	"MPESA",
	"CHEQUE",
	"CASH",
	"CARD",
	"OTHER",
]);
export type InvoicePaymentMethodType = z.infer<typeof invoicePaymentMethodSchema>;

export const creditNoteStatusSchema = z.enum([
	"DRAFT",
	"ISSUED",
	"APPLIED",
	"VOIDED",
]);
export type CreditNoteStatusType = z.infer<typeof creditNoteStatusSchema>;

/**
 * Utility schemas used across invoice payloads.
 */
export const nullableStringSchema = z.string().trim().min(1).optional().nullable();
export const nullableJsonSchema = z
	.union([z.record(z.string(), z.unknown()), z.array(z.unknown())])
	.optional()
	.nullable();
export const nullableDateInputSchema = z
	.union([z.string().datetime(), z.coerce.date()])
	.optional()
	.nullable();

/**
 * Line item schema – sent from the client when creating/updating invoices.
 * Amount-related fields are strings to avoid floating point issues.
 */
export const invoiceLineItemInputSchema = z.object({
	id: z.string().uuid().optional(),
	position: z.number().int().min(0).default(0),
	name: nullableStringSchema,
	description: nullableStringSchema,
	quantity: z.number().min(0).optional().nullable(),
	unit: nullableStringSchema,
	price: nullableStringSchema,
	discount: nullableStringSchema,
	total: nullableStringSchema,
	metadata: nullableJsonSchema,
});
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemInputSchema>;

export const invoiceLineItemOutputSchema = invoiceLineItemInputSchema.extend({
	id: z.string().uuid(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type InvoiceLineItem = z.infer<typeof invoiceLineItemOutputSchema>;

/**
 * Activity log schema shape shared across invoice entities.
 */
export const activityLogSchema = z.object({
	id: z.string().uuid(),
	userId: z.string(),
	action: z.string(),
	description: nullableStringSchema,
	metadata: nullableJsonSchema,
	ipAddress: nullableStringSchema,
	userAgent: nullableStringSchema,
	createdAt: z.date(),
});
export type ActivityLogEntry = z.infer<typeof activityLogSchema>;

/**
 * Invoice transaction schemas.
 */
export const invoiceTransactionInputSchema = z.object({
	id: z.string().uuid().optional(),
	invoiceId: z.string().uuid(),
	reference: nullableStringSchema,
	providerReference: nullableStringSchema,
	status: invoicePaymentStatusSchema.default("PENDING"),
	method: invoicePaymentMethodSchema,
	amount: z.string().min(1, "Amount is required"),
	currency: z.string().min(1).default("KES"),
	paidAt: nullableDateInputSchema,
	notes: nullableStringSchema,
	metadata: nullableJsonSchema,
	balanceBefore: nullableStringSchema,
	balanceAfter: nullableStringSchema,
	recordedBy: nullableStringSchema,
});
export type InvoiceTransactionInput = z.infer<typeof invoiceTransactionInputSchema>;

export const invoiceTransactionOutputSchema = invoiceTransactionInputSchema.extend({
	id: z.string().uuid(),
	status: invoicePaymentStatusSchema,
	paidAt: z.date().nullable(),
	metadata: nullableJsonSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
	activityLogs: z.array(activityLogSchema).optional(),
});
export type InvoiceTransaction = z.infer<typeof invoiceTransactionOutputSchema>;

/**
 * Credit note schemas.
 */
export const creditNoteInputSchema = z.object({
	id: z.string().uuid().optional(),
	invoiceId: z.string().uuid(),
	teamId: nullableStringSchema,
	creditNumber: nullableStringSchema,
	status: creditNoteStatusSchema.default("DRAFT"),
	amount: z.string().min(1, "Amount is required"),
	currency: z.string().min(1).default("KES"),
	reason: nullableStringSchema,
	note: nullableStringSchema,
	metadata: nullableJsonSchema,
	issuedAt: nullableDateInputSchema,
	appliedAt: nullableDateInputSchema,
	createdBy: z.string(),
	updatedBy: nullableStringSchema,
});
export type CreditNoteInput = z.infer<typeof creditNoteInputSchema>;

export const creditNoteOutputSchema = creditNoteInputSchema.extend({
	id: z.string().uuid(),
	status: creditNoteStatusSchema,
	issuedAt: z.date().nullable(),
	appliedAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	activityLogs: z.array(activityLogSchema).optional(),
});
export type CreditNote = z.infer<typeof creditNoteOutputSchema>;

/**
 * Core invoice schemas.
 */
export const invoiceSnapshotSchema = z.object({
	fromDetails: nullableJsonSchema,
	customerDetails: nullableJsonSchema,
	paymentDetails: nullableJsonSchema,
	noteDetails: nullableJsonSchema,
	template: nullableJsonSchema,
	topBlock: nullableJsonSchema,
	bottomBlock: nullableJsonSchema,
});

const invoiceBaseSchemaFields = {
	id: z.string().uuid().optional(),
	teamId: nullableStringSchema,
	customerId: nullableStringSchema,
	customerName: nullableStringSchema,
	customerEmail: nullableStringSchema,
	invoiceNumber: nullableStringSchema,
	token: nullableStringSchema,
	status: invoiceStatusSchema.optional(),
	amount: nullableStringSchema,
	subtotal: nullableStringSchema,
	tax: nullableStringSchema,
	taxPercentage: z.number().min(0).max(100).optional().nullable(),
	vat: nullableStringSchema,
	discount: nullableStringSchema,
	currency: z.string().min(1).default("KES"),
	creditedAmount: nullableStringSchema,
	creditBalance: nullableStringSchema,
	issueDate: nullableDateInputSchema,
	dueDate: nullableDateInputSchema,
	paidAt: nullableDateInputSchema,
	sentAt: nullableDateInputSchema,
	reminderSentAt: nullableDateInputSchema,
	viewedAt: nullableDateInputSchema,
	note: nullableStringSchema,
	internalNote: nullableStringSchema,
	metadata: nullableJsonSchema,
	createdBy: z.string(),
	updatedBy: nullableStringSchema,
};

export const invoiceCreateInputSchema = z
	.object({
		...invoiceBaseSchemaFields,
		status: invoiceStatusSchema.default("SENT"), // Default to SENT (issued invoice) when invoice is added to DB
		token: z.string().uuid().optional(),
		lineItems: z.array(invoiceLineItemInputSchema).optional().default([]),
		transactions: z.array(invoiceTransactionInputSchema).optional().default([]),
		creditNote: creditNoteInputSchema.optional(),
		...invoiceSnapshotSchema.shape,
	})
	.strip();
export type InvoiceCreateInput = z.infer<typeof invoiceCreateInputSchema>;

export const invoiceUpdateInputSchema = invoiceCreateInputSchema
	.extend({
		id: z.string().uuid(),
		lineItems: z.array(invoiceLineItemInputSchema),
	})
	.partial({
		lineItems: true,
	});
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateInputSchema>;

export const invoiceSummarySchema = z.object({
	id: z.string().uuid(),
	invoiceNumber: nullableStringSchema,
	customerName: nullableStringSchema,
	customerEmail: nullableStringSchema,
	status: invoiceStatusSchema,
	amount: nullableStringSchema,
	currency: z.string(),
	dueDate: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>;

export const invoiceDetailSchema = invoiceSummarySchema.extend({
	teamId: nullableStringSchema,
	customerId: nullableStringSchema,
	subtotal: nullableStringSchema,
	tax: nullableStringSchema,
	taxPercentage: z.number().min(0).max(100).optional().nullable(),
	vat: nullableStringSchema,
	discount: nullableStringSchema,
	creditedAmount: nullableStringSchema,
	creditBalance: nullableStringSchema,
	issueDate: z.date().nullable(),
	paidAt: z.date().nullable(),
	sentAt: z.date().nullable(),
	reminderSentAt: z.date().nullable(),
	viewedAt: z.date().nullable(),
	note: nullableStringSchema,
	internalNote: nullableStringSchema,
	metadata: nullableJsonSchema,
	lineItems: z.array(invoiceLineItemOutputSchema),
	transactions: z.array(invoiceTransactionOutputSchema),
	creditNote: creditNoteOutputSchema.nullable().optional(),
	activityLogs: z.array(activityLogSchema).optional(),
	fromDetails: nullableJsonSchema,
	customerDetails: nullableJsonSchema,
	paymentDetails: nullableJsonSchema,
	noteDetails: nullableJsonSchema,
	template: nullableJsonSchema,
	topBlock: nullableJsonSchema,
	bottomBlock: nullableJsonSchema,
});
export type InvoiceDetail = z.infer<typeof invoiceDetailSchema>;

/**
 * Helper schemas for filtering and pagination.
 */
export const invoiceListFiltersSchema = z.object({
	teamId: z.string().uuid().optional(),
	status: invoiceStatusSchema.optional(),
	search: z.string().optional(),
	limit: z.number().int().min(1).max(100).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type InvoiceListFilters = z.infer<typeof invoiceListFiltersSchema>;

export const invoiceListResponseSchema = z.object({
	invoices: z.array(invoiceSummarySchema),
	total: z.number().int().nonnegative(),
});
export type InvoiceListResponse = z.infer<typeof invoiceListResponseSchema>;

/**
 * Update payment input – complete (use invoice total) or partial (supply amountPaid).
 */
export const updatePaymentInputSchema = z.object({
	invoiceId: z.string().uuid(),
	type: z.enum(["COMPLETE", "PARTIAL"]),
	amountPaid: z.string().optional(), // Required when type is PARTIAL
}).refine((data) => data.type !== "PARTIAL" || (data.amountPaid != null && data.amountPaid.trim() !== ""), {
	message: "Amount paid is required for partial payment",
	path: ["amountPaid"],
});
export type UpdatePaymentInput = z.infer<typeof updatePaymentInputSchema>;

/**
 * Schema for next invoice number response
 */
export const nextInvoiceNumberSchema = z.object({
	invoiceNumber: z.string(),
	nextNumber: z.number().int().positive(),
});
export type NextInvoiceNumber = z.infer<typeof nextInvoiceNumberSchema>;

/**
 * Schema for submitting invoice with PDF for email delivery
 * createdBy and updatedBy are optional here as they are set from authenticated user context
 */
export const submitInvoiceSchema = invoiceCreateInputSchema.extend({
	pdfBase64: z.string().optional(), // Base64 encoded PDF blob
	billingEmail: z.string().email("Valid billing email is required"),
	createdBy: z.string().optional(), // Set from authenticated user context
	updatedBy: z.string().optional(), // Set from authenticated user context
});
export type SubmitInvoiceInput = z.infer<typeof submitInvoiceSchema>;




