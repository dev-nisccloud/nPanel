import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { trpcMutation } from "@/lib/domain-search/api.ts";
import {
  buildKenicDomainsFromQuery,
  normalizeToKenicCards,
  type KenicCardItem,
} from "@/lib/domain-search/kenic-schema.ts";
import { usePricing } from "@/lib/domain-search/pricing-context.tsx";
import { kenicItemToDomainSearchResult } from "@/lib/domain-search/to-domain-search-result.ts";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import { DomainResultList, DomainResultRow } from "./DomainResultRow.tsx";

const KENYAN_LIST_SKELETON = (
  <div className="space-y-0 mb-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        {i < 5 && <div className="border-b border-border" />}
      </React.Fragment>
    ))}
  </div>
);

export interface KenyanTldCardsProps {
  searchQuery: string;
  suggestionsReady?: boolean;
  isSelected?: boolean;
  embeddedInTabs?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
}

export function KenyanTldCards({
  searchQuery,
  suggestionsReady = true,
  isSelected = true,
  embeddedInTabs = false,
  onLoadingChange,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
}: KenyanTldCardsProps) {
  const { getPricingInfo, hasDefaultSetting, isLoadingTldSettings } = usePricing();
  const retailPricingReady = !isLoadingTldSettings && hasDefaultSetting;

  const sanitized = React.useMemo(() => {
    const t = searchQuery.trim().toLowerCase().replace(/\s+/g, "");
    return t.length > 0 ? t : "";
  }, [searchQuery]);

  const domains = React.useMemo(
    () => (sanitized ? buildKenicDomainsFromQuery(sanitized) : []),
    [sanitized],
  );

  const [cards, setCards] = React.useState<KenicCardItem[] | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const isMountedRef = React.useRef(true);
  const lastFetchedSanitizedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useLayoutEffect(() => {
    if (!sanitized) return;
    if (lastFetchedSanitizedRef.current !== null && lastFetchedSanitizedRef.current !== sanitized) {
      lastFetchedSanitizedRef.current = null;
      setCards(null);
    }
  }, [sanitized]);

  React.useEffect(() => {
    if (!isSelected || !suggestionsReady || !sanitized || domains.length === 0) return;
    const alreadyHaveData = cards != null && lastFetchedSanitizedRef.current === sanitized;
    if (alreadyHaveData) return;

    lastFetchedSanitizedRef.current = sanitized;
    setCards(null);
    setIsPending(true);
    setIsError(false);

    trpcMutation<{
      normalized?: Array<{
        domain: string;
        available: boolean;
        reason?: string;
        currency?: string;
        createFee?: { amount: number; currency: string };
      }>;
    }>("kenic.domainCheck.check", {
      domains,
      withFee: true,
      currency: "KES",
      periodYears: 1,
    })
      .then((data) => {
        if (!isMountedRef.current) return;
        const normalized = data?.normalized;
        if (normalized && Array.isArray(normalized)) {
          setCards(normalizeToKenicCards(sanitized, normalized));
        } else {
          setCards(null);
        }
      })
      .catch(() => {
        if (isMountedRef.current) {
          setCards(null);
          setIsError(true);
          lastFetchedSanitizedRef.current = null;
        }
      })
      .finally(() => {
        if (isMountedRef.current) setIsPending(false);
      });
  }, [isSelected, suggestionsReady, sanitized, domains.join(",")]);

  const onLoadingChangeRef = React.useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;
  React.useLayoutEffect(() => {
    onLoadingChangeRef.current?.(isSelected ? isPending : false);
  }, [isSelected, isPending]);

  if (!sanitized) return null;
  if (!isSelected) return <div className="min-h-[200px]" aria-hidden />;

  const waitForSuggestions = !suggestionsReady && sanitized.length > 0;
  const isLoading = isPending;

  if (waitForSuggestions || (isLoading && cards == null)) {
    return (
      <section className="mb-6">
        {!embeddedInTabs && (
          <h3 className="text-base font-semibold tracking-tight text-card-foreground mb-4">
            Give your brand a Kenyan vibe
          </h3>
        )}
        {KENYAN_LIST_SKELETON}
      </section>
    );
  }

  const list = cards ?? [];

  return (
    <section className="mb-6">
      {!embeddedInTabs && (
        <h3 className="text-base font-semibold tracking-tight text-card-foreground mb-4">
          Give your brand a Kenyan vibe
        </h3>
      )}
      {isError && (
        <p className="text-sm text-destructive mb-2">
          Could not load Kenyan TLD availability. Try again later.
        </p>
      )}
      <DomainResultList>
        {list.map((item) => {
          const createCalc = getPricingInfo(item.domain, item.createPrice ?? 0, item.currency ?? "KES");
          const createFinal = createCalc.finalPrice;
          const currency = item.currency ?? "KES";
          const displayResult = kenicItemToDomainSearchResult(item, {
            createFinal,
            createCalc,
          });
          return (
            <DomainResultRow
              key={item.domain}
              domain={item.domain}
              isAvailable={item.available}
              displayPrice={item.available && retailPricingReady ? createFinal : undefined}
              displayCurrency={item.available && retailPricingReady ? currency : undefined}
              reason={item.reason}
              displayResult={displayResult}
              isDomainInCart={isDomainInCart}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
            />
          );
        })}
      </DomainResultList>
    </section>
  );
}
