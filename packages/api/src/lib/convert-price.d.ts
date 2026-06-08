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
/** Whole-number string for M-Pesa / payment inputs. */
export declare function paymentTotalString(total: number): string;
