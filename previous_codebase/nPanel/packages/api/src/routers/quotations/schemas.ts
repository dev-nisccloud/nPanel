import { z } from "zod";

/**
 * Quotation API schemas – independent of DB/Prisma.
 * Used for validation and typing only.
 */

export const quotationStatusSchema = z.enum([
	"DRAFT",
	"SENT",
	"ACCEPTED",
	"DECLINED",
	"EXPIRED",
	"CANCELLED",
]);
export type QuotationStatusType = z.infer<typeof quotationStatusSchema>;

const nullableStringSchema = z.string().trim().min(1).optional().nullable();
/** Optional string that allows empty string (coerced to undefined so not sent as empty to DB). */
const optionalStringAllowEmptySchema = z.preprocess(
	(val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
	z.string().trim().min(1).optional().nullable(),
);
const nullableJsonSchema = z
	.union([z.record(z.string(), z.unknown()), z.array(z.unknown())])
	.optional()
	.nullable();
const nullableDateInputSchema = z
	.union([z.string().datetime(), z.coerce.date()])
	.optional()
	.nullable();

export const quotationLineItemInputSchema = z.object({
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
export type QuotationLineItemInput = z.infer<typeof quotationLineItemInputSchema>;

export const quotationLineItemOutputSchema = quotationLineItemInputSchema.extend({
	id: z.string().uuid(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type QuotationLineItem = z.infer<typeof quotationLineItemOutputSchema>;

export const quotationActivityLogSchema = z.object({
	id: z.string().uuid(),
	userId: z.string(),
	action: z.string(),
	description: nullableStringSchema,
	metadata: nullableJsonSchema,
	ipAddress: nullableStringSchema,
	userAgent: nullableStringSchema,
	createdAt: z.date(),
});
export type QuotationActivityLogEntry = z.infer<typeof quotationActivityLogSchema>;

const quotationSnapshotSchema = z.object({
	fromDetails: nullableJsonSchema,
	customerDetails: nullableJsonSchema,
	noteDetails: nullableJsonSchema,
	template: nullableJsonSchema,
	topBlock: nullableJsonSchema,
	bottomBlock: nullableJsonSchema,
});

const quotationBaseSchemaFields = {
	id: z.string().uuid().optional(),
	quotationNumber: nullableStringSchema,
	customerName: nullableStringSchema,
	customerEmail: nullableStringSchema,
	token: nullableStringSchema,
	status: quotationStatusSchema.optional(),
	amount: nullableStringSchema,
	subtotal: nullableStringSchema,
	tax: nullableStringSchema,
	taxPercentage: z.number().min(0).max(100).optional().nullable(),
	vat: nullableStringSchema,
	discount: optionalStringAllowEmptySchema,
	currency: z.string().min(1).default("KES"),
	issueDate: nullableDateInputSchema,
	note: optionalStringAllowEmptySchema,
	internalNote: optionalStringAllowEmptySchema,
	metadata: nullableJsonSchema,
	createdBy: z.string().optional(), // Set from session when omitted
	updatedBy: nullableStringSchema,
};

export const quotationCreateInputSchema = z
	.object({
		...quotationBaseSchemaFields,
		status: quotationStatusSchema.default("DRAFT"),
		token: z.string().uuid().optional(),
		lineItems: z.array(quotationLineItemInputSchema).optional().default([]),
		...quotationSnapshotSchema.shape,
	})
	.strip();
export type QuotationCreateInput = z.infer<typeof quotationCreateInputSchema>;

export const quotationUpdateInputSchema = z
	.object({
		...quotationBaseSchemaFields,
		id: z.string().uuid(),
		lineItems: z.array(quotationLineItemInputSchema),
		...quotationSnapshotSchema.shape,
	})
	.partial({ lineItems: true })
	.strip();
export type QuotationUpdateInput = z.infer<typeof quotationUpdateInputSchema>;

export const quotationSummarySchema = z.object({
	id: z.string().uuid(),
	quotationNumber: nullableStringSchema,
	customerName: nullableStringSchema,
	customerEmail: nullableStringSchema,
	status: quotationStatusSchema,
	amount: nullableStringSchema,
	subtotal: nullableStringSchema,
	currency: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type QuotationSummary = z.infer<typeof quotationSummarySchema>;

export const quotationDetailSchema = quotationSummarySchema.extend({
	subtotal: nullableStringSchema,
	tax: nullableStringSchema,
	taxPercentage: z.number().min(0).max(100).optional().nullable(),
	vat: nullableStringSchema,
	discount: nullableStringSchema,
	issueDate: z.date().nullable(),
	note: nullableStringSchema,
	internalNote: nullableStringSchema,
	metadata: nullableJsonSchema,
	lineItems: z.array(quotationLineItemOutputSchema),
	activityLogs: z.array(quotationActivityLogSchema).optional(),
	fromDetails: nullableJsonSchema,
	customerDetails: nullableJsonSchema,
	noteDetails: nullableJsonSchema,
	template: nullableJsonSchema,
	topBlock: nullableJsonSchema,
	bottomBlock: nullableJsonSchema,
});
export type QuotationDetail = z.infer<typeof quotationDetailSchema>;

export const quotationListFiltersSchema = z.object({
	status: quotationStatusSchema.optional(),
	search: z.string().optional(),
	limit: z.number().int().min(1).max(100).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type QuotationListFilters = z.infer<typeof quotationListFiltersSchema>;

export const quotationListResponseSchema = z.object({
	quotations: z.array(quotationSummarySchema),
	total: z.number().int().nonnegative(),
});
export type QuotationListResponse = z.infer<typeof quotationListResponseSchema>;

export const nextQuotationNumberSchema = z.object({
	quotationNumber: z.string(),
	nextNumber: z.number().int().positive(),
});
export type NextQuotationNumber = z.infer<typeof nextQuotationNumberSchema>;

export const sendQuotationEmailSchema = z.object({
	quotationId: z.string().uuid(),
	toEmail: z.string().email("Valid email is required"),
	pdfBase64: z.string().min(1, "PDF attachment is required"),
});
export type SendQuotationEmailInput = z.infer<typeof sendQuotationEmailSchema>;
