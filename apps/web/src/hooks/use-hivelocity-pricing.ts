"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";

export type HivelocityProductType = "DEDICATED_SERVERS" | "VPS" | "VDS";

export type MarginType = "PERCENTAGE" | "FIXED";

export type PricingMargin = {
  marginType: MarginType | null;
  percentageMargin: string | null;
  fixedMargin: string | null;
  roundOff: string | null;
};

export type PricingSettings = {
  base: PricingMargin;
  os: PricingMargin;
  addons: PricingMargin;
};

export type PricingBucket = "base" | "os" | "addons";

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
      base: {
        marginType: (raw.marginType ?? null) as any,
        percentageMargin: raw.percentageMargin ?? null,
        fixedMargin: raw.fixedMargin ?? null,
        roundOff: raw.roundOff ?? null,
      },
      os: {
        marginType: (raw.osMarginType ?? null) as any,
        percentageMargin: raw.osPercentageMargin ?? null,
        fixedMargin: raw.osFixedMargin ?? null,
        roundOff: raw.osRoundOff ?? null,
      },
      addons: {
        marginType: (raw.addonsMarginType ?? null) as any,
        percentageMargin: raw.addonsPercentageMargin ?? null,
        fixedMargin: raw.addonsFixedMargin ?? null,
        roundOff: raw.addonsRoundOff ?? null,
      },
    };
  }, [settingsQuery.data]);

  const usdToKesRate = React.useMemo(() => {
    const r = ratesQuery.data;
    if (!r?.success) return null;
    const rate = (r.data?.rates as Record<string, number> | undefined)?.KES;
    return typeof rate === "number" && Number.isFinite(rate) ? rate : null;
  }, [ratesQuery.data]);

  const applyMarginWith = React.useCallback((margin: PricingMargin | null, priceUsd: number) => {
    if (!margin || !Number.isFinite(priceUsd)) return { original: priceUsd, final: priceUsd, marginAmount: 0 };

    let marginAmount = 0;
    let final = priceUsd;

    if (margin.marginType === "PERCENTAGE" && margin.percentageMargin) {
      const p = Number.parseFloat(margin.percentageMargin);
      if (Number.isFinite(p)) {
        marginAmount = (priceUsd * p) / 100;
        final = priceUsd + marginAmount;
      }
    } else if (margin.marginType === "FIXED" && margin.fixedMargin) {
      const f = Number.parseFloat(margin.fixedMargin);
      if (Number.isFinite(f)) {
        marginAmount = f;
        final = priceUsd + marginAmount;
      }
    }

    if (margin.roundOff) {
      const ro = Number.parseFloat(margin.roundOff);
      if (Number.isFinite(ro) && ro > 0) {
        final = Math.ceil(final / ro) * ro;
        marginAmount = final - priceUsd;
      }
    }

    return { original: priceUsd, final, marginAmount };
  }, []);

  const applyMarginFor = React.useCallback(
    (bucket: PricingBucket, priceUsd: number) => {
      const s = settings;
      if (!s) return { original: priceUsd, final: priceUsd, marginAmount: 0 };
      return applyMarginWith(s[bucket], priceUsd);
    },
    [applyMarginWith, settings],
  );

  // Backwards-compatible helper (base margin).
  const applyMargin = React.useCallback((priceUsd: number) => applyMarginFor("base", priceUsd), [applyMarginFor]);

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
    applyMarginFor,
    toKes,
  };
}

