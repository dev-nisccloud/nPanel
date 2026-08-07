import { z } from "zod";
/**
 * Enumerations mirroring the database schema while remaining independent
 * from ORM-specific types. These are shared across inputs and outputs.
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
export const invoicePaymentStatusSchema = z.enum([
    "PENDING",
    "COMPLETED",
    "FAILED",
    "REFUNDED",
]);
export const invoicePaymentMethodSchema = z.enum([
    "BANK_TRANSFER",
    "MPESA",
    "CHEQUE",
    "CASH",
    "CARD",
    "OTHER",
]);
export const creditNoteStatusSchema = z.enum([
    "DRAFT",
    "ISSUED",
    "APPLIED",
    "VOIDED",
]);
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
    rcptSign: z.string(),
    intrlData: nullableStringSchema,
    curRcptNo: nullableStringSchema,
    totRcptNo: nullableStringSchema,
    sdcDateTime: nullableStringSchema,
    sdcDateTimeDisplay: nullableStringSchema,
    verificationUrl: nullableStringSchema,
});
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
export const invoiceLineItemOutputSchema = invoiceLineItemInputSchema.extend({
    id: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
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
export const invoiceTransactionOutputSchema = invoiceTransactionInputSchema.extend({
    id: z.string().uuid(),
    status: invoicePaymentStatusSchema,
    paidAt: z.date().nullable(),
    metadata: nullableJsonSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
    activityLogs: z.array(activityLogSchema).optional(),
});
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
export const creditNoteListFiltersSchema = z.object({
    teamId: z.string().uuid().optional(),
    unassignedOnly: z.boolean().optional(),
    status: creditNoteStatusSchema.optional(),
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
});
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
});
export const issueCreditNoteInputSchema = z.object({
    invoiceId: z.string().uuid(),
    rfdRsnCd: z.enum(["01", "02", "03", "04", "05", "06"]),
    reason: nullableStringSchema,
    note: nullableStringSchema,
});
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
export const invoiceDetailSchema = invoiceSummarySchema.extend({
    customerId: nullableStringSchema,
    subtotal: nullableStringSchema,
    tax: nullableStringSchema,
    taxPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
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
export const invoiceListResponseSchema = z.object({
    invoices: z.array(invoiceSummarySchema),
    total: z.number().int().nonnegative(),
});
export const invoiceTeamSummarySchema = z.object({
    teamId: z.string().uuid().nullable(),
    teamName: z.string(),
    invoiceCount: z.number().int().nonnegative(),
    unpaidCount: z.number().int().nonnegative(),
    lastInvoiceAt: z.date().nullable(),
});
export const invoiceTeamsSummaryFiltersSchema = z.object({
    search: z.string().optional(),
});
export const invoiceTeamsSummaryResponseSchema = z.object({
    teams: z.array(invoiceTeamSummarySchema),
});
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
/**
 * Schema for next invoice number response
 */
export const nextInvoiceNumberSchema = z.object({
    invoiceNumber: z.string(),
    nextNumber: z.number().int().positive(),
});
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
