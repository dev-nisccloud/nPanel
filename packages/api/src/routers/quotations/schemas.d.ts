import { z } from "zod";
/**
 * Quotation API schemas – independent of DB/Prisma.
 * Used for validation and typing only.
 */
export declare const quotationStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    SENT: "SENT";
    ACCEPTED: "ACCEPTED";
    EXPIRED: "EXPIRED";
    DECLINED: "DECLINED";
    CANCELLED: "CANCELLED";
}>;
export type QuotationStatusType = z.infer<typeof quotationStatusSchema>;
export declare const quotationLineItemInputSchema: z.ZodObject<{
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
export type QuotationLineItemInput = z.infer<typeof quotationLineItemInputSchema>;
export declare const quotationLineItemOutputSchema: z.ZodObject<{
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
export type QuotationLineItem = z.infer<typeof quotationLineItemOutputSchema>;
export declare const quotationActivityLogSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    action: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    ipAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    userAgent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type QuotationActivityLogEntry = z.infer<typeof quotationActivityLogSchema>;
export declare const quotationCreateInputSchema: z.ZodObject<{
    fromDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    customerDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    noteDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    template: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    topBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    bottomBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    status: z.ZodDefault<z.ZodEnum<{
        DRAFT: "DRAFT";
        SENT: "SENT";
        ACCEPTED: "ACCEPTED";
        EXPIRED: "EXPIRED";
        DECLINED: "DECLINED";
        CANCELLED: "CANCELLED";
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
    id: z.ZodOptional<z.ZodString>;
    quotationNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    linkedUserId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    subtotal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tax: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    taxPercentage: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    vat: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    discount: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    currency: z.ZodDefault<z.ZodString>;
    issueDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    note: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    internalNote: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type QuotationCreateInput = z.infer<typeof quotationCreateInputSchema>;
export declare const quotationUpdateInputSchema: z.ZodObject<{
    fromDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    customerDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    noteDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    template: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    topBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    bottomBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
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
    quotationNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    linkedUserId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    token: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: "DRAFT";
        SENT: "SENT";
        ACCEPTED: "ACCEPTED";
        EXPIRED: "EXPIRED";
        DECLINED: "DECLINED";
        CANCELLED: "CANCELLED";
    }>>;
    amount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    subtotal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tax: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    taxPercentage: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    vat: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    discount: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    currency: z.ZodDefault<z.ZodString>;
    issueDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>]>>>;
    note: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    internalNote: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type QuotationUpdateInput = z.infer<typeof quotationUpdateInputSchema>;
export declare const quotationSummarySchema: z.ZodObject<{
    id: z.ZodString;
    quotationNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    linkedUserId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        SENT: "SENT";
        ACCEPTED: "ACCEPTED";
        EXPIRED: "EXPIRED";
        DECLINED: "DECLINED";
        CANCELLED: "CANCELLED";
    }>;
    amount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    subtotal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    currency: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type QuotationSummary = z.infer<typeof quotationSummarySchema>;
export declare const quotationDetailSchema: z.ZodObject<{
    id: z.ZodString;
    quotationNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    linkedUserId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        SENT: "SENT";
        ACCEPTED: "ACCEPTED";
        EXPIRED: "EXPIRED";
        DECLINED: "DECLINED";
        CANCELLED: "CANCELLED";
    }>;
    amount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    currency: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    subtotal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tax: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    taxPercentage: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    vat: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    discount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    issueDate: z.ZodNullable<z.ZodDate>;
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
    noteDetails: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    template: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    topBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
    bottomBlock: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown>]>>>;
}, z.core.$strip>;
export type QuotationDetail = z.infer<typeof quotationDetailSchema>;
export declare const quotationListFiltersSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: "DRAFT";
        SENT: "SENT";
        ACCEPTED: "ACCEPTED";
        EXPIRED: "EXPIRED";
        DECLINED: "DECLINED";
        CANCELLED: "CANCELLED";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    customerGroupKey: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type QuotationListFilters = z.infer<typeof quotationListFiltersSchema>;
export declare const quotationListResponseSchema: z.ZodObject<{
    quotations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        quotationNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        linkedUserId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        status: z.ZodEnum<{
            DRAFT: "DRAFT";
            SENT: "SENT";
            ACCEPTED: "ACCEPTED";
            EXPIRED: "EXPIRED";
            DECLINED: "DECLINED";
            CANCELLED: "CANCELLED";
        }>;
        amount: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        subtotal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        currency: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export type QuotationListResponse = z.infer<typeof quotationListResponseSchema>;
export declare const quotationCustomerSummarySchema: z.ZodObject<{
    customerGroupKey: z.ZodString;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quotationCount: z.ZodNumber;
    openCount: z.ZodNumber;
    lastQuotationAt: z.ZodNullable<z.ZodDate>;
}, z.core.$strip>;
export type QuotationCustomerSummary = z.infer<typeof quotationCustomerSummarySchema>;
export declare const quotationCustomersSummaryFiltersSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type QuotationCustomersSummaryFilters = z.infer<typeof quotationCustomersSummaryFiltersSchema>;
export declare const quotationCustomersSummaryResponseSchema: z.ZodObject<{
    customers: z.ZodArray<z.ZodObject<{
        customerGroupKey: z.ZodString;
        customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        customerEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        quotationCount: z.ZodNumber;
        openCount: z.ZodNumber;
        lastQuotationAt: z.ZodNullable<z.ZodDate>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type QuotationCustomersSummaryResponse = z.infer<typeof quotationCustomersSummaryResponseSchema>;
export declare const nextQuotationNumberSchema: z.ZodObject<{
    quotationNumber: z.ZodString;
    nextNumber: z.ZodNumber;
}, z.core.$strip>;
export type NextQuotationNumber = z.infer<typeof nextQuotationNumberSchema>;
export declare const sendQuotationEmailSchema: z.ZodObject<{
    quotationId: z.ZodString;
    toEmail: z.ZodString;
    pdfBase64: z.ZodString;
}, z.core.$strip>;
export type SendQuotationEmailInput = z.infer<typeof sendQuotationEmailSchema>;
