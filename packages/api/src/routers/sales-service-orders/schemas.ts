import { z } from "zod";

export const serviceOrderStatusSchema = z.enum([
	"DRAFT",
	"SENT",
	"ACCEPTED",
	"DECLINED",
	"EXPIRED",
	"CANCELLED",
]);
export type ServiceOrderStatus = z.infer<typeof serviceOrderStatusSchema>;

const optionalText = z.preprocess(
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

export const serviceOrderLineInputSchema = z.object({
	id: z.string().uuid().optional(),
	position: z.number().int().min(0).default(0),
	category: optionalText,
	name: optionalText,
	primaryDomain: optionalText,
	quantity: z.number().min(0).optional().nullable(),
	billingCycle: optionalText,
	price: optionalText,
	total: optionalText,
	metadata: nullableJsonSchema,
});
export type ServiceOrderLineInput = z.infer<typeof serviceOrderLineInputSchema>;

export const serviceOrderLineOutputSchema = serviceOrderLineInputSchema.extend({
	id: z.string().uuid(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const serviceOrderActivityLogSchema = z.object({
	id: z.string().uuid(),
	userId: z.string(),
	action: z.string(),
	description: optionalText,
	metadata: nullableJsonSchema,
	createdAt: z.date(),
});

const serviceOrderWriteFields = {
	orderNumber: optionalText,
	customerName: optionalText,
	customerEmail: optionalText,
	billingEmail: optionalText,
	phone: optionalText,
	contactPerson: optionalText,
	linkedUserId: z.string().optional().nullable(),
	token: z.string().uuid().optional(),
	status: serviceOrderStatusSchema.optional(),
	amount: optionalText,
	subtotal: optionalText,
	tax: optionalText,
	taxPercentage: z.number().min(0).max(100).optional().nullable(),
	vat: optionalText,
	discount: optionalText,
	currency: z.string().min(1).default("KES"),
	issueDate: nullableDateInputSchema,
	validUntil: nullableDateInputSchema,
	paymentTerms: optionalText,
	preparedBy: optionalText,
	note: optionalText,
	fromDetails: nullableJsonSchema,
	customerDetails: nullableJsonSchema,
	authorization: nullableJsonSchema,
	metadata: nullableJsonSchema,
	lineItems: z.array(serviceOrderLineInputSchema).optional(),
};

export const serviceOrderCreateInputSchema = z.object(serviceOrderWriteFields).strip();
export type ServiceOrderCreateInput = z.infer<typeof serviceOrderCreateInputSchema>;

export const serviceOrderUpdateInputSchema = z
	.object({
		id: z.string().uuid(),
		...serviceOrderWriteFields,
	})
	.strip();
export type ServiceOrderUpdateInput = z.infer<typeof serviceOrderUpdateInputSchema>;

export const serviceOrderSummarySchema = z.object({
	id: z.string().uuid(),
	orderNumber: optionalText,
	customerName: optionalText,
	customerEmail: optionalText,
	status: serviceOrderStatusSchema,
	amount: optionalText,
	subtotal: optionalText,
	currency: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const serviceOrderDetailSchema = serviceOrderSummarySchema.extend({
	billingEmail: optionalText,
	phone: optionalText,
	contactPerson: optionalText,
	linkedUserId: z.string().nullable().optional(),
	tax: optionalText,
	taxPercentage: z.number().min(0).max(100).optional().nullable(),
	vat: optionalText,
	discount: optionalText,
	issueDate: z.date().nullable(),
	validUntil: z.date().nullable(),
	paymentTerms: optionalText,
	preparedBy: optionalText,
	note: optionalText,
	fromDetails: nullableJsonSchema,
	customerDetails: nullableJsonSchema,
	authorization: nullableJsonSchema,
	metadata: nullableJsonSchema,
	lineItems: z.array(serviceOrderLineOutputSchema),
	activityLogs: z.array(serviceOrderActivityLogSchema).optional(),
});
export type ServiceOrderDetail = z.infer<typeof serviceOrderDetailSchema>;

export const serviceOrderListFiltersSchema = z.object({
	status: serviceOrderStatusSchema.optional(),
	search: z.string().optional(),
	customerGroupKey: z.string().min(1).optional(),
	limit: z.number().int().min(1).max(100).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});

export const serviceOrderListResponseSchema = z.object({
	orders: z.array(serviceOrderSummarySchema),
	total: z.number().int().nonnegative(),
});

export const serviceOrderCustomerSummarySchema = z.object({
	customerGroupKey: z.string(),
	customerName: optionalText,
	customerEmail: optionalText,
	orderCount: z.number().int().nonnegative(),
	openCount: z.number().int().nonnegative(),
	lastOrderAt: z.date().nullable(),
});

export const serviceOrderCustomersSummaryFiltersSchema = z.object({
	search: z.string().optional(),
});

export const serviceOrderCustomersSummaryResponseSchema = z.object({
	customers: z.array(serviceOrderCustomerSummarySchema),
});

export const nextServiceOrderNumberSchema = z.object({
	orderNumber: z.string(),
	nextNumber: z.number().int().positive(),
});

export const sendServiceOrderEmailSchema = z.object({
	serviceOrderId: z.string().uuid(),
	toEmail: z.string().email("Valid email is required"),
	pdfBase64: z.string().min(1, "PDF attachment is required"),
});
