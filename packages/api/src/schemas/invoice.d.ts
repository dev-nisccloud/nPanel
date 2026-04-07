import { z } from "zod";
/**
 * API-layer schema for invoice and invoice line creation.
 * Independent of Prisma/DB. Use for auto-invoice and any API logic that creates invoices/lines.
 */
/** Invoice status – API enum, not tied to DB enum. */
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
/** Single invoice line item as used when creating (e.g. auto-invoice from Nisc order). */
export declare const invoiceLineItemCreateSchema: z.ZodObject<{
    id: z.ZodString;
    invoiceId: z.ZodString;
    position: z.ZodNumber;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodNumber;
    price: z.ZodString;
    total: z.ZodString;
}, z.core.$strip>;
export type InvoiceLineItemCreate = z.infer<typeof invoiceLineItemCreateSchema>;
