import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Search, CheckCircle2, XCircle, Loader2, Link2,
  ArrowLeftRight, AlertCircle, Globe, Eye, EyeOff, Key,
} from "lucide-react";
import {
  EppGuide,
  TransferCheckReport,
  announceRecheck,
} from "@/components/domain-transfer/TransferCheckReport.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Label } from "@/components/ui/label.tsx";
import { trpcQuery } from "@/lib/domain-search/api.ts";
import { checkKenicDomains } from "@/lib/domain-search/kenic-check.ts";
import {
  checkDomainTransfer,
  type CheckTransferResult,
  type TransferProvider,
} from "@/lib/domain-transfer-api.ts";
import {
  sanitizeDomainName,
  isValidSearchQuery,
  toSingleLabelName,
  nameForOpenProvider,
} from "@/lib/domain-search/search-utils.ts";
import {
  isUnavailableKenicTld,
  KENIC_CHECK_FAILED_REASON,
  normalizeToKenicCards,
  parseFullDomain,
} from "@/lib/domain-search/kenic-schema.ts";
import { getRecommendedBatch } from "@/lib/domain-search/tld-sections.ts";
import { PricingProvider, usePricing } from "@/lib/domain-search/pricing-context.tsx";
import { kenicItemToDomainSearchResult } from "@/lib/domain-search/to-domain-search-result.ts";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import { cn } from "@/lib/utils.ts";
import { CartPillTabs } from "./CartPillTabs.tsx";
import { ServiceIcon } from "./service-icon.tsx";
import { useCurrency } from "@/components/providers/currency.tsx";
import { convertKesForDisplay, formatCurrency } from "@/lib/currency.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectedDomain {
  domain: string;
  priceKes: number;
  isExisting?: boolean;
  isTransfer?: boolean;
  provider?: TransferProvider;
}

interface DomainUpsellProps {
  selectedDomain: SelectedDomain | null;
  onDomainSelect: (domain: SelectedDomain | null) => void;
  transferAuthCode?: string;
  onTransferAuthCodeChange?: (code: string) => void;
}

function getExtKey(domain: string): string {
  const d = domain.toLowerCase();
  if (d.endsWith(".co.ke")) return "co.ke";
  const parts = d.split(".");
  return parts.length >= 2 ? parts.slice(1).join(".") : d;
}

function sortDomainResults(
  results: DomainSearchResult[],
  order: string[],
  exactDomain?: string | null,
): DomainSearchResult[] {
  const rank = new Map(order.map((ext, i) => [ext.toLowerCase(), i]));
  return [...results].sort((a, b) => {
    if (exactDomain) {
      const aExact = a.domain.toLowerCase() === exactDomain;
      const bExact = b.domain.toLowerCase() === exactDomain;
      if (aExact !== bExact) return aExact ? -1 : 1;
    }
    return (rank.get(getExtKey(a.domain)) ?? 999) - (rank.get(getExtKey(b.domain)) ?? 999);
  });
}

// Validate a full domain the user already owns
function isValidExistingDomain(value: string): boolean {
  const v = value.trim().toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0] ?? "";
  if (!v || v.length > 253) return false;
  const labels = v.split(".");
  if (labels.length < 2) return false;
  return labels.every(
    (l) => l.length > 0 && l.length <= 63 && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(l),
  );
}

// ---------------------------------------------------------------------------
// Inner component (needs PricingProvider context)
// ---------------------------------------------------------------------------

function DomainUpsellInner({
  selectedDomain,
  onDomainSelect,
  transferAuthCode = "",
  onTransferAuthCodeChange,
}: DomainUpsellProps) {
  const { calculatePricesBatch, getPricingInfo, isConversionAvailable } = usePricing();
  const { currency, kesToCurrencyRate } = useCurrency();
  const formatDisplayKes = (amountKes: number) =>
    kesToCurrencyRate === null
      ? null
      : formatCurrency(
          convertKesForDisplay(amountKes, currency, kesToCurrencyRate),
          currency,
        );

  // ---- Search state ----
  const [input, setInput] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [searchTrigger, setSearchTrigger] = React.useState<{
    name: string;
    raw: string;
    exactDomain: string | null;
    id: number;
  } | null>(null);
  const [results, setResults] = React.useState<DomainSearchResult[]>([]);
  const [batchIndex, setBatchIndex] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [pendingDomains, setPendingDomains] = React.useState<string[]>([]);

  // ---- Own-domain state ----
  const [ownDomainInput, setOwnDomainInput] = React.useState("");
  const [ownDomainError, setOwnDomainError] = React.useState<string | null>(null);

  // ---- Transfer state ----
  const [transferInput, setTransferInput] = React.useState("");
  const [transferStatus, setTransferStatus] = React.useState<"idle" | "loading" | "valid" | "error">("idle");
  const [transferMessage, setTransferMessage] = React.useState("");
  const [transferResult, setTransferResult] = React.useState<CheckTransferResult | null>(null);
  const [transferPriceKes, setTransferPriceKes] = React.useState<number | null>(null);
  const [transferPricingLoading, setTransferPricingLoading] = React.useState(false);
  const [showEppCode, setShowEppCode] = React.useState(false);

  const checkTransferMutation = useMutation({
    mutationFn: checkDomainTransfer,
  });

  // ---- Tab ----
  const [tab, setTab] = React.useState<"search" | "own" | "transfer">("search");

  const handleTabChange = (value: string) => {
    const nextTab = value as "search" | "own" | "transfer";
    setTab(nextTab);
    onDomainSelect(null);
    onTransferAuthCodeChange?.("");
    setOwnDomainInput("");
    setTransferInput("");
    setTransferStatus("idle");
    setTransferMessage("");
    setTransferResult(null);
    setTransferPriceKes(null);
    setValidationError(null);
    setOwnDomainError(null);
    setResults([]);
    setSearchTrigger(null);
  };

  const fetchRecommendedBatch = React.useCallback(
    async (
      name: string,
      batchIdx: number,
      exactDomain: string | null,
      onPartial?: (partial: DomainSearchResult[], pending: string[]) => void,
    ) => {
      const batch = getRecommendedBatch(batchIdx);
      const order = [...batch.kenic, ...batch.open];
      const out: DomainSearchResult[] = [];
      const pending = new Set<string>();

      const finalize = () => {
        const seen = new Set<string>();
        const unique = out.filter((r) => {
          const key = r.domain.toLowerCase();
          // Never surface non-purchasable KENIC SLDs (e.g. .go.ke)
          if (isUnavailableKenicTld(key)) return false;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return sortDomainResults(unique, order, exactDomain);
      };

      const kenicCheck = async (domains: string[], label: string) => {
        const data = await checkKenicDomains(domains);
        return normalizeToKenicCards(label, data?.normalized ?? []).map((item) => {
          const createCalc = getPricingInfo(item.domain, item.createPrice ?? 0, item.currency ?? "KES");
          return kenicItemToDomainSearchResult(item, { createFinal: createCalc.finalPrice, createCalc });
        });
      };

      const openCheck = async (label: string, extensions: string[]) => {
        const res = await trpcQuery<{
          success: boolean;
          data?: {
            results: Array<{
              domain: string;
              status: string;
              reason?: string;
              price?: DomainSearchResult["price"];
            }>;
          };
        }>("openProvider.domains.checkAvailability", {
          name: nameForOpenProvider(label),
          extensions,
          with_price: true,
          with_whois: false,
        });
        if (!res?.success || !res.data?.results) return [];
        const raw: DomainSearchResult[] = res.data.results.map((r) => ({
          domain: r.domain ?? "",
          status: r.status ?? "unknown",
          reason: r.reason,
          price: r.price,
        }));
        return calculatePricesBatch(raw).catch(() => raw);
      };

      // OpenProvider answers in about a second; KeNIC can take several. Run both and show each as it lands.
      const track = (domains: string[], task: Promise<DomainSearchResult[]>) => {
        for (const d of domains) pending.add(d.toLowerCase());
        return task
          .then((found) => {
            out.push(...found);
          })
          .catch(() => {
            // one registry failing should not hide the other's results
          })
          .finally(() => {
            for (const d of domains) pending.delete(d.toLowerCase());
            onPartial?.(finalize(), [...pending]);
          });
      };

      const tasks: Promise<void>[] = [];

      // If user typed a full domain with a TLD not in this batch, check it too on batch 0.
      if (batchIdx === 0 && exactDomain) {
        const parsed = parseFullDomain(exactDomain);
        if (parsed && !batch.kenic.includes(parsed.tld) && !batch.open.includes(parsed.tld)) {
          const isKe = parsed.tld === "co.ke" || parsed.tld === "ke" || parsed.tld.endsWith(".ke");
          tasks.push(
            track(
              [exactDomain],
              isKe ? kenicCheck([exactDomain], parsed.name) : openCheck(parsed.name, [parsed.tld]),
            ),
          );
        }
      }

      if (batch.open.length > 0) {
        tasks.push(track(batch.open.map((tld) => `${name}.${tld}`), openCheck(name, batch.open)));
      }

      if (batch.kenic.length > 0) {
        const kenicDomains = batch.kenic.map((tld) => `${name}.${tld}`);
        tasks.push(track(kenicDomains, kenicCheck(kenicDomains, name)));
      }

      await Promise.all(tasks);

      return {
        results: finalize(),
        hasMore: batch.hasMore,
      };
    },
    [calculatePricesBatch, getPricingInfo],
  );

  // ---- Trigger search ----
  const handleSearch = () => {
    const raw = input.trim();
    const sanitized = sanitizeDomainName(input);
    if (!sanitized) {
      setValidationError("Please enter a domain name to search.");
      return;
    }
    if (!isValidSearchQuery(sanitized)) {
      setValidationError("Enter a valid domain name  letters, numbers and hyphens only.");
      return;
    }
    setValidationError(null);
    const name = toSingleLabelName(sanitized);
    const cleanedRaw = raw
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      ?.trim() ?? "";
    const parsed = cleanedRaw.includes(".") ? parseFullDomain(cleanedRaw) : null;
    const exactDomain =
      parsed && !isUnavailableKenicTld(parsed.tld)
        ? `${parsed.name}.${parsed.tld}`.toLowerCase()
        : null;
    setSearchTrigger((prev) => ({
      name,
      raw: cleanedRaw,
      exactDomain,
      id: (prev?.id ?? 0) + 1,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (validationError) setValidationError(null);
    if (results.length) {
      setResults([]);
      setSearchTrigger(null);
      setBatchIndex(0);
      setHasMore(true);
    }
  };

  // ---- Fetch batch 0 when searchTrigger.id changes ----
  React.useEffect(() => {
    if (!searchTrigger) return;
    const { name, exactDomain } = searchTrigger;

    let cancelled = false;
    setIsLoading(true);
    setIsError(false);
    setResults([]);
    setBatchIndex(0);
    setHasMore(true);

    setPendingDomains([]);

    fetchRecommendedBatch(name, 0, exactDomain, (partial, pending) => {
      if (cancelled) return;
      setResults(partial);
      setPendingDomains(pending);
      if (partial.length > 0) setIsLoading(false);
    })
      .then(({ results: next, hasMore: more }) => {
        if (cancelled) return;
        setResults(next);
        setPendingDomains([]);
        setHasMore(more);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIsError(true);
          setPendingDomains([]);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchTrigger?.id, fetchRecommendedBatch]);

  const handleListMore = async () => {
    if (!searchTrigger || isLoadingMore || !hasMore) return;
    const nextIndex = batchIndex + 1;
    setIsLoadingMore(true);
    try {
      const { results: next, hasMore: more } = await fetchRecommendedBatch(
        searchTrigger.name,
        nextIndex,
        null,
      );
      setResults((prev) => {
        const seen = new Set(prev.map((r) => r.domain.toLowerCase()));
        return [...prev, ...next.filter((r) => !seen.has(r.domain.toLowerCase()))];
      });
      setBatchIndex(nextIndex);
      setHasMore(more);
    } catch {
      // keep current results
    } finally {
      setIsLoadingMore(false);
    }
  };

  const lastTransferResultRef = React.useRef<CheckTransferResult | null>(null);

  const applyTransferCheckResult = React.useCallback((result: CheckTransferResult) => {
    announceRecheck(lastTransferResultRef.current, result);
    lastTransferResultRef.current = result;
    setTransferResult(result);

    if (result.transferrable && result.domain && result.provider) {
      setTransferStatus("valid");
      setTransferMessage("");
      return;
    }

    setTransferStatus("error");
    setTransferMessage(result.error ?? "This domain cannot be transferred.");
    setTransferPriceKes(null);
  }, []);

  const handleTransferCheck = React.useCallback(async () => {
    const trimmed = transferInput.trim();
    if (!trimmed) {
      setTransferStatus("error");
      setTransferMessage("Enter a domain name to transfer (e.g. example.com)");
      setTransferResult(null);
      setTransferPriceKes(null);
      return;
    }

    const sameDomain =
      lastTransferResultRef.current?.domain?.toLowerCase() === trimmed.toLowerCase();
    if (!sameDomain) {
      lastTransferResultRef.current = null;
      setTransferResult(null);
    }
    setTransferStatus("loading");
    setTransferMessage("");
    setTransferPriceKes(null);

    try {
      const result = await checkTransferMutation.mutateAsync(trimmed);
      applyTransferCheckResult(result);
    } catch {
      setTransferStatus("error");
      setTransferMessage("Something went wrong. Please try again.");
      setTransferResult(null);
      setTransferPriceKes(null);
    }
  }, [transferInput, checkTransferMutation, applyTransferCheckResult]);

  React.useEffect(() => {
    if (
      transferStatus !== "valid" ||
      !transferResult?.transferrable ||
      !transferResult.domain ||
      transferResult.price == null
    ) {
      if (transferPriceKes !== null && transferStatus !== "valid") {
        setTransferPriceKes(null);
      }
      setTransferPricingLoading(false);
      return;
    }

    const rawResult: DomainSearchResult = {
      domain: transferResult.domain,
      status: "free",
      price: {
        product: {
          price: transferResult.price,
          currency: transferResult.currency ?? "USD",
        },
        reseller: {
          price: transferResult.price,
          currency: transferResult.currency ?? "USD",
        },
      },
      reason: `Transfer: ${transferResult.domain}`,
    };

    let cancelled = false;
    setTransferPricingLoading(true);
    const sourceCurrency = transferResult.currency ?? "USD";
    if (sourceCurrency !== "KES" && !isConversionAvailable) {
      setTransferPriceKes(null);
      setTransferPricingLoading(false);
      return;
    }
    calculatePricesBatch([rawResult])
      .then((priced) => {
        if (cancelled) return;
        const calc = priced[0]?.price?.calculated as
          | { convertedPrice?: number; finalPrice: number }
          | undefined;
        const amount = calc?.convertedPrice ?? calc?.finalPrice ?? transferResult.price ?? 0;
        setTransferPriceKes(Math.ceil(amount));
      })
      .catch(() => {
        if (!cancelled) setTransferPriceKes(null);
      })
      .finally(() => {
        if (!cancelled) setTransferPricingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [transferStatus, transferResult, calculatePricesBatch, isConversionAvailable]);

  const transferReady =
    transferStatus === "valid" &&
    transferResult?.transferrable &&
    transferResult.provider != null &&
    !transferPricingLoading &&
    transferPriceKes != null &&
    transferPriceKes > 0;

  const transferApiStatus = transferResult?.transferStatus;

  // ---- Helpers ----
  const isAvailable = (r: DomainSearchResult) => r.status === "free" || r.status === "available";

  const getDomainPrice = (r: DomainSearchResult): number | null => {
    const sourceCurrency = r.price?.reseller?.currency ?? r.price?.product?.currency;
    if (sourceCurrency && sourceCurrency !== "KES" && !isConversionAvailable) return null;
    const calc = r.price?.calculated;
    if (calc?.displayCurrency === "KES" && calc.convertedPrice) {
      return Math.ceil(calc.convertedPrice);
    }
    if (calc?.currency === "KES" && calc.finalPrice) return Math.ceil(calc.finalPrice);
    if (r.price?.product?.currency === "KES" && r.price.product.price) {
      return Math.ceil(r.price.product.price);
    }
    return null;
  };

  // ---- Add own domain ----
  const handleAddOwnDomain = () => {
    const v = ownDomainInput.trim().toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0] ?? "";
    if (!isValidExistingDomain(v)) {
      setOwnDomainError("Enter a valid domain (e.g. mybusiness.com).");
      return;
    }
    setOwnDomainError(null);
    onDomainSelect({ domain: v, priceKes: 0, isExisting: true });
  };

  const searchedName = searchTrigger?.name ?? "";

  return (
    <section aria-labelledby="cart-domain-heading" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <ServiceIcon serviceType="domain_registration" size="md" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="cart-domain-heading" className="text-lg font-semibold leading-snug text-foreground">
              Add a domain, if you want one
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Register a new name, transfer one, or use a domain you already have elsewhere. You can also continue and connect it later.
          </p>
        </div>
      </div>

      <CartPillTabs
        value={tab}
        onValueChange={handleTabChange}
        ariaLabel="Domain options"
        tabs={[
          {
            value: "search",
            label: "Search & register",
            icon: <Search className="h-3.5 w-3.5 shrink-0" />,
          },
          {
            value: "transfer",
            label: "Transfer domain",
            icon: <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />,
          },
          {
            value: "own",
            label: "Connect my domain",
            icon: <Link2 className="h-3.5 w-3.5 shrink-0" />,
          },
        ]}
      />

      {/* ── Search tab ── */}
      {tab === "search" && (
        <>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <label htmlFor="cart-domain-search" className="sr-only">
              Search for a domain
            </label>
            <div
              className={cn(
                "flex items-center gap-2 rounded-2xl border bg-background p-1.5 pl-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
                validationError ? "border-destructive" : "border-border",
              )}
            >
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                id="cart-domain-search"
                value={input}
                onChange={handleInputChange}
                placeholder="yourbusiness or yourbusiness.com"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={validationError ? true : undefined}
                aria-describedby={validationError ? "cart-domain-search-error" : undefined}
                className="h-11 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-11 shrink-0 rounded-xl px-5 font-semibold"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : "Check"}
                <span className="sr-only">{isLoading ? "Checking availability" : ""}</span>
              </Button>
            </div>
            {validationError && (
              <p id="cart-domain-search-error" className="mt-1.5 text-xs text-destructive">
                {validationError}
              </p>
            )}
          </form>

          {(searchedName || isLoading) && (() => {
            const available = results.filter(isAvailable);
            const unchecked = results.filter((r) => !isAvailable(r) && r.reason === KENIC_CHECK_FAILED_REASON);
            const taken = results.filter((r) => !isAvailable(r) && r.reason !== KENIC_CHECK_FAILED_REASON);
            const shownDomains = new Set(results.map((r) => r.domain.toLowerCase()));
            const stillChecking = pendingDomains.filter((d) => !shownDomains.has(d) && !isUnavailableKenicTld(d));
            return (
              <div className="mt-4" aria-live="polite" aria-busy={isLoading || stillChecking.length > 0}>
                {isError && (
                  <p className="py-2 text-sm text-destructive">Could not fetch results. Please try again.</p>
                )}

                {isLoading && results.length === 0 && (
                  <div className="grid grid-cols-[minmax(0,1fr)] gap-2" aria-label={`Checking availability for ${searchedName}`}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-[68px] animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
                    ))}
                  </div>
                )}

                {!isLoading && !isError && results.length === 0 && stillChecking.length === 0 && searchedName && (
                  <p className="py-2 text-sm text-muted-foreground">No results found. Try a different name.</p>
                )}

                {(available.length > 0 || stillChecking.length > 0) && (
                  <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
                    {available.map((r) => {
                      const price = getDomainPrice(r);
                      const displayPrice = price === null ? null : formatDisplayKes(price);
                      const isSelected = selectedDomain?.domain === r.domain;
                      const isExact =
                        !!searchTrigger?.exactDomain && r.domain.toLowerCase() === searchTrigger.exactDomain;
                      const disabled = price === null || kesToCurrencyRate === null;
                      return (
                        <li key={r.domain}>
                          <div
                            className={cn(
                              "flex min-h-[68px] w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left",
                              disabled && "opacity-60",
                              isSelected
                                ? "border-primary bg-primary/[0.07] ring-1 ring-primary"
                                : "border-border bg-card",
                            )}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border text-transparent",
                              )}
                            >
                              <CheckCircle2 className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-foreground">{r.domain}</span>
                              <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                {isExact ? (
                                  <span className="font-semibold text-primary">Your exact name is available</span>
                                ) : (
                                  <span className="text-emerald-700 dark:text-emerald-400">Available</span>
                                )}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              {price === null ? (
                                <span className="text-xs text-muted-foreground">Price unavailable</span>
                              ) : (
                                <span className="text-sm font-bold tabular-nums text-foreground">
                                  {displayPrice ?? "…"}
                                  <span className="ml-0.5 text-xs font-normal text-muted-foreground">/yr</span>
                                </span>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                aria-pressed={isSelected}
                                disabled={disabled}
                                onClick={() =>
                                  onDomainSelect(isSelected ? null : { domain: r.domain, priceKes: price! })
                                }
                                className={cn(
                                  "h-8 min-h-0 rounded-full px-3 text-xs",
                                  isSelected
                                    ? "border-transparent text-muted-foreground hover:text-destructive"
                                    : "border-primary/40 text-primary hover:bg-primary/10",
                                )}
                              >
                                {isSelected ? "Remove" : "Add to cart"}
                              </Button>
                            </span>
                          </div>
                        </li>
                      );
                    })}
                    {stillChecking.map((d) => (
                      <li
                        key={d}
                        className="flex min-h-[68px] items-center gap-3 rounded-xl border border-dashed border-border px-3.5 py-3"
                      >
                        <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{d}</span>
                          <span className="text-xs text-muted-foreground">Checking with the registry…</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {taken.length > 0 && (
                  <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                    <XCircle className="mt-px size-3.5 shrink-0" aria-hidden />
                    <span>
                      <span className="font-medium">Taken:</span> {taken.map((r) => r.domain).join(", ")}
                    </span>
                  </p>
                )}

                {unchecked.length > 0 && (
                  <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
                    <span>
                      <span className="font-medium">Couldn&apos;t check right now:</span>{" "}
                      {unchecked.map((r) => r.domain).join(", ")}. Search again in a moment.
                    </span>
                  </p>
                )}

                {isLoadingMore && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                    Loading more extensions…
                  </div>
                )}

                {hasMore && !isLoading && stillChecking.length === 0 && results.length > 0 && (
                  <div className="mt-3 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11 rounded-xl text-primary"
                      disabled={isLoadingMore}
                      onClick={() => void handleListMore()}
                    >
                      {isLoadingMore ? "Loading…" : "Show more extensions"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}

          {!searchedName && !isLoading && (
            <p className="mt-3 text-xs text-muted-foreground">
              Type a name or a full domain. We check .co.ke, .ke, .com, .net, .store, .app and more.
            </p>
          )}
        </>
      )}

      {/* ── Transfer tab ── */}
      {tab === "transfer" && (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Enter the full domain you want to transfer. We&apos;ll check eligibility and pricing before you add it.
          </p>
          <div className="flex gap-2">
            <Input
              value={transferInput}
              onChange={(e) => {
                setTransferInput(e.target.value);
                if (transferStatus !== "idle") {
                  setTransferStatus("idle");
                  setTransferMessage("");
                  lastTransferResultRef.current = null;
                  setTransferResult(null);
                  setTransferPriceKes(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTransferCheck();
              }}
              placeholder="e.g. mybusiness.com"
              className="h-11 rounded-xl text-sm"
              disabled={transferStatus === "loading"}
            />
            <Button
              onClick={handleTransferCheck}
              disabled={transferStatus === "loading" || !transferInput.trim()}
              className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0"
            >
              {transferStatus === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Check"
              )}
            </Button>
          </div>

          {transferStatus === "error" && transferApiStatus === "available" && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex gap-3">
                <Globe className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Available for registration</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {transferMessage} Use the Search &amp; register tab instead.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => handleTabChange("search")}
              >
                Search to register
              </Button>
            </div>
          )}

          {transferResult &&
            !transferResult.transferrable &&
            transferApiStatus !== "available" && (
              <TransferCheckReport
                className="mt-4"
                result={transferResult}
                onCheckAgain={handleTransferCheck}
                checking={transferStatus === "loading"}
              />
            )}

          {transferStatus === "error" && transferMessage && !transferResult && (
            <div className="mt-4 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
              <div>
                <h4 className="text-sm font-semibold text-destructive">We couldn&apos;t check this domain</h4>
                <p className="mt-1 text-sm text-muted-foreground">{transferMessage}</p>
              </div>
            </div>
          )}

          {transferStatus === "valid" && transferPricingLoading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Applying pricing…
            </div>
          )}

          {transferReady && transferResult && (
            <div className="mt-4">
              <div
                className={cn(
                  "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all",
                  selectedDomain?.domain === transferResult.domain
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 bg-card",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowLeftRight className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-foreground truncate block">
                      {transferResult.domain}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Transfer + 1 year renewal
                      {transferResult.details?.registrar
                        ? ` · from ${transferResult.details.registrar}`
                        : ""}
                    </span>
                  </div>
                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20 hidden sm:inline-flex shrink-0">
                    Ready to transfer
                  </Badge>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-foreground whitespace-nowrap">
                    {formatDisplayKes(transferPriceKes!) ?? "Updating price…"}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 min-h-0 rounded-full px-3 text-xs",
                      selectedDomain?.domain === transferResult.domain
                        ? "border-transparent text-muted-foreground hover:text-destructive"
                        : "border-primary/40 text-primary hover:bg-primary/10",
                    )}
                    disabled={kesToCurrencyRate === null}
                    aria-pressed={selectedDomain?.domain === transferResult.domain}
                    onClick={() => {
                      if (selectedDomain?.domain === transferResult.domain) {
                        onDomainSelect(null);
                        onTransferAuthCodeChange?.("");
                        return;
                      }
                      onDomainSelect({
                        domain: transferResult.domain,
                        priceKes: transferPriceKes!,
                        isTransfer: true,
                        provider: transferResult.provider ?? undefined,
                      });
                    }}
                  >
                    {selectedDomain?.domain === transferResult.domain ? "Remove" : "Add to cart"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Own domain tab ── */}
      {tab === "own" && (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Keep your domain where it is and point it to your new service. Nothing is added to your bill.
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={ownDomainInput}
                onChange={(e) => {
                  setOwnDomainInput(e.target.value);
                  if (ownDomainError) setOwnDomainError(null);
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddOwnDomain(); }}
                placeholder="e.g. mybusiness.com"
                aria-label="Domain you already own"
                className={cn(
                  "h-11 rounded-xl text-sm",
                  ownDomainError && "border-destructive focus-visible:ring-destructive",
                )}
              />
              {ownDomainError && (
                <p className="text-xs text-destructive mt-1">{ownDomainError}</p>
              )}
            </div>
            <Button
              onClick={handleAddOwnDomain}
              disabled={!ownDomainInput.trim()}
              variant="outline"
              className="h-8 min-h-0 shrink-0 self-center rounded-full border-primary/40 px-3 text-xs text-primary hover:bg-primary/10"
            >
              Connect
            </Button>
          </div>
          <ol className="mt-3 space-y-1 text-xs text-muted-foreground">
            <li>1. Your domain stays registered with your current provider.</li>
            <li>2. After setup, update its nameservers or DNS records there to point to Nisc Cloud.</li>
            <li>3. Want everything in one place later? You can transfer it to us any time.</li>
          </ol>
        </>
      )}

      {/* Selected domain confirmation */}
      {selectedDomain && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            {selectedDomain.isTransfer ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            ) : (
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-1" aria-hidden />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {selectedDomain.domain}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-0.5",
                      "text-muted-foreground",
                    )}
                  >
                    {selectedDomain.isExisting
                      ? "Connected to your order · stays with your current provider · no charge"
                      : selectedDomain.isTransfer
                        ? "Domain transfer added to your order"
                        : "Domain registration added to your order"}
                    {!selectedDomain.isExisting && selectedDomain.priceKes > 0 && (
                      <span className="ml-1">
                        · {formatDisplayKes(selectedDomain.priceKes) ?? "Updating price…"}
                        {selectedDomain.isTransfer ? "" : "/yr"}
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 min-h-0 shrink-0 rounded-full px-3 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    onDomainSelect(null);
                    onTransferAuthCodeChange?.("");
                    setOwnDomainInput("");
                  }}
                >
                  Remove
                </Button>
              </div>

              {selectedDomain.isTransfer && onTransferAuthCodeChange && (
                <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex items-start gap-2">
                    <Key className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <Label htmlFor="upsell-transfer-epp" className="text-sm font-semibold text-foreground">
                        Authorization code (EPP)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Get this code from your current registrar. Required before checkout.
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="upsell-transfer-epp"
                      type={showEppCode ? "text" : "password"}
                      value={transferAuthCode}
                      onChange={(e) => onTransferAuthCodeChange(e.target.value)}
                      placeholder="Enter authorization code"
                      className="pr-10"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowEppCode((prev) => !prev)}
                      aria-label={showEppCode ? "Hide authorization code" : "Show authorization code"}
                    >
                      {showEppCode ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-3">
                    <EppGuide
                      registrar={
                        transferResult?.domain === selectedDomain.domain && transferResult.details?.registrar
                          ? transferResult.details.registrar
                          : "your current registrar"
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Exported wrapper  wraps with PricingProvider
// ---------------------------------------------------------------------------

export function DomainUpsell(props: DomainUpsellProps) {
  return (
    <PricingProvider>
      <DomainUpsellInner {...props} />
    </PricingProvider>
  );
}
