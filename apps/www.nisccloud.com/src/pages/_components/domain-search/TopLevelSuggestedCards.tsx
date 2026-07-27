import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { trpcMutation, trpcQuery } from "@/lib/domain-search/api.ts";
import { kenicItemToDomainSearchResult } from "@/lib/domain-search/to-domain-search-result.ts";
import {
  normalizedItemToKenicCard,
  parseFullDomain,
  type KenicCardItem,
} from "@/lib/domain-search/kenic-schema.ts";
import { nameForOpenProvider } from "@/lib/domain-search/search-utils.ts";
import { getCustomerRetailDisplayPrice } from "@/lib/domain-search/customer-display-price.ts";
import { formatPrice } from "@/lib/domain-search/format-price.ts";
import { formatDomainBundleLabel } from "@npanel/cart-store";
import { usePricing, useBundleTotalKes } from "@/lib/domain-search/pricing-context.tsx";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import { TldLogo } from "./TldLogo.tsx";
import { AddDomainToCartButtons } from "./AddDomainToCartButtons.tsx";

const TLD_WHY_CHOOSE: Record<string, string> = {
  "co.ke": "Kenya's most trusted commercial extension, ideal for local businesses and brands.",
  ke: "Short, memorable .ke for a bold Kenyan identity.",
  com: "The worlds most recognized TLD, builds trust and credibility everywhere.",
  bundle: "Lock in .co.ke, .ke, .com & .net together and save.",
};

const SUGGESTED_OPEN_TLDS = ["com"] as const;
const BUNDLE_TLD_ORDER = ["co.ke", "ke", "com", "net"];
const DISPLAY_CURRENCY = "KES";

function getExactMatchTld(rawSearchQuery: string): string | null {
  const s = rawSearchQuery.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./i, "");
  const parsed = parseFullDomain(s);
  return parsed ? parsed.tld : null;
}

export interface TopLevelSuggestedCardsProps {
  searchQuery: string;
  rawSearchQuery: string;
  onLoadingChange?: (loading: boolean) => void;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
  isDomainBundleInCart: (domainNames: string[]) => boolean;
  onAddDomainBundle: (params: {
    domains: DomainSearchResult[];
    bundlePrice: number;
    bundleCurrency?: string;
    bundleLabel?: string;
  }) => void;
  onRemoveDomainBundle: (domainNames: string[]) => void;
}

export function TopLevelSuggestedCards({
  searchQuery,
  rawSearchQuery,
  onLoadingChange,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
  isDomainBundleInCart,
  onAddDomainBundle,
  onRemoveDomainBundle,
}: TopLevelSuggestedCardsProps) {
  const { getPricingInfo, calculatePricesBatch, hasDefaultSetting, isLoadingTldSettings } = usePricing();
  const retailPricingReady = !isLoadingTldSettings && hasDefaultSetting;

  const name = React.useMemo(() => searchQuery.trim().toLowerCase().replace(/\s+/g, ""), [searchQuery]);
  const exactMatchTld = React.useMemo(() => getExactMatchTld(rawSearchQuery), [rawSearchQuery]);

  const [kenicCoKe, setKenicCoKe] = React.useState<KenicCardItem | null>(null);
  const [kenicKe, setKenicKe] = React.useState<KenicCardItem | null>(null);
  const [kenicLoading, setKenicLoading] = React.useState(false);
  const [openProviderPriced, setOpenProviderPriced] = React.useState<DomainSearchResult[]>([]);
  const [openProviderLoading, setOpenProviderLoading] = React.useState(false);
  const [openProviderSettled, setOpenProviderSettled] = React.useState(true);

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
    if (!name) {
      setKenicCoKe(null);
      setKenicKe(null);
      return;
    }
    setKenicCoKe(null);
    setKenicKe(null);
    setKenicLoading(true);
    trpcMutation<{ normalized?: Array<{ domain: string; available: boolean; reason?: string; currency?: string; createFee?: { amount: number; currency: string } }> }>(
      "kenic.domainCheck.check",
      {
        domains: [`${name}.co.ke`, `${name}.ke`],
        withFee: true,
        currency: "KES",
        periodYears: 1,
      },
    )
      .then((data) => {
        if (!isMountedRef.current) return;
        const normalized = data?.normalized;
        if (normalized && Array.isArray(normalized)) {
          const coKeItem = normalized.find((n) => n.domain.toLowerCase() === `${name}.co.ke`);
          const keItem = normalized.find((n) => n.domain.toLowerCase() === `${name}.ke`);
          if (coKeItem) setKenicCoKe(normalizedItemToKenicCard(coKeItem));
          if (keItem) setKenicKe(normalizedItemToKenicCard(keItem));
        }
      })
      .catch(() => {
        if (isMountedRef.current) {
          setKenicCoKe(null);
          setKenicKe(null);
        }
      })
      .finally(() => {
        if (isMountedRef.current) setKenicLoading(false);
      });
  }, [name]);

  React.useEffect(() => {
    if (!name) {
      setOpenProviderPriced([]);
      setOpenProviderSettled(true);
      return;
    }
    setOpenProviderLoading(true);
    setOpenProviderSettled(false);

    trpcQuery<{
      success: boolean;
      data?: {
        results: Array<{ domain: string; status: string; reason?: string; price?: DomainSearchResult["price"] }>;
      };
    }>("openProvider.domains.checkAvailability", {
      name: nameForOpenProvider(name),
      extensions: ["com", "net", "io"],
      with_price: true,
      with_whois: false,
    })
      .then(async (response) => {
        if (!isMountedRef.current) return;
        const rawResults = response?.success && response.data?.results ? response.data.results : [];
        if (!rawResults.length) {
          setOpenProviderPriced([]);
          setOpenProviderSettled(true);
          return;
        }
        const raw: DomainSearchResult[] = rawResults.map((r) => ({
          domain: r.domain,
          status: r.status ?? "unknown",
          reason: r.reason,
          price: r.price,
        }));
        try {
          const priced = await calculateRef.current(raw);
          if (isMountedRef.current) setOpenProviderPriced(priced);
        } catch {
          if (isMountedRef.current) setOpenProviderPriced(raw);
        }
      })
      .catch(() => {
        if (isMountedRef.current) setOpenProviderPriced([]);
      })
      .finally(() => {
        if (isMountedRef.current) {
          setOpenProviderLoading(false);
          setOpenProviderSettled(true);
        }
      });
  }, [name]);

  const loading = kenicLoading || openProviderLoading || !openProviderSettled;

  const onLoadingChangeRef = React.useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;
  React.useLayoutEffect(() => {
    onLoadingChangeRef.current?.(loading);
  }, [loading]);

  const byDomain = React.useMemo(() => {
    const map = new Map<string, DomainSearchResult>();
    for (const r of openProviderPriced) map.set(r.domain, r);
    return map;
  }, [openProviderPriced]);

  const bundleInfo = React.useMemo(() => {
    const items: { tld: string; domain: string; basePrice: number; currency: string }[] = [];
    if (kenicCoKe?.available && kenicCoKe.createPrice != null) {
      items.push({ tld: "co.ke", domain: kenicCoKe.domain, basePrice: kenicCoKe.createPrice, currency: kenicCoKe.currency ?? "KES" });
    }
    if (kenicKe?.available && kenicKe.createPrice != null) {
      items.push({ tld: "ke", domain: kenicKe.domain, basePrice: kenicKe.createPrice, currency: kenicKe.currency ?? "KES" });
    }
    for (const r of openProviderPriced) {
      if (r.status !== "free" || !r.price?.reseller?.price) continue;
      const tld = r.domain.includes(".") ? (r.domain.split(".").slice(-1)[0] ?? "") : "";
      if (tld === "com") items.push({ tld: "com", domain: r.domain, basePrice: r.price.reseller.price, currency: r.price.reseller.currency ?? "USD" });
      if (tld === "net") items.push({ tld: "net", domain: r.domain, basePrice: r.price.reseller.price, currency: r.price.reseller.currency ?? "USD" });
    }
    if (items.length < 3) return null;
    return { items };
  }, [kenicCoKe, kenicKe, openProviderPriced]);

  const bundleBasePrices = React.useMemo(
    () => bundleInfo?.items.map((i) => ({ amount: i.basePrice, currency: i.currency })) ?? [],
    [bundleInfo],
  );
  const bundleTotalKes = useBundleTotalKes(bundleBasePrices);

  if (!name) return null;

  const suggestedSectionReady = !kenicLoading && !openProviderLoading && openProviderSettled;
  if (!suggestedSectionReady) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 md:p-5 min-h-[200px]">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-14 w-14 rounded-lg" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-full mt-2" />
          </div>
        ))}
      </>
    );
  }

  const showCoKe = exactMatchTld !== "co.ke" && kenicCoKe?.available === true;
  const showKe = exactMatchTld !== "ke" && kenicKe?.available === true;
  const showCom = exactMatchTld !== "com" && byDomain.get(`${name}.com`)?.status === "free";

  const cards: React.ReactNode[] = [];

  if (showCoKe && kenicCoKe) {
    const currency = kenicCoKe.currency ?? "KES";
    const createCalc = getPricingInfo(kenicCoKe.domain, kenicCoKe.createPrice ?? 0, currency);
    const displayResult = kenicItemToDomainSearchResult(kenicCoKe, {
      createFinal: createCalc.finalPrice,
      createCalc,
    });
    cards.push(
      <SingleTldCard
        key="co.ke"
        tld="co.ke"
        domain={kenicCoKe.domain}
        available
        displayPrice={retailPricingReady ? createCalc.finalPrice : undefined}
        currency={retailPricingReady ? currency : undefined}
        variant="kenyan"
        displayResult={displayResult}
        isDomainInCart={isDomainInCart}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
      />,
    );
  }

  if (showKe && kenicKe) {
    const currency = kenicKe.currency ?? "KES";
    const createCalc = getPricingInfo(kenicKe.domain, kenicKe.createPrice ?? 0, currency);
    const displayResult = kenicItemToDomainSearchResult(kenicKe, {
      createFinal: createCalc.finalPrice,
      createCalc,
    });
    cards.push(
      <SingleTldCard
        key="ke"
        tld="ke"
        domain={kenicKe.domain}
        available
        displayPrice={retailPricingReady ? createCalc.finalPrice : undefined}
        currency={retailPricingReady ? currency : undefined}
        variant="kenyan"
        displayResult={displayResult}
        isDomainInCart={isDomainInCart}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
      />,
    );
  }

  if (bundleInfo) {
    cards.push(
      <BundleCard
        key="bundle"
        searchName={name}
        bundleInfo={bundleInfo}
        bundleTotalKes={bundleTotalKes}
        byDomain={byDomain}
        kenicCoKe={kenicCoKe}
        kenicKe={kenicKe}
        isDomainBundleInCart={isDomainBundleInCart}
        onAddDomainBundle={onAddDomainBundle}
        onRemoveDomainBundle={onRemoveDomainBundle}
      />,
    );
  }

  for (const tld of SUGGESTED_OPEN_TLDS) {
    const domain = `${name}.${tld}`;
    const r = byDomain.get(domain);
    const show = tld === "com" && showCom;
    if (!show || !r || r.status !== "free") continue;
    const { displayPrice, displayCurrency } = getCustomerRetailDisplayPrice(r);
    const showPrice =
      retailPricingReady && displayPrice != null && displayCurrency != null && !Number.isNaN(displayPrice);
    cards.push(
      <SingleTldCard
        key={tld}
        tld={tld}
        domain={domain}
        available
        displayPrice={showPrice ? displayPrice : undefined}
        currency={showPrice ? displayCurrency : undefined}
        variant="openprovider"
        displayResult={r}
        isDomainInCart={isDomainInCart}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
      />,
    );
  }

  return <>{cards}</>;
}

function SingleTldCard({
  tld,
  domain,
  available,
  displayPrice,
  currency,
  variant,
  displayResult,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
}: {
  tld: string;
  domain: string;
  available: boolean;
  displayPrice?: number;
  currency?: string;
  variant: "kenyan" | "openprovider";
  displayResult: DomainSearchResult;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
}) {
  const priceReady =
    available && displayPrice != null && !Number.isNaN(displayPrice) && Boolean(currency);

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5 hover:shadow-md transition-shadow flex flex-col relative min-h-[200px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <TldLogo tld={tld} variant={variant} />
        <Badge
          className={
            available
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs"
          }
        >
          {available ? "Available" : "Taken"}
        </Badge>
      </div>
      <div className="font-bold text-base text-primary mb-1 truncate" title={domain}>
        {domain}
      </div>
      {priceReady && (
        <div className="space-y-0.5 mb-2">
          <div className="text-base font-bold text-foreground">{formatPrice(displayPrice!, currency!)}</div>
        </div>
      )}
      {available && TLD_WHY_CHOOSE[tld] ? (
        <div>
          <div className="border-t border-border my-2" />
          <ul className="space-y-1.5 mb-3 text-xs text-muted-foreground">
            <li className="flex gap-1.5 items-start">
              <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" aria-hidden />
              <span className="line-clamp-2">{TLD_WHY_CHOOSE[tld]}</span>
            </li>
          </ul>
        </div>
      ) : null}
      <div className="mt-auto flex items-center justify-center gap-2">
        <AddDomainToCartButtons
          domain={domain}
          displayResult={displayResult}
          isAvailable={available}
          priceReady={Boolean(priceReady)}
          isDomainInCart={isDomainInCart}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
        />
      </div>
    </div>
  );
}

function BundleCard({
  searchName,
  bundleInfo,
  bundleTotalKes,
  byDomain,
  kenicCoKe,
  kenicKe,
  isDomainBundleInCart,
  onAddDomainBundle,
  onRemoveDomainBundle,
}: {
  searchName: string;
  bundleInfo: { items: { tld: string; domain: string; basePrice: number; currency: string }[] };
  bundleTotalKes: number | null;
  byDomain: Map<string, DomainSearchResult>;
  kenicCoKe: KenicCardItem | null;
  kenicKe: KenicCardItem | null;
  isDomainBundleInCart: (domainNames: string[]) => boolean;
  onAddDomainBundle: (params: {
    domains: DomainSearchResult[];
    bundlePrice: number;
    bundleCurrency?: string;
    bundleLabel?: string;
  }) => void;
  onRemoveDomainBundle: (domainNames: string[]) => void;
}) {
  const buildBundleDomainResults = React.useCallback((): DomainSearchResult[] => {
    const results: DomainSearchResult[] = [];
    for (const item of bundleInfo.items) {
      if (item.tld === "co.ke" && kenicCoKe) {
        const currency = kenicCoKe.currency ?? "KES";
        const basePrice = kenicCoKe.createPrice ?? 0;
        results.push({
          domain: kenicCoKe.domain,
          status: "free",
          price: {
            product: { price: basePrice, currency },
            reseller: { price: basePrice, currency },
          },
        });
      } else if (item.tld === "ke" && kenicKe) {
        const currency = kenicKe.currency ?? "KES";
        const basePrice = kenicKe.createPrice ?? 0;
        results.push({
          domain: kenicKe.domain,
          status: "free",
          price: {
            product: { price: basePrice, currency },
            reseller: { price: basePrice, currency },
          },
        });
      } else {
        const r = byDomain.get(item.domain);
        if (r) results.push(r);
      }
    }
    return results;
  }, [bundleInfo.items, byDomain, kenicCoKe, kenicKe]);

  const bundleDomains = React.useMemo(() => buildBundleDomainResults(), [buildBundleDomainResults]);
  const bundleDomainNames = React.useMemo(
    () => bundleDomains.map((d) => d.domain).filter(Boolean),
    [bundleDomains],
  );
  const bundleReady =
    bundleTotalKes != null && bundleDomains.length === bundleInfo.items.length;

  const handleBundleCart = () => {
    if (!bundleReady || bundleTotalKes == null) return;
    onAddDomainBundle({
      domains: bundleDomains,
      bundlePrice: bundleTotalKes,
      bundleCurrency: DISPLAY_CURRENCY,
      bundleLabel: formatDomainBundleLabel(bundleDomainNames),
    });
  };

  const bundleLabelParts = React.useMemo(() => {
    const byTld = new Map(bundleInfo.items.map((i) => [i.tld, i]));
    return BUNDLE_TLD_ORDER.filter((tld) => byTld.has(tld));
  }, [bundleInfo.items]);

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5 hover:shadow-md transition-shadow flex flex-col relative min-h-[200px]">
      <Badge className="absolute top-2 right-2 text-[10px] bg-primary text-primary-foreground">
        Bundle & save
      </Badge>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center justify-center rounded-lg bg-muted p-2 size-10">
          <img src="/nisciconoriginal.png" alt="Bundle" width={24} height={24} className="object-contain" />
        </div>
      </div>
      <div
        className="font-bold text-base mb-1 min-h-[2.5rem] line-clamp-2 break-words"
        title={
          bundleLabelParts.length
            ? `${searchName}.${bundleLabelParts[0]}${bundleLabelParts.slice(1).map((t) => ` + .${t}`).join("")}`
            : ""
        }
      >
        {bundleLabelParts.length > 0 ? (
          <>
            <span className="text-foreground">{searchName}</span>
            <span className="text-primary">.{bundleLabelParts[0]}</span>
            {bundleLabelParts.slice(1).map((tld) => (
              <React.Fragment key={tld}>
                <span className="text-foreground"> + </span>
                <span className="text-primary">.{tld}</span>
              </React.Fragment>
            ))}
          </>
        ) : null}
      </div>
      <div className="text-base font-bold text-foreground mb-2 line-clamp-2 break-words">
        {bundleTotalKes != null ? formatPrice(bundleTotalKes, DISPLAY_CURRENCY) : "-"}
      </div>
      {TLD_WHY_CHOOSE.bundle ? (
        <div>
          <div className="border-t border-border my-2" />
          <ul className="space-y-1.5 mb-3 text-xs text-muted-foreground">
            <li className="flex gap-1.5 items-start">
              <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" aria-hidden />
              <span className="line-clamp-2">{TLD_WHY_CHOOSE.bundle}</span>
            </li>
          </ul>
        </div>
      ) : null}
      <div className="mt-auto flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={handleBundleCart}
          className="text-xs h-8 px-3 cursor-pointer"
          disabled={!bundleReady}
        >
          Buy now
        </Button>
      </div>
    </div>
  );
}
