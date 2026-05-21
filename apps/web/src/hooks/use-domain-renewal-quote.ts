"use client";

import * as React from "react";
import { addYears, format } from "date-fns";
import { trpc } from "@/utils/trpc";
import { useCurrency } from "@/routes/agency.domains/_components/currency-context";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import {
  isKenicTld,
  parseFullDomain,
} from "@/routes/agency.domains/_components/kenic-card-schema";

export type RenewalQuoteDisplay = { amount: number; currency: string };

function getCalculatedDisplay(
  calculated:
    | {
        convertedPrice?: number;
        finalPrice?: number;
        displayCurrency?: string;
        currency?: string;
      }
    | undefined,
  fallbackCurrency: string,
): RenewalQuoteDisplay | null {
  if (!calculated) return null;
  const amount = calculated.convertedPrice ?? calculated.finalPrice;
  if (amount == null || !Number.isFinite(amount)) return null;
  return {
    amount,
    currency: calculated.displayCurrency ?? calculated.currency ?? fallbackCurrency,
  };
}

type UseDomainRenewalQuoteOptions = {
  /** Full domain, e.g. example.co.ke */
  domain: string;
  /** Years from today for the renewal / expiry date label */
  yearsFromNow?: number;
  /** When false, skips OpenProvider pricing fetch */
  enabled?: boolean;
  /**
   * For KENIC: unit price to show as renewal (e.g. registration unit price).
   * Only used when `showKenicRenewalQuote` is true.
   */
  kenicUnitPrice?: number | null;
  kenicCurrency?: string;
  /** When true, KENIC domains show renewal quote from kenicUnitPrice (buy flow). */
  showKenicRenewalQuote?: boolean;
};

/**
 * Renewal date label and OpenProvider renewal price (margin + conversion).
 * KENIC returns no renewal quote unless kenicUnitPrice is provided.
 */
export function useDomainRenewalQuote({
  domain,
  yearsFromNow = 1,
  enabled = true,
  kenicUnitPrice = null,
  kenicCurrency = "KES",
  showKenicRenewalQuote = false,
}: UseDomainRenewalQuoteOptions) {
  const currencyContext = useCurrency();
  const { calculatePricesBatch, isLoadingTldSettings } = useDomainPricing(currencyContext);

  const parsed = React.useMemo(() => parseFullDomain(domain), [domain]);
  const isKenic = parsed ? isKenicTld(parsed.tld) : false;

  const renewalDateLabel = React.useMemo(
    () => format(addYears(new Date(), yearsFromNow), "MMMM d, yyyy"),
    [yearsFromNow],
  );

  const renewPricingQuery = trpc.openProvider.domains.getPricing.useQuery(
    {
      domain: {
        name: parsed?.name ?? "",
        extension: parsed?.tld ?? "",
      },
      operation: "renew",
      period: 1,
    },
    {
      enabled: enabled && !!parsed && !isKenic,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  );

  const [openProviderRenewal, setOpenProviderRenewal] = React.useState<RenewalQuoteDisplay | null>(
    null,
  );
  const [renewalPricingBusy, setRenewalPricingBusy] = React.useState(false);

  React.useEffect(() => {
    if (isKenic || !enabled) {
      setOpenProviderRenewal(null);
      setRenewalPricingBusy(false);
      return;
    }
    if (!parsed || isLoadingTldSettings) return;

    const priceObj = renewPricingQuery.data?.data?.price;
    const wholesale = priceObj?.reseller ?? priceObj?.product;
    if (renewPricingQuery.isLoading || renewPricingQuery.isFetching) {
      setRenewalPricingBusy(true);
      return;
    }
    if (renewPricingQuery.isError || wholesale?.price == null) {
      setOpenProviderRenewal(null);
      setRenewalPricingBusy(false);
      return;
    }

    const raw: DomainSearchResult = {
      domain,
      status: "free",
      price: {
        product: {
          price: Number(wholesale.price),
          currency: wholesale.currency ?? "USD",
        },
        reseller: {
          price: Number(wholesale.price),
          currency: wholesale.currency ?? "USD",
        },
      },
      reason: `Renew: ${domain}`,
    };

    let cancelled = false;
    setRenewalPricingBusy(true);
    calculatePricesBatch([raw])
      .then((priced) => {
        if (cancelled) return;
        const calc = priced[0]?.price?.calculated as
          | {
              convertedPrice?: number;
              finalPrice?: number;
              displayCurrency?: string;
              currency?: string;
            }
          | undefined;
        setOpenProviderRenewal(
          getCalculatedDisplay(calc, wholesale.currency ?? kenicCurrency),
        );
      })
      .catch(() => {
        if (!cancelled) setOpenProviderRenewal(null);
      })
      .finally(() => {
        if (!cancelled) setRenewalPricingBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    isKenic,
    enabled,
    parsed,
    domain,
    renewPricingQuery.data,
    renewPricingQuery.isLoading,
    renewPricingQuery.isFetching,
    renewPricingQuery.isError,
    isLoadingTldSettings,
    calculatePricesBatch,
    kenicCurrency,
  ]);

  const renewalQuote = React.useMemo((): RenewalQuoteDisplay | null => {
    if (isKenic) {
      if (kenicUnitPrice == null || !Number.isFinite(kenicUnitPrice)) return null;
      return { amount: kenicUnitPrice, currency: kenicCurrency };
    }
    return openProviderRenewal;
  }, [isKenic, kenicUnitPrice, kenicCurrency, openProviderRenewal]);

  const showRenewalQuote =
    enabled && (!isKenic || (showKenicRenewalQuote && kenicUnitPrice != null));
  const isLoading =
    showRenewalQuote &&
    (renewPricingQuery.isLoading ||
      renewPricingQuery.isFetching ||
      renewalPricingBusy ||
      isLoadingTldSettings);

  return {
    isKenic,
    parsed,
    renewalDateLabel,
    renewalQuote,
    showRenewalQuote,
    isLoading,
  };
}
