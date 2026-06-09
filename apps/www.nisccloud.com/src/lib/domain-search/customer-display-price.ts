import type { DomainSearchResult } from "./types";

export function getCustomerRetailDisplayPrice(
  result: DomainSearchResult,
): { displayPrice: number | undefined; displayCurrency: string | undefined } {
  if (result.status !== "free") {
    return { displayPrice: undefined, displayCurrency: undefined };
  }
  const reseller = result.price?.reseller;
  if (reseller?.price == null || typeof reseller.price !== "number" || Number.isNaN(reseller.price)) {
    return { displayPrice: undefined, displayCurrency: undefined };
  }

  const c = result.price?.calculated;
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
