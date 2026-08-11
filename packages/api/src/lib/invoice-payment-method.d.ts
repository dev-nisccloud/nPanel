export type InvoicePaymentMethod = "BANK_TRANSFER" | "MPESA" | "CHEQUE" | "CASH" | "CARD" | "OTHER";
/** Map invoice `paymentDetails` JSON to a canonical payment method enum value. */
export declare function paymentMethodFromDetails(paymentDetails: unknown): InvoicePaymentMethod | null;
/** Map payment_transaction.gateway → invoice payment method for paid checkout invoices. */
export declare function invoicePaymentMethodFromGateway(gateway: string | null | undefined): InvoicePaymentMethod | null;
/** Prefer transaction method; fall back to invoice payment instructions (agency UI source). */
export declare function resolveInvoicePaymentMethod(transactionMethod: string | null | undefined, paymentDetails: unknown): InvoicePaymentMethod;
