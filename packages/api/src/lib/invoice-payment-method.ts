export type InvoicePaymentMethod =
  | "BANK_TRANSFER"
  | "MPESA"
  | "CHEQUE"
  | "CASH"
  | "CARD"
  | "OTHER";

const PAYMENT_METHODS = new Set<string>([
  "BANK_TRANSFER",
  "MPESA",
  "CHEQUE",
  "CASH",
  "CARD",
  "OTHER",
]);

/** Map invoice `paymentDetails` JSON to a canonical payment method enum value. */
export function paymentMethodFromDetails(paymentDetails: unknown): InvoicePaymentMethod | null {
  if (!paymentDetails || typeof paymentDetails !== "object") return null;
  const pd = paymentDetails as Record<string, unknown>;
  const raw = pd.method ?? pd.paymentMethod;
  if (typeof raw !== "string" || !raw.trim()) return null;

  const normalized = raw.trim().toUpperCase().replace(/-/g, "_").replace(/\s+/g, "_");
  if (normalized === "BANK" || normalized === "BANK_TRANSFER") return "BANK_TRANSFER";
  if (normalized === "MPESA" || normalized === "M_PESA") return "MPESA";
  if (normalized === "CHEQUE") return "CHEQUE";
  if (normalized === "CASH") return "CASH";
  if (normalized === "CARD" || normalized === "JENGA") return "CARD";
  if (PAYMENT_METHODS.has(normalized)) return normalized as InvoicePaymentMethod;
  return null;
}

/** Map payment_transaction.gateway → invoice payment method for paid checkout invoices. */
export function invoicePaymentMethodFromGateway(
  gateway: string | null | undefined,
): InvoicePaymentMethod | null {
  const g = (gateway ?? "").trim().toUpperCase();
  if (g === "MPESA") return "MPESA";
  if (g === "JENGA") return "CARD";
  if (g === "OTHER") return "OTHER";
  if (g === "STRIPE" || g === "PAYPAL" || g === "FLUTTERWAVE") return "CARD";
  return null;
}

/** Prefer transaction method; fall back to invoice payment instructions (agency UI source). */
export function resolveInvoicePaymentMethod(
  transactionMethod: string | null | undefined,
  paymentDetails: unknown,
): InvoicePaymentMethod {
  if (transactionMethod && transactionMethod !== "OTHER" && PAYMENT_METHODS.has(transactionMethod)) {
    return transactionMethod as InvoicePaymentMethod;
  }
  return paymentMethodFromDetails(paymentDetails) ?? "OTHER";
}

export type GatewayPaymentForInvoice = {
  id: string;
  amount: string;
  paidAmount?: string | null;
  currency: string | null;
  gateway: string | null;
  receiptNumber?: string | null;
  checkoutRequestId?: string | null;
  gatewayTransactionId?: string | null;
  status: string | null;
  notes?: string | null;
  userId?: string | null;
  processedAt?: Date | null;
  initiatedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export function invoicePaymentStatusFromGateway(
  status: string | null | undefined,
): "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" {
  const s = (status ?? "").trim().toUpperCase();
  if (s === "SUCCESS") return "COMPLETED";
  if (s === "REFUNDED" || s === "PARTIALLY_REFUNDED") return "REFUNDED";
  if (s === "FAILED" || s === "CANCELLED") return "FAILED";
  return "PENDING";
}

export function mapGatewayPaymentToInvoiceTransaction(
  invoiceId: string,
  payment: GatewayPaymentForInvoice,
) {
  const now = new Date();
  return {
    id: payment.id,
    invoiceId,
    reference: payment.receiptNumber || payment.checkoutRequestId || null,
    providerReference:
      payment.gatewayTransactionId || payment.checkoutRequestId || payment.id,
    status: invoicePaymentStatusFromGateway(payment.status),
    method: invoicePaymentMethodFromGateway(payment.gateway) ?? "OTHER",
    amount: payment.paidAmount || payment.amount,
    currency: payment.currency || "KES",
    paidAt: payment.processedAt ?? payment.initiatedAt ?? now,
    notes: payment.notes ?? null,
    recordedBy: payment.userId ?? null,
    createdAt: payment.createdAt ?? now,
    updatedAt: payment.updatedAt ?? now,
    activityLogs: [] as unknown[],
  };
}
