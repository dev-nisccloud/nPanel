export const BUNDLE_TARGET_CURRENCY = "KES";
export const BUNDLE_GLOBAL_MARGIN_MULTIPLIER = 1.15;

export type BundleBasePrice = { amount: number; currency: string };

function ceilConvertedPrice(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.ceil(amount);
}

function convertPriceWithCeil(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number,
): number {
  if (!Number.isFinite(amount)) return 0;
  if (fromCurrency === toCurrency) return amount;
  return ceilConvertedPrice(amount * rate);
}

export function applyBundleGlobalMargin(totalBaseKes: number): number {
  return Math.ceil(totalBaseKes * BUNDLE_GLOBAL_MARGIN_MULTIPLIER);
}

export async function calculateBundleTotalKes(
  basePrices: BundleBasePrice[],
  convertPricesBatch: (
    prices: BundleBasePrice[],
    targetCurrency: string,
  ) => Promise<Array<{ convertedAmount?: number }>>,
): Promise<number | null> {
  if (basePrices.length === 0) return null;
  try {
    const converted = await convertPricesBatch(basePrices, BUNDLE_TARGET_CURRENCY);
    if (!converted?.length) return null;
    const totalBaseKes = converted.reduce((sum, c) => sum + (c.convertedAmount ?? 0), 0);
    if (totalBaseKes <= 0) return null;
    return applyBundleGlobalMargin(totalBaseKes);
  } catch {
    return null;
  }
}

export { convertPriceWithCeil, ceilConvertedPrice };
