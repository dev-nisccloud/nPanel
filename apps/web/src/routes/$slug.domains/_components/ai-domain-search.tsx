"use client";

import * as React from "react";
import { AlertCircle, Search, ShoppingCart, Sparkles, XCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { CurrencyProvider } from "./currency-context";
import { useCurrency } from "./currency-context";
import { DomainSearchResults } from "./domain-search-results";
import { useDomainSearch } from "./use-domain-search";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import { trpc, type RouterOutputs } from "@/utils/trpc";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

const MIN_DESCRIPTION_LENGTH = 40;

type NameSuggestion =
  RouterOutputs["aiDomainSearch"]["generateNameIdeas"]["suggestions"][number];

type AvailabilityEntry = NameSuggestion["availability"][number];

// ---------- helpers ----------

const KES_FMT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
function formatKes(amount: number) {
  return `KSh ${KES_FMT.format(amount)}`;
}

/**
 * Build a DomainSearchResult for a gTLD entry whose price was already retail-calculated
 * server-side (margin + FX applied by agentCheckDomainAvailability → toRetailPrice).
 */
function buildGtldResult(entry: AvailabilityEntry): DomainSearchResult | undefined {
  if (!entry.available || !entry.price) return undefined;
  return {
    domain: entry.domain,
    status: "free",
    price: {
      product: { price: entry.price.amount, currency: entry.price.currency },
      reseller: { price: entry.price.amount, currency: entry.price.currency },
      calculated: {
        originalPrice: entry.price.amount,
        marginAmount: 0,
        finalPrice: entry.price.amount,
        currency: entry.price.currency,
        marginType: null,
        marginValue: null,
      },
    },
  };
}

// ---------- TLD row ----------

interface TldAvailabilityRowProps {
  entry: AvailabilityEntry;
  /** Base create price returned by KENIC EPP withFee check (absent until loaded). */
  kenicBaseFee: number | undefined;
  isLoadingKenicFees: boolean;
  getPricingInfo: (domain: string, price: number, currency: string) => {
    finalPrice: number;
    marginAmount: number;
    marginType: string | null;
    marginValue: string | null;
    currency: string;
  };
  isLoadingTldSettings: boolean;
  hasDefaultSetting: boolean;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (r: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
}

function TldAvailabilityRow({
  entry,
  kenicBaseFee,
  isLoadingKenicFees,
  getPricingInfo,
  isLoadingTldSettings,
  hasDefaultSetting,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
}: TldAvailabilityRowProps) {
  const openForProduct = useGlobalBuyNowStore((s) => s.openForProduct);
  const { data: domainsProductId } = trpc.clientSubscriptions.getDomainsProductId.useQuery(
    undefined,
    { enabled: true }
  );

  const isKenic = entry.via === "kenic";
  const isInCart = isDomainInCart(entry.domain);

  const { displayPriceText, displayResult, priceReady } = React.useMemo(() => {
    if (!entry.available) {
      return { displayPriceText: undefined, displayResult: undefined, priceReady: false };
    }

    if (isKenic) {
      // KENIC: apply margin only (no FX conversion), price comes from EPP withFee check
      if (kenicBaseFee == null || isLoadingKenicFees || isLoadingTldSettings || !hasDefaultSetting) {
        return { displayPriceText: undefined, displayResult: undefined, priceReady: false };
      }
      const pricing = getPricingInfo(entry.domain, kenicBaseFee, "KES");
      const result: DomainSearchResult = {
        domain: entry.domain,
        status: "free",
        price: {
          product: { price: pricing.finalPrice, currency: "KES" },
          reseller: { price: pricing.finalPrice, currency: "KES" },
          calculated: {
            originalPrice: kenicBaseFee,
            marginAmount: pricing.marginAmount,
            finalPrice: pricing.finalPrice,
            currency: "KES",
            marginType: pricing.marginType,
            marginValue: pricing.marginValue,
          },
        },
      };
      return {
        displayPriceText: `${formatKes(pricing.finalPrice)}/yr`,
        displayResult: result,
        priceReady: true,
      };
    } else {
      // gTLD: price already retail (margin + FX applied server-side)
      const result = buildGtldResult(entry);
      if (!result || !entry.price) {
        return { displayPriceText: undefined, displayResult: undefined, priceReady: false };
      }
      return {
        displayPriceText: `${entry.price.formatted}/yr`,
        displayResult: result,
        priceReady: true,
      };
    }
  }, [
    entry,
    isKenic,
    kenicBaseFee,
    isLoadingKenicFees,
    isLoadingTldSettings,
    hasDefaultSetting,
    getPricingInfo,
  ]);

  const handleBuyNow = () => {
    if (domainsProductId && displayResult) {
      openForProduct({ productId: domainsProductId, productName: "Domains", domain: displayResult });
    }
  };

  const handleCart = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isInCart) {
      onRemoveFromCart(entry.domain);
    } else if (priceReady && displayResult) {
      onAddToCart(displayResult);
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/40 last:border-0 last:pb-0 first:pt-0">
      {/* Left: domain name + price */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-bold text-primary leading-tight break-all">
          {entry.domain}
        </p>
        {entry.available && priceReady && displayPriceText && (
          <p className="text-xs text-muted-foreground">{displayPriceText}</p>
        )}
        {entry.available && isKenic && !isLoadingKenicFees && kenicBaseFee == null && (
          <p className="text-xs text-muted-foreground italic">Pricing on request</p>
        )}
        {entry.available && isKenic && isLoadingKenicFees && (
          <p className="text-xs text-muted-foreground">Loading pricing…</p>
        )}
      </div>

      {/* Right: badge (top) + action buttons (below) */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        {/* Availability badge */}
        {entry.available ? (
          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-0">
            Available
          </Badge>
        ) : entry.status === "reserved" ? (
          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-0">
            Reserved
          </Badge>
        ) : entry.status === "unknown" ? (
          <span className="text-[10px] text-muted-foreground/50">—</span>
        ) : (
          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-50 dark:bg-red-950/30 text-red-500 border border-red-200 dark:border-red-800">
            Taken
          </Badge>
        )}

        {/* Buy Now + Cart — only when available and price is ready */}
        {entry.available && priceReady && displayResult && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="default"
              className="h-6 text-[10px] px-2 py-0"
              disabled={!domainsProductId}
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
            <Button
              size="sm"
              variant={isInCart ? "destructive" : "outline"}
              className="h-6 w-6 p-0"
              disabled={!priceReady && !isInCart}
              title={isInCart ? "Remove from cart" : "Add to cart"}
              onClick={handleCart}
            >
              {isInCart ? (
                <XCircle className="h-3 w-3" />
              ) : (
                <ShoppingCart className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- skeletons ----------

const TLD_ROW_SKELETON = (
  <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/40 last:border-0">
    <div className="flex-1 space-y-1">
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
    <div className="flex flex-col items-end gap-1.5 shrink-0">
      <Skeleton className="h-4 w-14 rounded-full" />
      <div className="flex gap-1">
        <Skeleton className="h-6 w-14 rounded" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
    </div>
  </div>
);

const CARD_SKELETON = (
  <Card className="border border-border/80 shadow-sm h-full flex flex-col">
    <CardContent className="p-5 flex flex-col flex-1 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="space-y-2 pt-2 border-t border-border/60">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="space-y-1 pt-2 border-t border-border/60">
        <Skeleton className="h-3 w-28 mb-2" />
        {Array.from({ length: 5 }, (_, i) => (
          <React.Fragment key={i}>{TLD_ROW_SKELETON}</React.Fragment>
        ))}
      </div>
      <div className="mt-auto pt-4 border-t border-border/60 flex justify-end">
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>
    </CardContent>
  </Card>
);

// ---------- main components ----------

export function AiDomainSearch() {
  return (
    <CurrencyProvider>
      <AiDomainSearchInner />
    </CurrencyProvider>
  );
}

function AiDomainSearchInner() {
  const [description, setDescription] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<NameSuggestion[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [kenicFeeMap, setKenicFeeMap] = React.useState<Map<string, number>>(new Map());
  const [isLoadingKenicFees, setIsLoadingKenicFees] = React.useState(false);

  const domainSearch = useDomainSearch();
  const currencyContext = useCurrency();
  const { getPricingInfo, hasDefaultSetting, isLoadingTldSettings } =
    useDomainPricing(currencyContext);

  const kenicCheckMutation = trpc.kenic.domainCheck.check.useMutation();

  const generateIdeas = trpc.aiDomainSearch.generateNameIdeas.useMutation({
    onMutate: () => {
      setSuggestions([]);
      setKenicFeeMap(new Map());
      setIsLoadingKenicFees(false);
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions);

      // Batch-fetch KENIC fees for all available KENIC domains at once
      const availableKenicDomains = data.suggestions.flatMap((s) =>
        s.availability
          .filter((e) => e.via === "kenic" && e.available)
          .map((e) => e.domain)
      );

      if (availableKenicDomains.length > 0) {
        setIsLoadingKenicFees(true);
        kenicCheckMutation.mutate(
          { domains: availableKenicDomains, withFee: true, currency: "KES", periodYears: 1 },
          {
            onSuccess: (result) => {
              const normalized =
                "normalized" in result ? (result.normalized as Array<{ domain: string; createFee?: { amount: number } }> | null) : null;
              if (normalized && Array.isArray(normalized)) {
                const map = new Map<string, number>();
                for (const item of normalized) {
                  if (item.createFee?.amount != null) {
                    map.set(item.domain, item.createFee.amount);
                  }
                }
                setKenicFeeMap(map);
              }
              setIsLoadingKenicFees(false);
            },
            onError: () => {
              setIsLoadingKenicFees(false);
            },
          }
        );
      }
    },
  });

  // Sort suggestions: fewest missing TLDs first → most missing last.
  // 0 missing (all available) → 1st, 1 missing → 2nd, 2 missing → 3rd, etc.
  // Secondary tie-break: more total TLDs checked = higher priority (more data shown).
  const sortedSuggestions = React.useMemo(
    () =>
      [...suggestions].sort((a, b) => {
        const aMissing = a.availability.filter((e) => !e.available).length;
        const bMissing = b.availability.filter((e) => !e.available).length;
        if (aMissing !== bMissing) return aMissing - bMissing;
        return b.availability.length - a.availability.length;
      }),
    [suggestions]
  );

  const trimmedDescription = description.trim();
  const canGenerate =
    trimmedDescription.length >= MIN_DESCRIPTION_LENGTH && !generateIdeas.isPending;
  const showDomainSearchBlock = Boolean(domainSearch.searchQueryName);

  const handleSearchDomainFromRow = (domainLabel: string) => {
    const result = domainSearch.triggerSearch(domainLabel);
    if (result.started && result.changed) {
      setIsSearching(true);
    }
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    generateIdeas.mutate({ businessDescription: trimmedDescription });
  };

  return (
    <div className="space-y-6">
      {/* Input card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-base font-semibold tracking-tight">AI Domain Search</h2>
              <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
                Describe your business in detail. We will suggest brand names, check domain
                availability across multiple extensions, and show live pricing.
              </p>
            </div>

            {domainSearch.error && (
              <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{domainSearch.error}</AlertDescription>
              </Alert>
            )}

            {generateIdeas.isError && (
              <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generateIdeas.error.message}</AlertDescription>
              </Alert>
            )}

            <div className="max-w-2xl mx-auto space-y-3">
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes ai-textarea-border {
                  0%   { border-color: rgba(124,58,237,0.7); box-shadow: 0 0 16px 3px rgba(124,58,237,0.4); }
                  33%  { border-color: rgba(37,99,235,0.7);  box-shadow: 0 0 16px 3px rgba(37,99,235,0.4);  }
                  66%  { border-color: rgba(6,182,212,0.7);  box-shadow: 0 0 16px 3px rgba(6,182,212,0.4);  }
                  100% { border-color: rgba(124,58,237,0.7); box-shadow: 0 0 16px 3px rgba(124,58,237,0.4); }
                }
                @keyframes aitab-float {
                  0%, 100% { transform: translateY(0)    scale(1);    }
                  50%       { transform: translateY(-3px) scale(1.2); }
                }
                @keyframes aitab-hue {
                  0%   { color: #7c3aed; }
                  33%  { color: #2563eb; }
                  66%  { color: #06b6d4; }
                  100% { color: #7c3aed; }
                }
                .ai-textarea-wrap {
                  position: relative;
                  border-radius: 12px;
                  padding: 2px;
                  background: transparent;
                  border: 2px solid rgba(124,58,237,0.7);
                  animation: ai-textarea-border 6s linear infinite;
                  transition: all 0.5s ease;
                }
                .ai-textarea-wrap:focus-within {
                  box-shadow: 0 0 26px 5px rgba(124,58,237,0.48);
                }
                .ai-textarea-wrap textarea {
                  border: none !important;
                  box-shadow: none !important;
                  min-height: 4rem !important;
                  transition: min-height 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important;
                  resize: none !important;
                }
                .ai-textarea-wrap:focus-within textarea,
                .ai-textarea-wrap.has-value textarea {
                  min-height: 12rem !important;
                }
                .aitab-icon {
                  display: inline-flex;
                  align-items: center;
                  flex-shrink: 0;
                  animation: aitab-float 2.5s ease-in-out infinite, aitab-hue 6s linear infinite;
                }
              `}} />
              <div className={`ai-textarea-wrap ${description.trim() ? 'has-value' : ''}`}>
                <div className="absolute bottom-4 right-4 pointer-events-none z-10 aitab-icon">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary/80"
                  >
                    <path d="M12 3 L13.5 8.5 L19 10 L13.5 11.5 L12 17 L10.5 11.5 L5 10 L10.5 8.5 Z" />
                    <path d="M19 3 L19.8 5.2 L22 6 L19.8 6.8 L19 9 L18.2 6.8 L16 6 L18.2 5.2 Z" />
                  </svg>
                </div>
                <Textarea
                  placeholder="Describe your business in detail: offer, audience, tone, and where you operate (city/country). Mention language, B2B vs B2C, competitors to avoid, and any words or themes you want the AI to use for locally credible names and TLD guidance."
                  className="text-base leading-relaxed bg-background pr-10"
                  aria-label="Business description for AI domain search"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={generateIdeas.isPending}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                At least {MIN_DESCRIPTION_LENGTH} characters required for AI suggestions.
              </p>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="lg"
                  className="h-12 px-8"
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                >
                  {generateIdeas.isPending ? (
                    <>
                      <Spinner variant="ellipsis" className="h-4 w-4 mr-2" />
                      Generating &amp; checking availability...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate &amp; Check Domains
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results grid */}
      {(generateIdeas.isPending || sortedSuggestions.length > 0) && (
        <div className="max-w-7xl mx-auto w-full space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">
              AI-generated name ideas
            </h3>
          </div>

          {generateIdeas.isPending ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
              {Array.from({ length: 12 }, (_, i) => (
                <li key={i} className="min-w-0">
                  {CARD_SKELETON}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
              {sortedSuggestions.map((row, index) => (
                <li key={`${index}-${row.domainName}`} className="min-w-0">
                  <Card className="border border-border/80 shadow-sm h-full flex flex-col">
                    <CardContent className="p-5 flex flex-col flex-1 gap-0">
                      <div className="space-y-4 flex-1">

                        {/* Business name */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Business name
                          </p>
                          <p className="text-lg font-semibold tracking-tight text-primary leading-snug">
                            {row.businessName}
                          </p>
                        </div>

                        {/* Why it works */}
                        <div className="space-y-1.5 pt-1 border-t border-border/60">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Why it works
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {row.businessDescription}
                          </p>
                        </div>

                        {/* Domain availability rows */}
                        <div className="space-y-0 pt-1 border-t border-border/60">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                            Domain availability
                          </p>
                          {row.availability.map((entry) => (
                            <TldAvailabilityRow
                              key={entry.tld}
                              entry={entry}
                              kenicBaseFee={kenicFeeMap.get(entry.domain)}
                              isLoadingKenicFees={isLoadingKenicFees}
                              getPricingInfo={getPricingInfo}
                              isLoadingTldSettings={isLoadingTldSettings}
                              hasDefaultSetting={hasDefaultSetting}
                              isDomainInCart={domainSearch.isDomainInCart}
                              onAddToCart={domainSearch.handleAddToCart}
                              onRemoveFromCart={domainSearch.handleRemoveFromCart}
                            />
                          ))}
                        </div>

                      </div>

                      {/* Footer: explore more TLDs */}
                      <div className="mt-4 pt-4 border-t border-border/60 flex justify-end shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 gap-1.5"
                          title="Open Domain Search panel to explore more TLDs"
                          disabled={isSearching}
                          onClick={() => handleSearchDomainFromRow(row.domainName)}
                        >
                          {isSearching ? (
                            <>
                              <Spinner variant="ellipsis" className="h-3.5 w-3.5" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <Search className="h-3.5 w-3.5" />
                              More TLDs &amp; Register
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Deep-search panel (triggered by "More TLDs & Register") */}
      {showDomainSearchBlock && (
        <div className="max-w-7xl mx-auto w-full">
          <DomainSearchResults
            searchQuery={domainSearch.searchQueryName}
            rawSearchQuery={domainSearch.rawSearchQueryForResults}
            error={domainSearch.error}
            isDomainInCart={domainSearch.isDomainInCart}
            onAddToCart={domainSearch.handleAddToCart}
            onRemoveFromCart={domainSearch.handleRemoveFromCart}
            onLoadingChange={setIsSearching}
          />
        </div>
      )}
    </div>
  );
}
