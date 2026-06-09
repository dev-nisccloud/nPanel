import type { KenicCardItem } from "./kenic-schema.ts";
import type { DomainSearchResult } from "./types.ts";

interface PricedFees {
  createFinal: number;
  createCalc: {
    marginAmount: number;
    marginType: string | null;
    marginValue: string | null;
    currency: string;
  };
}

/** Kenic card + margin-applied price → cart-ready DomainSearchResult (matches dashboard). */
export function kenicItemToDomainSearchResult(
  item: KenicCardItem,
  priced: PricedFees,
): DomainSearchResult {
  const currency = item.currency || "KES";
  return {
    domain: item.domain,
    status: item.available ? "free" : "taken",
    reason: item.reason,
    price: {
      product: { price: priced.createFinal, currency },
      reseller: { price: priced.createFinal, currency },
      calculated: {
        originalPrice: item.createPrice ?? 0,
        marginAmount: priced.createCalc.marginAmount,
        finalPrice: priced.createFinal,
        currency,
        marginType: priced.createCalc.marginType,
        marginValue: priced.createCalc.marginValue,
      },
    },
  };
}
