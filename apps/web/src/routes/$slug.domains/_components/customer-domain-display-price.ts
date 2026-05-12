import type { DomainSearchResult } from "@/hooks/use-domain-search";

/**
 * Customer domain search: single retail price only after `useDomainPricing.calculatePricesBatch`
 * has attached `price.calculated` with margin on `finalPrice`, and FX on `convertedPrice` when
 * the displayed currency differs from the registrar currency.
 */
export function getCustomerRetailDisplayPrice(
  result: DomainSearchResult
): { displayPrice: number | undefined; displayCurrency: string | undefined } {
  if (result.status !== "free") {
    return { displayPrice: undefined, displayCurrency: undefined };
  }
  const reseller = result.price?.reseller;
  if (reseller?.price == null || typeof reseller.price !== "number" || Number.isNaN(reseller.price)) {
    return { displayPrice: undefined, displayCurrency: undefined };
  }

  const c = result.price?.calculated as
    | {
        finalPrice?: number;
        convertedPrice?: number;
        displayCurrency?: string;
        currency?: string;
      }
    | undefined;

  if (!c || typeof c.finalPrice !== "number" || Number.isNaN(c.finalPrice)) {
    return { displayPrice: undefined, displayCurrency: undefined };
  }

  const resellerCur = reseller.currency ?? "USD";
  const showingConverted =
    typeof c.displayCurrency === "string" &&
    c.displayCurrency.length > 0 &&
    c.displayCurrency !== resellerCur;

  if (showingConverted) {
    if (typeof c.convertedPrice !== "number" || Number.isNaN(c.convertedPrice)) {
      return { displayPrice: undefined, displayCurrency: undefined };
    }
    return { displayPrice: c.convertedPrice, displayCurrency: c.displayCurrency };
  }

  return {
    displayPrice: c.finalPrice,
    displayCurrency: c.currency ?? resellerCur,
  };
}
