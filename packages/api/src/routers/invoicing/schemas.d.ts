import { z } from "zod";
/**
 * Enumerations mirroring the database schema while remaining independent
 * from ORM-specific types. These are shared across inputs and outputs.
 */
export declare const invoiceStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    SENT: "SENT";
    CANCELLED: "CANCELLED";
    PARTIALLY_PAID: "PARTIALLY_PAID";
    PAID: "PAID";
    OVERDUE: "OVERDUE";
    WRITTEN_OFF: "WRITTEN_OFF";
}>;
export type InvoiceStatusType = z.infer<typeof invoiceStatusSchema>;
export declare const invoicePaymentStatusSchema: z.ZodEnum<{
    PENDING: "PENDING";
    FAILED: "FAILED";
    COMPLETED: "COMPLETED";
    REFUNDED: "REFUNDED";
}>;
export type InvoicePaymentStatusType = z.infer<typeof invoicePaymentStatusSchema>;
export declare const invoicePaymentMethodSchema: z.ZodEnum<{
    BANK_TRANSFER: "BANK_TRANSFER";
    MPESA: "MPESA";
    CHEQUE: "CHEQUE";
    CASH: "CASH";
    CARD: "CARD";
    OTHER: "OTHER";
}>;
export type InvoicePaymentMethodType = z.infer<typeof invoicePaymentMethodSchema>;
export declare const creditNoteStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    ISSUED: "ISSUED";
    APPLIED: "APPLIED";
    VOIDED: "VOIDED";
}>;
export type CreditNoteStatusType = z.infer<typeof creditNoteStatusSchema>;
export declare const invoiceKraStatusSchema: z.ZodEnum<{
    PENDING: "PENDING";
    NOT_APPLICABLE: "NOT_APPLICABLE";
    SUBMITTING: "SUBMITTING";
    SYNCED: "SYNCED";
    FAILED: "FAILED";
    SKIPPED: "SKIPPED";
    VERIFIED: "VERIFIED";
}>;
export type InvoiceKraStatusType = z.infer<typeof invoiceKraStatusSchema>;
/**
 * Utility schemas used across invoice payloads.
 */
export declare const nullableStringSchema: z.ZodNullable<z.ZodOptional<z.ZodString>>;
export declare const nullableJsonSchema: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
export declare const nullableDateInputSchema: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
/** KRA eTIMS fiscal footer + verification URL (customer-safe when synced). */
export declare const etimsFiscalFieldsSchema: z.ZodObject<{
    rcptSign: z.ZodString;
    intrlData: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    curRcptNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    totRcptNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sdcDateTime: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sdcDateTimeDisplay: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    verificationUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type EtimsFiscalFieldsType = z.infer<typeof etimsFiscalFieldsSchema>;
export declare const invoiceKraFieldsSchema: z.ZodObject<{
    kraInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraReceiptNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSignature: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraQrCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraVerifiedDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    kraStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        PENDING: "PENDING";
        NOT_APPLICABLE: "NOT_APPLICABLE";
        SUBMITTING: "SUBMITTING";
        SYNCED: "SYNCED";
        FAILED: "FAILED";
        SKIPPED: "SKIPPED";
        VERIFIED: "VERIFIED";
    }>>>;
    kraError: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSubmittedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    kraLastAttemptAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    kraAttemptCount: z.ZodOptional<z.ZodNumber>;
    kraVerificationUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSyncPayload: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    kraSyncResponse: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
}, z.core.$strip>;
/**
 * Line item schema – sent from the client when creating/updating invoices.
 * Amount-related fields are strings to avoid floating point issues.
 */
export declare const invoiceLineItemInputSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    position: z.ZodDefault<z.ZodNumber>;
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    price: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    discount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    total: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
}, z.core.$strip>;
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemInputSchema>;
export declare const invoiceLineItemOutputSchema: z.ZodObject<{
    position: z.ZodDefault<z.ZodNumber>;
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    price: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    discount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    total: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type InvoiceLineItem = z.infer<typeof invoiceLineItemOutputSchema>;
/**
 * Activity log schema shape shared across invoice entities.
 */
export declare const activityLogSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    action: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    ipAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    userAgent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type ActivityLogEntry = z.infer<typeof activityLogSchema>;
/**
 * Invoice transaction schemas.
 */
export declare const invoiceTransactionInputSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    invoiceId: z.ZodString;
    reference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    providerReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        PENDING: "PENDING";
        FAILED: "FAILED";
        COMPLETED: "COMPLETED";
        REFUNDED: "REFUNDED";
    }>>;
    method: z.ZodEnum<{
        BANK_TRANSFER: "BANK_TRANSFER";
        MPESA: "MPESA";
        CHEQUE: "CHEQUE";
        CASH: "CASH";
        CARD: "CARD";
        OTHER: "OTHER";
    }>;
    amount: z.ZodString;
    currency: z.ZodDefault<z.ZodString>;
    paidAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    balanceBefore: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    balanceAfter: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    recordedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type InvoiceTransactionInput = z.infer<typeof invoiceTransactionInputSchema>;
export declare const invoiceTransactionOutputSchema: z.ZodObject<{
    invoiceId: z.ZodString;
    reference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    providerReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    method: z.ZodEnum<{
        BANK_TRANSFER: "BANK_TRANSFER";
        MPESA: "MPESA";
        CHEQUE: "CHEQUE";
        CASH: "CASH";
        CARD: "CARD";
        OTHER: "OTHER";
    }>;
    amount: z.ZodString;
    currency: z.ZodDefault<z.ZodString>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    balanceBefore: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    balanceAfter: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    recordedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    id: z.ZodString;
    status: z.ZodEnum<{
        PENDING: "PENDING";
        FAILED: "FAILED";
        COMPLETED: "COMPLETED";
        REFUNDED: "REFUNDED";
    }>;
    paidAt: z.ZodNullable<z.ZodDate>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    activityLogs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        action: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        ipAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        userAgent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        createdAt: z.ZodDate;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type InvoiceTransaction = z.infer<typeof invoiceTransactionOutputSchema>;
/**
 * Credit note schemas.
 */
export declare const creditNoteInputSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    invoiceId: z.ZodString;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    creditNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        DRAFT: "DRAFT";
        ISSUED: "ISSUED";
        APPLIED: "APPLIED";
        VOIDED: "VOIDED";
    }>>;
    amount: z.ZodString;
    currency: z.ZodDefault<z.ZodString>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    issuedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    appliedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    createdBy: z.ZodString;
    updatedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreditNoteInput = z.infer<typeof creditNoteInputSchema>;
export declare const creditNoteOutputSchema: z.ZodObject<{
    invoiceId: z.ZodString;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    creditNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amount: z.ZodString;
    currency: z.ZodDefault<z.ZodString>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    createdBy: z.ZodString;
    updatedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    id: z.ZodString;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        ISSUED: "ISSUED";
        APPLIED: "APPLIED";
        VOIDED: "VOIDED";
    }>;
    issuedAt: z.ZodNullable<z.ZodDate>;
    appliedAt: z.ZodNullable<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    activityLogs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        action: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        ipAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        userAgent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        createdAt: z.ZodDate;
    }, z.core.$strip>>>;
    kraRefundReasonCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    originalInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraReceiptNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSignature: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraQrCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraVerifiedDate: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    kraStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        PENDING: "PENDING";
        NOT_APPLICABLE: "NOT_APPLICABLE";
        SUBMITTING: "SUBMITTING";
        SYNCED: "SYNCED";
        FAILED: "FAILED";
        SKIPPED: "SKIPPED";
        VERIFIED: "VERIFIED";
    }>>>;
    kraError: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSubmittedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    kraLastAttemptAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    kraAttemptCount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    kraVerificationUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSyncPayload: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    kraSyncResponse: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
}, z.core.$strip>;
export type CreditNote = z.infer<typeof creditNoteOutputSchema>;
export declare const creditNoteSummarySchema: z.ZodObject<{
    id: z.ZodString;
    creditNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    invoiceId: z.ZodString;
    invoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        ISSUED: "ISSUED";
        APPLIED: "APPLIED";
        VOIDED: "VOIDED";
    }>;
    amount: z.ZodString;
    currency: z.ZodString;
    issuedAt: z.ZodNullable<z.ZodDate>;
    kraStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        PENDING: "PENDING";
        NOT_APPLICABLE: "NOT_APPLICABLE";
        SUBMITTING: "SUBMITTING";
        SYNCED: "SYNCED";
        FAILED: "FAILED";
        SKIPPED: "SKIPPED";
        VERIFIED: "VERIFIED";
    }>>>;
    originalInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type CreditNoteSummary = z.infer<typeof creditNoteSummarySchema>;
export declare const creditNoteListFiltersSchema: z.ZodObject<{
    teamId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: "DRAFT";
        ISSUED: "ISSUED";
        APPLIED: "APPLIED";
        VOIDED: "VOIDED";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type CreditNoteListFilters = z.infer<typeof creditNoteListFiltersSchema>;
export declare const creditNoteListResponseSchema: z.ZodObject<{
    creditNotes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        creditNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        invoiceId: z.ZodString;
        invoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodEnum<{
            DRAFT: "DRAFT";
            ISSUED: "ISSUED";
            APPLIED: "APPLIED";
            VOIDED: "VOIDED";
        }>;
        amount: z.ZodString;
        currency: z.ZodString;
        issuedAt: z.ZodNullable<z.ZodDate>;
        kraStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
            PENDING: "PENDING";
            NOT_APPLICABLE: "NOT_APPLICABLE";
            SUBMITTING: "SUBMITTING";
            SYNCED: "SYNCED";
            FAILED: "FAILED";
            SKIPPED: "SKIPPED";
            VERIFIED: "VERIFIED";
        }>>>;
        originalInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        createdAt: z.ZodDate;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export declare const creditNoteDetailSchema: z.ZodObject<{
    invoiceId: z.ZodString;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    creditNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amount: z.ZodString;
    currency: z.ZodDefault<z.ZodString>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    createdBy: z.ZodString;
    updatedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    id: z.ZodString;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        ISSUED: "ISSUED";
        APPLIED: "APPLIED";
        VOIDED: "VOIDED";
    }>;
    issuedAt: z.ZodNullable<z.ZodDate>;
    appliedAt: z.ZodNullable<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    activityLogs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        action: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        ipAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        userAgent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        createdAt: z.ZodDate;
    }, z.core.$strip>>>;
    kraRefundReasonCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    originalInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraReceiptNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSignature: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraQrCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraVerifiedDate: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    kraStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        PENDING: "PENDING";
        NOT_APPLICABLE: "NOT_APPLICABLE";
        SUBMITTING: "SUBMITTING";
        SYNCED: "SYNCED";
        FAILED: "FAILED";
        SKIPPED: "SKIPPED";
        VERIFIED: "VERIFIED";
    }>>>;
    kraError: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSubmittedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    kraLastAttemptAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    kraAttemptCount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    kraVerificationUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSyncPayload: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    kraSyncResponse: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    invoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    fromDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    customerDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    paymentDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    lineItems: z.ZodArray<z.ZodObject<{
        position: z.ZodDefault<z.ZodNumber>;
        name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        price: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        discount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        total: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, z.core.$strip>>;
    subtotal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tax: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    taxPercentage: z.ZodNullable<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    etimsFiscal: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        rcptSign: z.ZodString;
        intrlData: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        curRcptNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        totRcptNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        sdcDateTime: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        sdcDateTimeDisplay: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        verificationUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type CreditNoteDetail = z.infer<typeof creditNoteDetailSchema>;
export declare const issueCreditNoteInputSchema: z.ZodObject<{
    invoiceId: z.ZodString;
    rfdRsnCd: z.ZodEnum<{
        "01": "01";
        "02": "02";
        "03": "03";
        "04": "04";
        "05": "05";
        "06": "06";
    }>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type IssueCreditNoteInput = z.infer<typeof issueCreditNoteInputSchema>;
/**
 * Core invoice schemas.
 */
export declare const invoiceSnapshotSchema: z.ZodObject<{
    fromDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    customerDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    paymentDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    noteDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    template: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    topBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    bottomBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
}, z.core.$strip>;
export declare const invoiceCreateInputSchema: z.ZodObject<{
    fromDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    customerDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    paymentDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    noteDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    template: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    topBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    bottomBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    status: z.ZodDefault<z.ZodEnum<{
        DRAFT: "DRAFT";
        SENT: "SENT";
        CANCELLED: "CANCELLED";
        PARTIALLY_PAID: "PARTIALLY_PAID";
        PAID: "PAID";
        OVERDUE: "OVERDUE";
        WRITTEN_OFF: "WRITTEN_OFF";
    }>>;
    token: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        position: z.ZodDefault<z.ZodNumber>;
        name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        price: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        discount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        total: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    }, z.core.$strip>>>>;
    transactions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        invoiceId: z.ZodString;
        reference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        providerReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodDefault<z.ZodEnum<{
            PENDING: "PENDING";
            FAILED: "FAILED";
            COMPLETED: "COMPLETED";
            REFUNDED: "REFUNDED";
        }>>;
        method: z.ZodEnum<{
            BANK_TRANSFER: "BANK_TRANSFER";
            MPESA: "MPESA";
            CHEQUE: "CHEQUE";
            CASH: "CASH";
            CARD: "CARD";
            OTHER: "OTHER";
        }>;
        amount: z.ZodString;
        currency: z.ZodDefault<z.ZodString>;
        paidAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        balanceBefore: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        balanceAfter: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        recordedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>>>;
    creditNote: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        invoiceId: z.ZodString;
        teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        creditNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodDefault<z.ZodEnum<{
            DRAFT: "DRAFT";
            ISSUED: "ISSUED";
            APPLIED: "APPLIED";
            VOIDED: "VOIDED";
        }>>;
        amount: z.ZodString;
        currency: z.ZodDefault<z.ZodString>;
        reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        issuedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
        appliedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
        createdBy: z.ZodString;
        updatedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
    kraInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraReceiptNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSignature: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraQrCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraVerifiedDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    kraStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        PENDING: "PENDING";
        NOT_APPLICABLE: "NOT_APPLICABLE";
        SUBMITTING: "SUBMITTING";
        SYNCED: "SYNCED";
        FAILED: "FAILED";
        SKIPPED: "SKIPPED";
        VERIFIED: "VERIFIED";
    }>>>;
    kraError: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSubmittedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    kraLastAttemptAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    kraAttemptCount: z.ZodOptional<z.ZodNumber>;
    kraVerificationUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSyncPayload: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    kraSyncResponse: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    id: z.ZodOptional<z.ZodString>;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    invoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    subtotal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tax: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    taxPercentage: z.ZodNullable<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    vat: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    discount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    currency: z.ZodDefault<z.ZodString>;
    creditedAmount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    creditBalance: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    issueDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    paidAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    sentAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    reminderSentAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    viewedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    internalNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    createdBy: z.ZodString;
    updatedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type InvoiceCreateInput = z.infer<typeof invoiceCreateInputSchema>;
export declare const invoiceUpdateInputSchema: z.ZodObject<{
    fromDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    customerDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    paymentDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    noteDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    template: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    topBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    bottomBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    status: z.ZodDefault<z.ZodEnum<{
        DRAFT: "DRAFT";
        SENT: "SENT";
        CANCELLED: "CANCELLED";
        PARTIALLY_PAID: "PARTIALLY_PAID";
        PAID: "PAID";
        OVERDUE: "OVERDUE";
        WRITTEN_OFF: "WRITTEN_OFF";
    }>>;
    token: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    transactions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        invoiceId: z.ZodString;
        reference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        providerReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodDefault<z.ZodEnum<{
            PENDING: "PENDING";
            FAILED: "FAILED";
            COMPLETED: "COMPLETED";
            REFUNDED: "REFUNDED";
        }>>;
        method: z.ZodEnum<{
            BANK_TRANSFER: "BANK_TRANSFER";
            MPESA: "MPESA";
            CHEQUE: "CHEQUE";
            CASH: "CASH";
            CARD: "CARD";
            OTHER: "OTHER";
        }>;
        amount: z.ZodString;
        currency: z.ZodDefault<z.ZodString>;
        paidAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        balanceBefore: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        balanceAfter: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        recordedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>>>;
    creditNote: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        invoiceId: z.ZodString;
        teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        creditNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodDefault<z.ZodEnum<{
            DRAFT: "DRAFT";
            ISSUED: "ISSUED";
            APPLIED: "APPLIED";
            VOIDED: "VOIDED";
        }>>;
        amount: z.ZodString;
        currency: z.ZodDefault<z.ZodString>;
        reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        issuedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
        appliedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
        createdBy: z.ZodString;
        updatedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
    kraInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraReceiptNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSignature: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraQrCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraVerifiedDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    kraStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        PENDING: "PENDING";
        NOT_APPLICABLE: "NOT_APPLICABLE";
        SUBMITTING: "SUBMITTING";
        SYNCED: "SYNCED";
        FAILED: "FAILED";
        SKIPPED: "SKIPPED";
        VERIFIED: "VERIFIED";
    }>>>;
    kraError: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSubmittedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    kraLastAttemptAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    kraAttemptCount: z.ZodOptional<z.ZodNumber>;
    kraVerificationUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSyncPayload: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    kraSyncResponse: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    invoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    subtotal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tax: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    taxPercentage: z.ZodNullable<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    vat: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    discount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    currency: z.ZodDefault<z.ZodString>;
    creditedAmount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    creditBalance: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    issueDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    paidAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    sentAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    reminderSentAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    viewedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    internalNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    id: z.ZodString;
    lineItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        position: z.ZodDefault<z.ZodNumber>;
        name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        price: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        discount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        total: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateInputSchema>;
export declare const invoiceSummarySchema: z.ZodObject<{
    id: z.ZodString;
    invoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        SENT: "SENT";
        CANCELLED: "CANCELLED";
        PARTIALLY_PAID: "PARTIALLY_PAID";
        PAID: "PAID";
        OVERDUE: "OVERDUE";
        WRITTEN_OFF: "WRITTEN_OFF";
    }>;
    amount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    currency: z.ZodString;
    dueDate: z.ZodNullable<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    kraStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        PENDING: "PENDING";
        NOT_APPLICABLE: "NOT_APPLICABLE";
        SUBMITTING: "SUBMITTING";
        SYNCED: "SYNCED";
        FAILED: "FAILED";
        SKIPPED: "SKIPPED";
        VERIFIED: "VERIFIED";
    }>>>;
}, z.core.$strip>;
export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>;
export declare const invoiceDetailSchema: z.ZodObject<{
    id: z.ZodString;
    invoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        SENT: "SENT";
        CANCELLED: "CANCELLED";
        PARTIALLY_PAID: "PARTIALLY_PAID";
        PAID: "PAID";
        OVERDUE: "OVERDUE";
        WRITTEN_OFF: "WRITTEN_OFF";
    }>;
    amount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    currency: z.ZodString;
    dueDate: z.ZodNullable<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    kraStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        PENDING: "PENDING";
        NOT_APPLICABLE: "NOT_APPLICABLE";
        SUBMITTING: "SUBMITTING";
        SYNCED: "SYNCED";
        FAILED: "FAILED";
        SKIPPED: "SKIPPED";
        VERIFIED: "VERIFIED";
    }>>>;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    subtotal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tax: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    taxPercentage: z.ZodNullable<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    vat: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    discount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    creditedAmount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    creditBalance: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    issueDate: z.ZodNullable<z.ZodDate>;
    paidAt: z.ZodNullable<z.ZodDate>;
    sentAt: z.ZodNullable<z.ZodDate>;
    reminderSentAt: z.ZodNullable<z.ZodDate>;
    viewedAt: z.ZodNullable<z.ZodDate>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    internalNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    lineItems: z.ZodArray<z.ZodObject<{
        position: z.ZodDefault<z.ZodNumber>;
        name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        price: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        discount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        total: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, z.core.$strip>>;
    transactions: z.ZodArray<z.ZodObject<{
        invoiceId: z.ZodString;
        reference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        providerReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        method: z.ZodEnum<{
            BANK_TRANSFER: "BANK_TRANSFER";
            MPESA: "MPESA";
            CHEQUE: "CHEQUE";
            CASH: "CASH";
            CARD: "CARD";
            OTHER: "OTHER";
        }>;
        amount: z.ZodString;
        currency: z.ZodDefault<z.ZodString>;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        balanceBefore: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        balanceAfter: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        recordedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        id: z.ZodString;
        status: z.ZodEnum<{
            PENDING: "PENDING";
            FAILED: "FAILED";
            COMPLETED: "COMPLETED";
            REFUNDED: "REFUNDED";
        }>;
        paidAt: z.ZodNullable<z.ZodDate>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        activityLogs: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            userId: z.ZodString;
            action: z.ZodString;
            description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
            ipAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            userAgent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            createdAt: z.ZodDate;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    creditNote: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        invoiceId: z.ZodString;
        teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        creditNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        amount: z.ZodString;
        currency: z.ZodDefault<z.ZodString>;
        reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        createdBy: z.ZodString;
        updatedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        id: z.ZodString;
        status: z.ZodEnum<{
            DRAFT: "DRAFT";
            ISSUED: "ISSUED";
            APPLIED: "APPLIED";
            VOIDED: "VOIDED";
        }>;
        issuedAt: z.ZodNullable<z.ZodDate>;
        appliedAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        activityLogs: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            userId: z.ZodString;
            action: z.ZodString;
            description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
            ipAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            userAgent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            createdAt: z.ZodDate;
        }, z.core.$strip>>>;
        kraRefundReasonCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        originalInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        kraInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        kraReceiptNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        kraSignature: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        kraQrCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        kraVerifiedDate: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
        kraStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
            PENDING: "PENDING";
            NOT_APPLICABLE: "NOT_APPLICABLE";
            SUBMITTING: "SUBMITTING";
            SYNCED: "SYNCED";
            FAILED: "FAILED";
            SKIPPED: "SKIPPED";
            VERIFIED: "VERIFIED";
        }>>>;
        kraError: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        kraSubmittedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
        kraLastAttemptAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
        kraAttemptCount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        kraVerificationUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        kraSyncPayload: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        kraSyncResponse: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    }, z.core.$strip>>>;
    activityLogs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        action: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        ipAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        userAgent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        createdAt: z.ZodDate;
    }, z.core.$strip>>>;
    fromDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    customerDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    paymentDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    noteDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    template: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    topBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    bottomBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    kraInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraReceiptNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSignature: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraQrCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraVerifiedDate: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    kraError: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSubmittedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    kraLastAttemptAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    kraAttemptCount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    kraVerificationUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSyncPayload: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    kraSyncResponse: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    etimsFiscal: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        rcptSign: z.ZodString;
        intrlData: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        curRcptNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        totRcptNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        sdcDateTime: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        sdcDateTimeDisplay: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        verificationUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type InvoiceDetail = z.infer<typeof invoiceDetailSchema>;
/**
 * Helper schemas for filtering and pagination.
 */
export declare const invoiceListFiltersSchema: z.ZodObject<{
    teamId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: "DRAFT";
        SENT: "SENT";
        CANCELLED: "CANCELLED";
        PARTIALLY_PAID: "PARTIALLY_PAID";
        PAID: "PAID";
        OVERDUE: "OVERDUE";
        WRITTEN_OFF: "WRITTEN_OFF";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type InvoiceListFilters = z.infer<typeof invoiceListFiltersSchema>;
export declare const invoiceListResponseSchema: z.ZodObject<{
    invoices: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        invoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodEnum<{
            DRAFT: "DRAFT";
            SENT: "SENT";
            CANCELLED: "CANCELLED";
            PARTIALLY_PAID: "PARTIALLY_PAID";
            PAID: "PAID";
            OVERDUE: "OVERDUE";
            WRITTEN_OFF: "WRITTEN_OFF";
        }>;
        amount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        currency: z.ZodString;
        dueDate: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        kraStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
            PENDING: "PENDING";
            NOT_APPLICABLE: "NOT_APPLICABLE";
            SUBMITTING: "SUBMITTING";
            SYNCED: "SYNCED";
            FAILED: "FAILED";
            SKIPPED: "SKIPPED";
            VERIFIED: "VERIFIED";
        }>>>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export type InvoiceListResponse = z.infer<typeof invoiceListResponseSchema>;
/**
 * Update payment input – complete (use invoice total) or partial (supply amountPaid).
 */
export declare const updatePaymentInputSchema: z.ZodObject<{
    invoiceId: z.ZodString;
    type: z.ZodEnum<{
        PARTIAL: "PARTIAL";
        COMPLETE: "COMPLETE";
    }>;
    amountPaid: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentInputSchema>;
/**
 * Schema for next invoice number response
 */
export declare const nextInvoiceNumberSchema: z.ZodObject<{
    invoiceNumber: z.ZodString;
    nextNumber: z.ZodNumber;
}, z.core.$strip>;
export type NextInvoiceNumber = z.infer<typeof nextInvoiceNumberSchema>;
/**
 * Schema for submitting invoice with PDF for email delivery
 * createdBy and updatedBy are optional here as they are set from authenticated user context
 */
export declare const submitInvoiceSchema: z.ZodObject<{
    fromDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    customerDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    paymentDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    noteDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    template: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    topBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    bottomBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    status: z.ZodDefault<z.ZodEnum<{
        DRAFT: "DRAFT";
        SENT: "SENT";
        CANCELLED: "CANCELLED";
        PARTIALLY_PAID: "PARTIALLY_PAID";
        PAID: "PAID";
        OVERDUE: "OVERDUE";
        WRITTEN_OFF: "WRITTEN_OFF";
    }>>;
    token: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        position: z.ZodDefault<z.ZodNumber>;
        name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        price: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        discount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        total: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    }, z.core.$strip>>>>;
    transactions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        invoiceId: z.ZodString;
        reference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        providerReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodDefault<z.ZodEnum<{
            PENDING: "PENDING";
            FAILED: "FAILED";
            COMPLETED: "COMPLETED";
            REFUNDED: "REFUNDED";
        }>>;
        method: z.ZodEnum<{
            BANK_TRANSFER: "BANK_TRANSFER";
            MPESA: "MPESA";
            CHEQUE: "CHEQUE";
            CASH: "CASH";
            CARD: "CARD";
            OTHER: "OTHER";
        }>;
        amount: z.ZodString;
        currency: z.ZodDefault<z.ZodString>;
        paidAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        balanceBefore: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        balanceAfter: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        recordedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>>>;
    creditNote: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        invoiceId: z.ZodString;
        teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        creditNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodDefault<z.ZodEnum<{
            DRAFT: "DRAFT";
            ISSUED: "ISSUED";
            APPLIED: "APPLIED";
            VOIDED: "VOIDED";
        }>>;
        amount: z.ZodString;
        currency: z.ZodDefault<z.ZodString>;
        reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
        issuedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
        appliedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
        createdBy: z.ZodString;
        updatedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
    kraInvoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraReceiptNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSignature: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraQrCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraVerifiedDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    kraStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        PENDING: "PENDING";
        NOT_APPLICABLE: "NOT_APPLICABLE";
        SUBMITTING: "SUBMITTING";
        SYNCED: "SYNCED";
        FAILED: "FAILED";
        SKIPPED: "SKIPPED";
        VERIFIED: "VERIFIED";
    }>>>;
    kraError: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSubmittedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    kraLastAttemptAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    kraAttemptCount: z.ZodOptional<z.ZodNumber>;
    kraVerificationUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    kraSyncPayload: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    kraSyncResponse: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    id: z.ZodOptional<z.ZodString>;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    invoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    subtotal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tax: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    taxPercentage: z.ZodNullable<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    vat: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    discount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    currency: z.ZodDefault<z.ZodString>;
    creditedAmount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    creditBalance: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    issueDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    paidAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    sentAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    reminderSentAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    viewedAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    internalNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    pdfBase64: z.ZodOptional<z.ZodString>;
    billingEmail: z.ZodString;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SubmitInvoiceInput = z.infer<typeof submitInvoiceSchema>;
/**
 * Schema for Team eTIMS settings
 */
export declare const teamETimsSettingsSchema: z.ZodObject<{
    id: z.ZodString;
    teamId: z.ZodString;
    kraPin: z.ZodString;
    branchId: z.ZodString;
    deviceSerialNumber: z.ZodString;
    cmcKey: z.ZodNullable<z.ZodString>;
    isInitialized: z.ZodBoolean;
    isSandbox: z.ZodBoolean;
    lastSyncAt: z.ZodNullable<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type TeamETimsSettings = z.infer<typeof teamETimsSettingsSchema>;
/**
 * Schema for initial eTIMS setup/initialization
 */
export declare const initializeETimsSchema: z.ZodObject<{
    teamId: z.ZodString;
    kraPin: z.ZodString;
    branchId: z.ZodDefault<z.ZodString>;
    deviceSerialNumber: z.ZodString;
    isSandbox: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type InitializeETimsInput = z.infer<typeof initializeETimsSchema>;
/**
 * Schema for updating eTIMS settings
 */
export declare const updateETimsSettingsSchema: z.ZodObject<{
    teamId: z.ZodString;
    kraPin: z.ZodOptional<z.ZodString>;
    branchId: z.ZodOptional<z.ZodString>;
    deviceSerialNumber: z.ZodOptional<z.ZodString>;
    isSandbox: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
/**
 * Schema for Team eTIMS Item
 */
export declare const teamETimsItemSchema: z.ZodObject<{
    id: z.ZodString;
    teamId: z.ZodString;
    itemCd: z.ZodString;
    itemClsCd: z.ZodString;
    itemNm: z.ZodString;
    itemClsNm: z.ZodNullable<z.ZodString>;
    taxTyCd: z.ZodString;
    pkgUnitCd: z.ZodString;
    qtyUnitCd: z.ZodString;
    prc: z.ZodNullable<z.ZodString>;
    isService: z.ZodBoolean;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type TeamETimsItem = z.infer<typeof teamETimsItemSchema>;
export declare const registerETimsItemSchema: z.ZodObject<{
    teamId: z.ZodString;
    itemCd: z.ZodString;
    itemClsCd: z.ZodString;
    itemNm: z.ZodString;
    taxTyCd: z.ZodDefault<z.ZodString>;
    pkgUnitCd: z.ZodDefault<z.ZodString>;
    qtyUnitCd: z.ZodDefault<z.ZodString>;
    prc: z.ZodOptional<z.ZodString>;
    isService: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type RegisterETimsItemInput = z.infer<typeof registerETimsItemSchema>;
/**
 * Schema for Team eTIMS Branch
 */
export declare const teamETimsBranchSchema: z.ZodObject<{
    id: z.ZodString;
    teamId: z.ZodString;
    bhfId: z.ZodString;
    bhfNm: z.ZodString;
    bhfSttsCd: z.ZodString;
    addr: z.ZodNullable<z.ZodString>;
    mgrNm: z.ZodNullable<z.ZodString>;
    mgrTelNo: z.ZodNullable<z.ZodString>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type TeamETimsBranch = z.infer<typeof teamETimsBranchSchema>;
