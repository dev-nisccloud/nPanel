import * as React from "react";
import { useCurrency } from "@/components/providers/currency.tsx";
import { convertStorefrontAmount, formatCurrency } from "@/lib/currency.ts";

/** Formats a catalogue amount in the visitor's currency; null while the rate loads. */
export function useDisplayPrice() {
  const { currency, kesToCurrencyRate } = useCurrency();
  return React.useCallback(
    (amount: number, sourceCurrency = "KES") => {
      if (kesToCurrencyRate == null) return null;
      try {
        return formatCurrency(convertStorefrontAmount(amount, sourceCurrency, currency, kesToCurrencyRate), currency);
      } catch {
        return null;
      }
    },
    [currency, kesToCurrencyRate],
  );
}
