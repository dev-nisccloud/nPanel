"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const TLD_CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  KES: "KSh",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  INR: "₹",
  ZAR: "R",
  NGN: "₦",
};

export function formatTldPrice(price?: number, currency?: string): string {
  if (price == null || Number.isNaN(price)) return "N/A";

  const symbol =
    TLD_CURRENCY_SYMBOLS[currency || "USD"] || currency || "$";
  return `${symbol} ${priceFormatter.format(price)}`;
}

/** Cross-rate via USD base rates: amount in `from` → amount in `to`. */
export function convertWithUsdRates(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> | undefined
): number | null {
  if (!rates) return null;

  const from = (fromCurrency || "USD").toUpperCase();
  const to = (toCurrency || "USD").toUpperCase();

  if (from === to) return amount;

  if (from === "USD") {
    const rate = rates[to];
    return rate != null ? amount * rate : null;
  }

  if (to === "USD") {
    const rate = rates[from];
    return rate != null && rate !== 0 ? amount / rate : null;
  }

  const usdToFrom = rates[from];
  const usdToTo = rates[to];
  if (usdToFrom == null || usdToFrom === 0 || usdToTo == null) return null;
  return (amount / usdToFrom) * usdToTo;
}

export type ToKesFn = (amount: number, fromCurrency: string) => number | null;

/**
 * Fetch USD-base exchange rates once and expose a stable toKes converter.
 * Safe to call from the page and the details sheet (React Query caches the query).
 */
export function useTldKesConversion() {
  const { data: exchangeRates, isLoading } =
    trpc.currency.getExchangeRates.useQuery(
      { baseCurrency: "USD" },
      {
        staleTime: 6 * 60 * 60 * 1000,
        gcTime: 6 * 60 * 60 * 1000,
        refetchOnWindowFocus: false,
      }
    );

  const rates = exchangeRates?.success
    ? exchangeRates.data?.rates
    : undefined;

  const toKes = React.useCallback<ToKesFn>(
    (amount, fromCurrency) =>
      convertWithUsdRates(amount, fromCurrency, "KES", rates),
    [rates]
  );

  return {
    toKes,
    isLoadingRates: isLoading,
    ratesAvailable: Boolean(rates?.KES),
  };
}

/** Original price plus optional KES equivalent when source isn't already KES. */
export function formatPriceWithKes(
  price: number | undefined,
  currency: string | undefined,
  toKes: ToKesFn | undefined
): { primary: string; kes: string | null } {
  const primary = formatTldPrice(price, currency);
  if (price == null || !toKes) return { primary, kes: null };

  const from = (currency || "USD").toUpperCase();
  if (from === "KES") return { primary, kes: null };

  const kesAmount = toKes(price, from);
  if (kesAmount == null) return { primary, kes: null };

  return { primary, kes: formatTldPrice(kesAmount, "KES") };
}
