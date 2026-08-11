/**
 * Round a converted price up to the nearest whole number.
 * Never rounds down - fractional amounts always ceil to protect revenue.
 */
export declare function ceilConvertedPrice(amount: number): number;
/**
 * Apply an exchange rate and ceil when the source and target currencies differ.
 */
export declare function convertPriceWithCeil(amount: number, fromCurrency: string, toCurrency: string, rate: number): number;
/** VAT and inc-VAT total with VAT always rounded up (never down). */
export declare function computeCeilVatTotals(subtotalExVat: number, vatRate?: number): {
    subtotalExVat: number;
    vatAmount: number;
    totalIncVat: number;
};
/**
 * Reverse a ceil-VAT total back to the largest whole ex-VAT amount that produces it.
 * Used when a paid STK amount (inc VAT) must be stored as an ex-VAT order line.
 */
export declare function reverseCeilVatToExVat(totalIncVat: number, vatRate?: number): number;
/** Subscription agreed price = line ex-VAT + ceil VAT (what the customer pays for that line). */
export declare function agreedPriceIncVatFromExVat(exVatAmount: string | number | null | undefined, vatRate?: number): string;
/** Whole-number string for M-Pesa / payment inputs. */
export declare function paymentTotalString(total: number): string;
