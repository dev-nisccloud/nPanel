import { z } from "zod";

/**
 * UI Layer Schemas for Dashboard
 * These schemas transform API/DB data for UI consumption
 */

// Helper to coerce date strings to Date objects
const dateCoerce = z.preprocess((val) => {
  if (val instanceof Date) return val;
  if (typeof val === 'string') return new Date(val);
  return val;
}, z.date());

const nullableDateCoerce = z.preprocess((val) => {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'string') return new Date(val);
  return val;
}, z.date().nullable());

// Invoice Transaction UI Schema
export const invoiceTransactionUiSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  invoiceNumber: z.string().nullable(),
  reference: z.string().nullable(),
  providerReference: z.string().nullable(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]),
  method: z.enum(["BANK_TRANSFER", "MPESA", "CHEQUE", "CASH", "CARD", "OTHER"]),
  amount: z.string(),
  currency: z.string(),
  paidAt: nullableDateCoerce,
  createdAt: dateCoerce,
  updatedAt: dateCoerce,
});
export type InvoiceTransactionUI = z.infer<typeof invoiceTransactionUiSchema>;

// Payment Transaction UI Schema
export const paymentTransactionUiSchema = z.object({
  id: z.string(),
  userId: z.string(),
  teamId: z.string().nullable(),
  userName: z.string().nullable(),
  teamName: z.string().nullable().optional(),
  gateway: z.enum(["MPESA", "JENGA", "STRIPE", "PAYPAL", "FLUTTERWAVE", "OTHER"]),
  status: z.enum(["PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"]),
  amount: z.string(),
  currency: z.string(),
  accountReference: z.string().nullable(),
  transactionDesc: z.string().nullable(),
  receiptNumber: z.string().nullable(),
  initiatedAt: dateCoerce,
  processedAt: nullableDateCoerce,
  failedAt: nullableDateCoerce,
  createdAt: dateCoerce,
  updatedAt: dateCoerce,
});
export type PaymentTransactionUI = z.infer<typeof paymentTransactionUiSchema>;

// Invoice UI Schema (simplified for table)
export const invoiceUiSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string().nullable(),
  customerName: z.string().nullable(),
  customerEmail: z.string().nullable(),
  status: z.enum(["DRAFT", "SENT", "UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "WRITTEN_OFF"]),
  amount: z.string().nullable(),
  currency: z.string(),
  dueDate: nullableDateCoerce,
  createdAt: dateCoerce,
  updatedAt: dateCoerce,
});
export type InvoiceUI = z.infer<typeof invoiceUiSchema>;
