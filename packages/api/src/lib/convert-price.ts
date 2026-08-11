/**
 * Round a converted price up to the nearest whole number.
 * Never rounds down - fractional amounts always ceil to protect revenue.
 */
export function ceilConvertedPrice(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.ceil(amount);
}

/**
 * Apply an exchange rate and ceil when the source and target currencies differ.
 */
export function convertPriceWithCeil(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number,
): number {
  if (!Number.isFinite(amount)) return 0;
  if (fromCurrency === toCurrency) return amount;
  return ceilConvertedPrice(amount * rate);
}

/** VAT and inc-VAT total with VAT always rounded up (never down). */
export function computeCeilVatTotals(
  subtotalExVat: number,
  vatRate = 0.16,
): { subtotalExVat: number; vatAmount: number; totalIncVat: number } {
  const subtotal = Number.isFinite(subtotalExVat) ? subtotalExVat : 0;
  const vatAmount = ceilConvertedPrice(subtotal * vatRate);
  return {
    subtotalExVat: subtotal,
    vatAmount,
    totalIncVat: subtotal + vatAmount,
  };
}

/**
 * Reverse a ceil-VAT total back to the largest whole ex-VAT amount that produces it.
 * Used when a paid STK amount (inc VAT) must be stored as an ex-VAT order line.
 */
export function reverseCeilVatToExVat(
  totalIncVat: number,
  vatRate = 0.16,
): number {
  const total = Number.isFinite(totalIncVat) ? Math.ceil(totalIncVat) : 0;
  if (total <= 0) return 0;
  let exVat = Math.floor(total / (1 + vatRate));
  while (exVat + ceilConvertedPrice(exVat * vatRate) < total) {
    exVat += 1;
  }
  while (exVat > 0 && exVat + ceilConvertedPrice(exVat * vatRate) > total) {
    exVat -= 1;
  }
  return Math.max(0, exVat);
}

/** Subscription agreed price = line ex-VAT + ceil VAT (what the customer pays for that line). */
export function agreedPriceIncVatFromExVat(
  exVatAmount: string | number | null | undefined,
  vatRate = 0.16,
): string {
  const n =
    typeof exVatAmount === "number"
      ? exVatAmount
      : Number.parseFloat(String(exVatAmount ?? "0"));
  if (!Number.isFinite(n) || n < 0) return "0";
  return paymentTotalString(computeCeilVatTotals(n, vatRate).totalIncVat);
}

/** Whole-number string for M-Pesa / payment inputs. */
export function paymentTotalString(total: number): string {
  return String(ceilConvertedPrice(total));
}
