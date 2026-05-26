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

  const normalized = raw.trim().toUpperCase().replace(/-/g, "_");
  if (normalized === "BANK" || normalized === "BANK_TRANSFER") return "BANK_TRANSFER";
  if (normalized === "MPESA") return "MPESA";
  if (normalized === "CHEQUE") return "CHEQUE";
  if (normalized === "CASH") return "CASH";
  if (normalized === "CARD") return "CARD";
  if (PAYMENT_METHODS.has(normalized)) return normalized as InvoicePaymentMethod;
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
