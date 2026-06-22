import { z } from "zod";
/**
 * API-layer schema for invoice and invoice line creation.
 * Independent of Prisma/DB. Use for auto-invoice and any API logic that creates invoices/lines.
 */
/** Invoice status – API enum, not tied to DB enum. */
export const invoiceStatusSchema = z.enum([
    "DRAFT",
    "SENT",
    "PARTIALLY_PAID",
    "PAID",
    "OVERDUE",
    "CANCELLED",
    "WRITTEN_OFF",
]);
const nullableString = z.string().optional().nullable();
/** Single invoice line item as used when creating (e.g. auto-invoice from Nisc order). */
export const invoiceLineItemCreateSchema = z.object({
    id: z.string().uuid(),
    invoiceId: z.string().uuid(),
    position: z.number().int().min(0),
    name: z.string().min(1),
    description: nullableString,
    quantity: z.number().int().min(0),
    price: z.string(),
    total: z.string(),
    metadata: z.record(z.unknown()).optional().nullable(),
});
