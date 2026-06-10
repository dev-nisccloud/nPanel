import * as React from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { trpcMutation, trpcQuery } from "@/lib/domain-search/api.ts";
import { kenicItemToDomainSearchResult } from "@/lib/domain-search/to-domain-search-result.ts";
import {
  isKenicTld,
  normalizedItemToKenicCard,
  parseFullDomain,
  type KenicCardItem,
} from "@/lib/domain-search/kenic-schema.ts";
import { nameForOpenProvider } from "@/lib/domain-search/search-utils.ts";
import { getCustomerRetailDisplayPrice } from "@/lib/domain-search/customer-display-price.ts";
import { formatPrice } from "@/lib/domain-search/format-price.ts";
import { usePricing } from "@/lib/domain-search/pricing-context.tsx";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import { TldLogo } from "./TldLogo.tsx";
import { AddDomainToCartButtons } from "./AddDomainToCartButtons.tsx";

const EXACT_MATCH_WHY_CHOOSE: [string, string] = [
  "This is your exact domain search, secure it before someone else does.",
  "One address, one identity. Lock in your brand with this extension.",
];

export interface ExactMatchSectionProps {
  rawSearchQuery: string;
  onLoadingChange?: (loading: boolean) => void;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
}

export function ExactMatchSection({
  rawSearchQuery,
  onLoadingChange,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
}: ExactMatchSectionProps) {
  const { getPricingInfo, calculatePricesBatch, hasDefaultSetting, isLoadingTldSettings } =
    usePricing();
  const retailPricingReady = !isLoadingTldSettings && hasDefaultSetting;

  const normalizedRaw = React.useMemo(() => {
    let s = rawSearchQuery.trim().toLowerCase();
    s = s.replace(/^https?:\/\//, "").replace(/^www\./i, "");
    return s;
  }, [rawSearchQuery]);

  const parsed = React.useMemo(() => parseFullDomain(normalizedRaw), [normalizedRaw]);
  const fullDomain = parsed ? `${parsed.name}.${parsed.tld}`.toLowerCase() : "";
  const isKenic = parsed ? isKenicTld(parsed.tld) : false;

  const [kenicCard, setKenicCard] = React.useState<KenicCardItem | null>(null);
  const [kenicLoading, setKenicLoading] = React.useState(false);
  const [openProviderResult, setOpenProviderResult] = React.useState<DomainSearchResult | null>(null);
  const [openProviderLoading, setOpenProviderLoading] = React.useState(false);

  const calculateRef = React.useRef(calculatePricesBatch);
  calculateRef.current = calculatePricesBatch;

  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!parsed || !isKenic || !fullDomain) {
      setKenicCard(null);
      return;
    }
    setKenicCard(null);
    setKenicLoading(true);
    trpcMutation<{ normalized?: Array<{ domain: string; available: boolean; reason?: string; currency?: string; createFee?: { amount: number; currency: string } }> }>(
      "kenic.domainCheck.check",
      { domains: [fullDomain], withFee: true, currency: "KES", periodYears: 1 },
    )
      .then((data) => {
        if (!isMountedRef.current) return;
        const normalized = data?.normalized;
        if (normalized && Array.isArray(normalized)) {
          const item = normalized.find((n) => n.domain.toLowerCase() === fullDomain);
          setKenicCard(item ? normalizedItemToKenicCard(item) : null);
        } else {
          setKenicCard(null);
        }
      })
      .catch(() => {
        if (isMountedRef.current) setKenicCard(null);
      })
      .finally(() => {
        if (isMountedRef.current) setKenicLoading(false);
      });
  }, [fullDomain, isKenic, parsed?.name, parsed?.tld]);

  React.useEffect(() => {
    if (!parsed || isKenic || !parsed.name.trim()) {
      setOpenProviderResult(null);
      return;
    }
    setOpenProviderLoading(true);
    setOpenProviderResult(null);

    trpcQuery<{
      success: boolean;
      data?: {
        results: Array<{ domain: string; status: string; reason?: string; price?: DomainSearchResult["price"] }>;
      };
    }>("openProvider.domains.checkAvailability", {
      name: nameForOpenProvider(parsed.name),
      extensions: [parsed.tld],
      with_price: true,
      with_whois: false,
    })
      .then(async (response) => {
        if (!isMountedRef.current) return;
        const raw = response?.success ? response.data?.results?.[0] : null;
        if (!raw || raw.domain?.toLowerCase() !== fullDomain) {
          setOpenProviderResult(null);
          return;
        }
        const domainResult: DomainSearchResult = {
          domain: raw.domain,
          status: raw.status ?? "unknown",
          reason: raw.reason,
          price: raw.price,
        };
        const batch = calculateRef.current;
        const [priced] = await batch([domainResult]);
        if (isMountedRef.current) setOpenProviderResult(priced ?? domainResult);
      })
      .catch(() => {
        if (isMountedRef.current) setOpenProviderResult(null);
      })
      .finally(() => {
        if (isMountedRef.current) setOpenProviderLoading(false);
      });
  }, [parsed, isKenic, fullDomain]);

  const onLoadingChangeRef = React.useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;
  const anyLoading = kenicLoading || openProviderLoading;
  React.useEffect(() => {
    onLoadingChangeRef.current?.(anyLoading);
  }, [anyLoading]);

  if (!parsed || !rawSearchQuery.trim()) return null;

  if (anyLoading && !kenicCard && !openProviderResult) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 md:p-5 min-h-[200px]">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-14 w-14 rounded-lg" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-8 w-full mt-2" />
      </div>
    );
  }

  if (isKenic && kenicCard) {
    const currency = kenicCard.currency || "KES";
    const createCalc = getPricingInfo(kenicCard.domain, kenicCard.createPrice ?? 0, currency);
    const createFinal = createCalc.finalPrice;
    const displayResult = kenicItemToDomainSearchResult(kenicCard, {
      createFinal,
      createCalc,
    });
    const priceReady = kenicCard.available && retailPricingReady;

    return (
      <div className="bg-card border border-border rounded-lg p-4 md:p-5 hover:shadow-md transition-shadow flex flex-col relative min-h-[200px]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <TldLogo tld={kenicCard.tld} variant="kenyan" />
          <Badge
            className={
              kenicCard.available
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs"
            }
          >
            {kenicCard.available ? "Available" : "Taken"}
          </Badge>
        </div>
        <div className="font-bold text-base text-primary mb-1 truncate" title={kenicCard.domain}>
          {kenicCard.domain}
        </div>
        {priceReady && (
          <div className="space-y-0.5 mb-2">
            <div className="text-base font-bold text-foreground">{formatPrice(createFinal, currency)}</div>
          </div>
        )}
        {kenicCard.available ? (
          <div>
            <div className="border-t border-border my-2" />
            <ul className="space-y-1.5 mb-3 text-xs text-muted-foreground">
              {EXACT_MATCH_WHY_CHOOSE.map((line, i) => (
                <li key={i} className="flex gap-1.5 items-start">
                  <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" aria-hidden />
                  <span className="line-clamp-2">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          kenicCard.reason && (
            <div className="text-xs text-muted-foreground mb-3 line-clamp-2">{kenicCard.reason}</div>
          )
        )}
        <div className="mt-auto flex items-center justify-center gap-2">
          <AddDomainToCartButtons
            domain={kenicCard.domain}
            displayResult={displayResult}
            isAvailable={kenicCard.available}
            priceReady={priceReady}
            isDomainInCart={isDomainInCart}
            onAddToCart={onAddToCart}
            onRemoveFromCart={onRemoveFromCart}
          />
        </div>
      </div>
    );
  }

  if (!isKenic && openProviderResult) {
    const r = openProviderResult;
    const { displayPrice, displayCurrency } = getCustomerRetailDisplayPrice(r);
    const priceReady =
      displayPrice != null && displayCurrency != null && !Number.isNaN(displayPrice);
    const isAvailable = r.status === "free";
    const tld = r.domain.includes(".") ? (r.domain.split(".").slice(-1)[0] ?? "") : "";

    return (
      <div className="bg-card border border-border rounded-lg p-4 md:p-5 hover:shadow-md transition-shadow flex flex-col relative min-h-[200px]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <TldLogo tld={tld} variant="openprovider" />
          <Badge
            className={
              isAvailable
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs"
            }
          >
            {isAvailable ? "Available" : "Taken"}
          </Badge>
        </div>
        <div className="font-bold text-base text-primary mb-1 truncate" title={r.domain}>
          {r.domain}
        </div>
        {isAvailable && priceReady && (
          <div className="space-y-0.5 mb-2">
            <div className="text-base font-bold text-foreground">
              {formatPrice(displayPrice!, displayCurrency!)}
            </div>
          </div>
        )}
        {isAvailable ? (
          <div>
            <div className="border-t border-border my-2" />
            <ul className="space-y-1.5 mb-3 text-xs text-muted-foreground">
              {EXACT_MATCH_WHY_CHOOSE.map((line, i) => (
                <li key={i} className="flex gap-1.5 items-start">
                  <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" aria-hidden />
                  <span className="line-clamp-2">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          r.reason && <div className="text-xs text-muted-foreground mb-3 line-clamp-2">{r.reason}</div>
        )}
        <div className="mt-auto flex items-center justify-center gap-2">
          <AddDomainToCartButtons
            domain={r.domain}
            displayResult={r}
            isAvailable={isAvailable}
            priceReady={Boolean(priceReady)}
            isDomainInCart={isDomainInCart}
            onAddToCart={onAddToCart}
            onRemoveFromCart={onRemoveFromCart}
          />
        </div>
      </div>
    );
  }

  return null;
}
