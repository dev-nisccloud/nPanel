"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";

export type HivelocityProductType = "DEDICATED_SERVERS" | "VPS" | "VDS";

export type MarginType = "PERCENTAGE" | "FIXED";

export type PricingSettings = {
  marginType: MarginType | null;
  percentageMargin: string | null;
  fixedMargin: string | null;
  roundOff: string | null;
};

export function useHivelocityPricing(productType: HivelocityProductType) {
  const settingsQuery = trpc.hivelocityPricingSettings.get.useQuery({ productType });
  const ratesQuery = trpc.currency.getExchangeRates.useQuery(
    { baseCurrency: "USD" },
    {
      staleTime: 6 * 60 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  );

  const settings: PricingSettings | null = React.useMemo(() => {
    const raw = settingsQuery.data?.success ? (settingsQuery.data.data as any) : null;
    if (!raw) return null;
    return {
      marginType: (raw.marginType ?? null) as any,
      percentageMargin: raw.percentageMargin ?? null,
      fixedMargin: raw.fixedMargin ?? null,
      roundOff: raw.roundOff ?? null,
    };
  }, [settingsQuery.data]);

  const usdToKesRate = React.useMemo(() => {
    const r = ratesQuery.data;
    if (!r?.success) return null;
    const rate = (r.data?.rates as Record<string, number> | undefined)?.KES;
    return typeof rate === "number" && Number.isFinite(rate) ? rate : null;
  }, [ratesQuery.data]);

  const applyMargin = React.useCallback((priceUsd: number) => {
    const s = settings;
    if (!s || !Number.isFinite(priceUsd)) {
      return { original: priceUsd, final: priceUsd, marginAmount: 0 };
    }

    let marginAmount = 0;
    let final = priceUsd;

    if (s.marginType === "PERCENTAGE" && s.percentageMargin) {
      const p = Number.parseFloat(s.percentageMargin);
      if (Number.isFinite(p)) {
        marginAmount = (priceUsd * p) / 100;
        final = priceUsd + marginAmount;
      }
    } else if (s.marginType === "FIXED" && s.fixedMargin) {
      const f = Number.parseFloat(s.fixedMargin);
      if (Number.isFinite(f)) {
        marginAmount = f;
        final = priceUsd + marginAmount;
      }
    }

    if (s.roundOff) {
      const ro = Number.parseFloat(s.roundOff);
      if (Number.isFinite(ro) && ro > 0) {
        final = Math.ceil(final / ro) * ro;
        marginAmount = final - priceUsd;
      }
    }

    return { original: priceUsd, final, marginAmount };
  }, [settings]);

  const toKes = React.useCallback(
    (amountUsd: number) => {
      if (!Number.isFinite(amountUsd) || usdToKesRate === null) return null;
      return Math.round(amountUsd * usdToKesRate * 100) / 100;
    },
    [usdToKesRate],
  );

  return {
    settingsQuery,
    ratesQuery,
    settings,
    usdToKesRate,
    applyMargin,
    toKes,
  };
}

