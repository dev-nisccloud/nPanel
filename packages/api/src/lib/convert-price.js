/**
 * Round a converted price up to the nearest whole number.
 * Never rounds down - fractional amounts always ceil to protect revenue.
 */
export function ceilConvertedPrice(amount) {
    if (!Number.isFinite(amount))
        return 0;
    return Math.ceil(amount);
}
/**
 * Apply an exchange rate and ceil when the source and target currencies differ.
 */
export function convertPriceWithCeil(amount, fromCurrency, toCurrency, rate) {
    if (!Number.isFinite(amount))
        return 0;
    if (fromCurrency === toCurrency)
        return amount;
    return ceilConvertedPrice(amount * rate);
}
/** VAT and inc-VAT total with VAT always rounded up (never down). */
export function computeCeilVatTotals(subtotalExVat, vatRate = 0.16) {
    const subtotal = Number.isFinite(subtotalExVat) ? subtotalExVat : 0;
    const vatAmount = ceilConvertedPrice(subtotal * vatRate);
    return {
        subtotalExVat: subtotal,
        vatAmount,
        totalIncVat: subtotal + vatAmount,
    };
}
/** Whole-number string for M-Pesa / payment inputs. */
export function paymentTotalString(total) {
    return String(ceilConvertedPrice(total));
}
