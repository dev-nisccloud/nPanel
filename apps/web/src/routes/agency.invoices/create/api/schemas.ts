import { z } from "zod";

export const invoiceStatusSchema = z.enum([
	"DRAFT",
	"SENT",
	"PARTIALLY_PAID",
	"PAID",
	"OVERDUE",
	"CANCELLED",
	"WRITTEN_OFF",
]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const invoicePaymentStatusSchema = z.enum([
	"PENDING",
	"COMPLETED",
	"FAILED",
	"REFUNDED",
]);
export type InvoicePaymentStatus = z.infer<typeof invoicePaymentStatusSchema>;

export const invoicePaymentMethodSchema = z.enum([
	"BANK_TRANSFER",
	"MPESA",
	"CHEQUE",
	"CASH",
	"CARD",
	"OTHER",
]);
export type InvoicePaymentMethod = z.infer<typeof invoicePaymentMethodSchema>;

export const creditNoteStatusSchema = z.enum([
	"DRAFT",
	"ISSUED",
	"APPLIED",
	"VOIDED",
]);
export type CreditNoteStatus = z.infer<typeof creditNoteStatusSchema>;

const nullableString = z.string().optional().nullable();
const nullableNumber = z.number().optional().nullable();
const nullableDate = z
	.union([z.date(), z.string().datetime({ offset: true })])
	.optional()
	.nullable();
const nullableJson = z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]).optional().nullable();

export const invoiceActivityLogSchema = z.object({
	id: z.string(),
	userId: z.string(),
	action: z.string(),
	description: nullableString,
	metadata: nullableJson,
	ipAddress: nullableString,
	userAgent: nullableString,
	createdAt: z.union([z.date(), z.string()]),
});
export type InvoiceActivityLog = z.infer<typeof invoiceActivityLogSchema>;

export const invoiceLineItemSchema = z.object({
	id: z.string(),
	position: z.number().int().optional(),
	name: nullableString,
	description: nullableString,
	quantity: nullableNumber,
	unit: nullableString,
	price: nullableString,
	discount: nullableString,
	total: nullableString,
	metadata: nullableJson,
	createdAt: z.union([z.date(), z.string()]),
	updatedAt: z.union([z.date(), z.string()]),
});
export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>;

export const invoiceTransactionSchema = z.object({
	id: z.string(),
	invoiceId: z.string(),
	reference: nullableString,
	providerReference: nullableString,
	status: invoicePaymentStatusSchema,
	method: invoicePaymentMethodSchema,
	amount: z.string(),
	currency: z.string(),
	paidAt: nullableDate,
	notes: nullableString,
	metadata: nullableJson,
	balanceBefore: nullableString,
	balanceAfter: nullableString,
	recordedBy: nullableString,
	createdAt: z.union([z.date(), z.string()]),
	updatedAt: z.union([z.date(), z.string()]),
	activityLogs: z.array(invoiceActivityLogSchema).optional(),
});
export type InvoiceTransaction = z.infer<typeof invoiceTransactionSchema>;

export const creditNoteSchema = z.object({
	id: z.string(),
	invoiceId: z.string(),
	teamId: nullableString,
	creditNumber: nullableString,
	status: creditNoteStatusSchema,
	amount: z.string(),
	currency: z.string(),
	reason: nullableString,
	note: nullableString,
	metadata: nullableJson,
	issuedAt: nullableDate,
	appliedAt: nullableDate,
	createdBy: z.string(),
	updatedBy: nullableString,
	createdAt: z.union([z.date(), z.string()]),
	updatedAt: z.union([z.date(), z.string()]),
	activityLogs: z.array(invoiceActivityLogSchema).optional(),
});
export type CreditNote = z.infer<typeof creditNoteSchema>;

export const invoiceSummarySchema = z.object({
	id: z.string(),
	invoiceNumber: nullableString,
	customerName: nullableString,
	customerEmail: nullableString,
	status: invoiceStatusSchema,
	amount: nullableString,
	currency: z.string(),
	dueDate: nullableDate,
	createdAt: z.union([z.date(), z.string()]),
	updatedAt: z.union([z.date(), z.string()]),
	teamId: nullableString,
	teamName: nullableString,
});
export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>;

export const invoiceDetailSchema = invoiceSummarySchema.extend({
	customerId: nullableString,
	subtotal: nullableString,
	tax: nullableString,
	taxPercentage: z.number().min(0).max(100).optional().nullable(),
	vat: nullableString,
	discount: nullableString,
	creditedAmount: nullableString,
	creditBalance: nullableString,
	amountPaid: nullableString,
	amountRemaining: nullableString,
	issueDate: nullableDate,
	paidAt: nullableDate,
	sentAt: nullableDate,
	reminderSentAt: nullableDate,
	viewedAt: nullableDate,
	note: nullableString,
	internalNote: nullableString,
	metadata: nullableJson,
	lineItems: z.array(invoiceLineItemSchema),
	transactions: z.array(invoiceTransactionSchema),
	creditNote: creditNoteSchema.nullable().optional(),
	activityLogs: z.array(invoiceActivityLogSchema).optional(),
	fromDetails: nullableJson,
	customerDetails: nullableJson,
	paymentDetails: nullableJson,
	noteDetails: nullableJson,
	template: nullableJson,
	topBlock: nullableJson,
	bottomBlock: nullableJson,
});
export type InvoiceDetail = z.infer<typeof invoiceDetailSchema>;

export const invoiceListResponseSchema = z.object({
	invoices: z.array(invoiceSummarySchema),
	total: z.number(),
});
export type InvoiceListResponse = z.infer<typeof invoiceListResponseSchema>;

/**
 * Schemas representing payloads sent from the UI to the API.
 * These remain independent from backend schemas to avoid tight coupling.
 */
export const invoiceLineItemInputSchema = invoiceLineItemSchema.partial({
	id: true,
	position: true,
	createdAt: true,
	updatedAt: true,
});
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemInputSchema>;

export const invoiceTransactionInputSchema = invoiceTransactionSchema.partial({
	id: true,
	invoiceId: true,
	status: true,
	currency: true,
	paidAt: true,
	createdAt: true,
	updatedAt: true,
	activityLogs: true,
});
export type InvoiceTransactionInput = z.infer<typeof invoiceTransactionInputSchema>;

export const creditNoteInputSchema = creditNoteSchema.partial({
	id: true,
	invoiceId: true,
	status: true,
	teamId: true,
	currency: true,
	issuedAt: true,
	appliedAt: true,
	createdAt: true,
	updatedAt: true,
	activityLogs: true,
	createdBy: true,
});
export type CreditNoteInput = z.infer<typeof creditNoteInputSchema>;

export const invoiceEditorSnapshotSchema = z.object({
	fromDetails: nullableJson,
	customerDetails: nullableJson,
	paymentDetails: nullableJson,
	noteDetails: nullableJson,
	template: nullableJson,
	topBlock: nullableJson,
	bottomBlock: nullableJson,
});

export const invoiceDraftSchema = z.object({
	id: z.string().optional(),
	teamId: nullableString,
	customerId: nullableString,
	customerName: nullableString,
	customerEmail: nullableString,
	invoiceNumber: nullableString,
	status: invoiceStatusSchema.optional(),
	amount: nullableString,
	subtotal: nullableString,
	tax: nullableString,
	taxPercentage: z.number().min(0).max(100).optional().nullable(),
	vat: nullableString,
	discount: nullableString,
	currency: z.string().default("KES"),
	creditedAmount: nullableString,
	creditBalance: nullableString,
	issueDate: nullableDate,
	dueDate: nullableDate,
	paidAt: nullableDate,
	sentAt: nullableDate,
	reminderSentAt: nullableDate,
	viewedAt: nullableDate,
	note: nullableString,
	internalNote: nullableString,
	metadata: nullableJson,
	lineItems: z.array(invoiceLineItemInputSchema).default([]),
	transactions: z.array(invoiceTransactionInputSchema).default([]),
	creditNote: creditNoteInputSchema.optional(),
}).merge(invoiceEditorSnapshotSchema);
export type InvoiceDraft = z.infer<typeof invoiceDraftSchema>;




