import { z } from "zod";

/**
 * Enumerations mirroring the database schema while remaining independent
 * from ORM-specific types. These are shared across inputs and outputs.
 */
export const invoiceStatusSchema = z.enum([
	"DRAFT",
	"SENT",
	"UNPAID",
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

export const invoiceKraStatusSchema = z.enum([
	"NOT_APPLICABLE",
	"PENDING",
	"SUBMITTING",
	"SYNCED",
	"FAILED",
	"SKIPPED",
	/** @deprecated Legacy reports value; treated as SYNCED */
	"VERIFIED",
]);
export type InvoiceKraStatusType = z.infer<typeof invoiceKraStatusSchema>;

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

/** KRA eTIMS fiscal footer + verification URL (customer-safe when synced). */
export const etimsFiscalFieldsSchema = z.object({
	rcptSign: nullableStringSchema,
	intrlData: nullableStringSchema,
	curRcptNo: nullableStringSchema,
	totRcptNo: nullableStringSchema,
	sdcDateTime: nullableStringSchema,
	sdcDateTimeDisplay: nullableStringSchema,
	verificationUrl: nullableStringSchema,
	sdcId: nullableStringSchema,
	receiptLabel: nullableStringSchema,
	cuInvoiceNo: nullableStringSchema,
	intrlDataDashed: nullableStringSchema,
	rcptSignDashed: nullableStringSchema,
	scuDate: nullableStringSchema,
	scuTime: nullableStringSchema,
	tisReceiptNumber: nullableStringSchema,
	tisDate: nullableStringSchema,
	tisTime: nullableStringSchema,
	originalCuInvoiceNo: nullableStringSchema,
	itemCount: z.number().int().min(0).nullable().optional(),
});
export type EtimsFiscalFieldsType = z.infer<typeof etimsFiscalFieldsSchema>;

export const invoiceKraFieldsSchema = z.object({
	kraInvoiceNumber: nullableStringSchema,
	kraReceiptNumber: nullableStringSchema,
	kraSignature: nullableStringSchema,
	kraQrCode: nullableStringSchema,
	kraVerifiedDate: nullableDateInputSchema,
	kraStatus: invoiceKraStatusSchema.nullable().optional(),
	kraError: nullableStringSchema,
	kraSubmittedAt: nullableDateInputSchema,
	kraLastAttemptAt: nullableDateInputSchema,
	kraAttemptCount: z.number().int().min(0).optional(),
	kraVerificationUrl: nullableStringSchema,
	kraSyncPayload: nullableJsonSchema,
	kraSyncResponse: nullableJsonSchema,
});

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
	kraRefundReasonCode: nullableStringSchema,
	originalInvoiceNumber: nullableStringSchema,
	kraInvoiceNumber: nullableStringSchema,
	kraReceiptNumber: nullableStringSchema,
	kraSignature: nullableStringSchema,
	kraQrCode: nullableStringSchema,
	kraVerifiedDate: z.date().nullable().optional(),
	kraStatus: invoiceKraStatusSchema.nullable().optional(),
	kraError: nullableStringSchema,
	kraSubmittedAt: z.date().nullable().optional(),
	kraLastAttemptAt: z.date().nullable().optional(),
	kraAttemptCount: z.number().int().min(0).nullable().optional(),
	kraVerificationUrl: nullableStringSchema,
	kraSyncPayload: nullableJsonSchema,
	kraSyncResponse: nullableJsonSchema,
});
export type CreditNote = z.infer<typeof creditNoteOutputSchema>;

export const creditNoteSummarySchema = z.object({
	id: z.string().uuid(),
	creditNumber: nullableStringSchema,
	invoiceId: z.string().uuid(),
	invoiceNumber: nullableStringSchema,
	customerName: nullableStringSchema,
	customerEmail: nullableStringSchema,
	status: creditNoteStatusSchema,
	amount: z.string(),
	currency: z.string(),
	issuedAt: z.date().nullable(),
	kraStatus: invoiceKraStatusSchema.nullable().optional(),
	originalInvoiceNumber: nullableStringSchema,
	teamId: nullableStringSchema,
	createdAt: z.date(),
});
export type CreditNoteSummary = z.infer<typeof creditNoteSummarySchema>;

export const creditNoteListFiltersSchema = z.object({
	teamId: z.string().uuid().optional(),
	unassignedOnly: z.boolean().optional(),
	status: creditNoteStatusSchema.optional(),
	search: z.string().optional(),
	limit: z.number().int().min(1).max(100).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
export type CreditNoteListFilters = z.infer<typeof creditNoteListFiltersSchema>;

export const creditNoteListResponseSchema = z.object({
	creditNotes: z.array(creditNoteSummarySchema),
	total: z.number().int().min(0),
});

export const creditNoteDetailSchema = creditNoteOutputSchema.extend({
	invoiceNumber: nullableStringSchema,
	customerName: nullableStringSchema,
	customerEmail: nullableStringSchema,
	fromDetails: nullableJsonSchema,
	customerDetails: nullableJsonSchema,
	paymentDetails: nullableJsonSchema,
	lineItems: z.array(invoiceLineItemOutputSchema),
	subtotal: nullableStringSchema,
	tax: nullableStringSchema,
	taxPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
	note: nullableStringSchema,
	etimsFiscal: etimsFiscalFieldsSchema.nullable().optional(),
	originalCuInvoiceNo: nullableStringSchema,
});
export type CreditNoteDetail = z.infer<typeof creditNoteDetailSchema>;

export const issueCreditNoteInputSchema = z.object({
	invoiceId: z.string().uuid(),
	rfdRsnCd: z.enum(["01", "02", "03", "04", "05", "06"]),
	reason: nullableStringSchema,
	note: nullableStringSchema,
});
export type IssueCreditNoteInput = z.infer<typeof issueCreditNoteInputSchema>;

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
	taxPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
	vat: nullableStringSchema,
	discount: nullableStringSchema,
	currency: z.string().min(1).default("KES"),
	creditedAmount: nullableStringSchema,
	creditBalance: nullableStringSchema,
	amountPaid: nullableStringSchema,
	amountRemaining: nullableStringSchema,
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
	...invoiceKraFieldsSchema.shape,
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
		createdBy: true,
		updatedBy: true,
		token: true,
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
	teamId: nullableStringSchema,
	teamName: nullableStringSchema,
	kraStatus: invoiceKraStatusSchema.nullable().optional(),
});
export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>;

export const invoiceDetailSchema = invoiceSummarySchema.extend({
	customerId: nullableStringSchema,
	subtotal: nullableStringSchema,
	tax: nullableStringSchema,
	taxPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
	vat: nullableStringSchema,
	discount: nullableStringSchema,
	creditedAmount: nullableStringSchema,
	creditBalance: nullableStringSchema,
	amountPaid: nullableStringSchema,
	amountRemaining: nullableStringSchema,
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
	kraInvoiceNumber: nullableStringSchema,
	kraReceiptNumber: nullableStringSchema,
	kraSignature: nullableStringSchema,
	kraQrCode: nullableStringSchema,
	kraVerifiedDate: z.date().nullable().optional(),
	kraError: nullableStringSchema,
	kraSubmittedAt: z.date().nullable().optional(),
	kraLastAttemptAt: z.date().nullable().optional(),
	kraAttemptCount: z.number().int().min(0).nullable().optional(),
	kraVerificationUrl: nullableStringSchema,
	kraSyncPayload: nullableJsonSchema,
	kraSyncResponse: nullableJsonSchema,
	etimsFiscal: etimsFiscalFieldsSchema.nullable().optional(),
});
export type InvoiceDetail = z.infer<typeof invoiceDetailSchema>;

/**
 * Helper schemas for filtering and pagination.
 */
export const invoiceListFiltersSchema = z.object({
	teamId: z.string().uuid().optional(),
	unassignedOnly: z.boolean().optional(),
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

export const invoiceTeamSummarySchema = z.object({
	teamId: z.string().uuid().nullable(),
	teamName: z.string(),
	invoiceCount: z.number().int().nonnegative(),
	unpaidCount: z.number().int().nonnegative(),
	lastInvoiceAt: z.date().nullable(),
});
export type InvoiceTeamSummary = z.infer<typeof invoiceTeamSummarySchema>;

export const invoiceTeamsSummaryFiltersSchema = z.object({
	search: z.string().optional(),
});
export type InvoiceTeamsSummaryFilters = z.infer<typeof invoiceTeamsSummaryFiltersSchema>;

export const invoiceTeamsSummaryResponseSchema = z.object({
	teams: z.array(invoiceTeamSummarySchema),
});
export type InvoiceTeamsSummaryResponse = z.infer<typeof invoiceTeamsSummaryResponseSchema>;

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

export const applyCheckoutPaymentInputSchema = z.object({
	checkoutRequestId: z.string().min(1),
});
export type ApplyCheckoutPaymentInput = z.infer<typeof applyCheckoutPaymentInputSchema>;

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
/**
 * Schema for Team eTIMS settings
 */
export const teamETimsSettingsSchema = z.object({
	id: z.string().uuid(),
	teamId: z.string(),
	kraPin: z.string(),
	branchId: z.string(),
	deviceSerialNumber: z.string(),
	cmcKey: z.string().nullable(),
	isInitialized: z.boolean(),
	isSandbox: z.boolean(),
	lastSyncAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type TeamETimsSettings = z.infer<typeof teamETimsSettingsSchema>;

/**
 * Schema for initial eTIMS setup/initialization
 */
export const initializeETimsSchema = z.object({
	teamId: z.string().uuid(),
	kraPin: z.string(),
	branchId: z.string().default("00"),
	deviceSerialNumber: z.string(),
	isSandbox: z.boolean().default(true),
});
export type InitializeETimsInput = z.infer<typeof initializeETimsSchema>;

/**
 * Schema for updating eTIMS settings
 */
export const updateETimsSettingsSchema = z.object({
	teamId: z.string().uuid(),
	kraPin: z.string().optional(),
	branchId: z.string().optional(),
	deviceSerialNumber: z.string().optional(),
	isSandbox: z.boolean().optional(),
});
/**
 * Schema for Team eTIMS Item
 */
export const teamETimsItemSchema = z.object({
	id: z.string().uuid(),
	teamId: z.string(),
	itemCd: z.string(),
	itemClsCd: z.string(),
	itemNm: z.string(),
	itemClsNm: z.string().nullable(),
	taxTyCd: z.string(),
	pkgUnitCd: z.string(),
	qtyUnitCd: z.string(),
	prc: z.string().nullable(),
	isService: z.boolean(),
	metadata: nullableJsonSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type TeamETimsItem = z.infer<typeof teamETimsItemSchema>;

export const registerETimsItemSchema = z.object({
	teamId: z.string().uuid(),
	itemCd: z.string(),
	itemClsCd: z.string(),
	itemNm: z.string(),
	taxTyCd: z.string().default("A"),
	pkgUnitCd: z.string().default("OU"),
	qtyUnitCd: z.string().default("OU"),
	prc: z.string().optional(),
	isService: z.boolean().default(true),
});
export type RegisterETimsItemInput = z.infer<typeof registerETimsItemSchema>;

/**
 * Schema for Team eTIMS Branch
 */
export const teamETimsBranchSchema = z.object({
	id: z.string().uuid(),
	teamId: z.string(),
	bhfId: z.string(),
	bhfNm: z.string(),
	bhfSttsCd: z.string(),
	addr: z.string().nullable(),
	mgrNm: z.string().nullable(),
	mgrTelNo: z.string().nullable(),
	metadata: nullableJsonSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type TeamETimsBranch = z.infer<typeof teamETimsBranchSchema>;

