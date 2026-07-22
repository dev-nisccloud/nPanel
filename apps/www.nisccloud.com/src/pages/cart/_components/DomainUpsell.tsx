import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Search, CheckCircle2, XCircle, Loader2, Plus, Minus, Link2,
  ArrowLeftRight, AlertCircle, Lock, Globe, Eye, EyeOff, Key,
} from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Label } from "@/components/ui/label.tsx";
import { trpcQuery, trpcMutation } from "@/lib/domain-search/api.ts";
import {
  checkDomainTransfer,
  type CheckTransferResult,
  type TransferProvider,
} from "@/lib/domain-transfer-api.ts";
import {
  sanitizeDomainName,
  isValidSearchQuery,
  toSingleLabelName,
} from "@/lib/domain-search/search-utils.ts";
import {
  buildKenicDomainsFromQuery,
  normalizeToKenicCards,
} from "@/lib/domain-search/kenic-schema.ts";
import { PricingProvider, usePricing } from "@/lib/domain-search/pricing-context.tsx";
import { kenicItemToDomainSearchResult } from "@/lib/domain-search/to-domain-search-result.ts";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import { cn } from "@/lib/utils.ts";
import { CartPillTabs } from "./CartPillTabs.tsx";

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
  /** When true, copy makes clear a domain is mandatory before checkout. */
  required?: boolean;
}

// ---------------------------------------------------------------------------
// Provider split config
// ---------------------------------------------------------------------------

/** TLDs routed to OpenProvider (gTLD) */
const OP_TLDS = ["com", "net", "org", "africa"];

/** KENIC TLD FQDNs to always check (name is filled in at runtime) */
const KENIC_TLDS_TO_CHECK = ["co.ke", "ke"];

/**
 * Display order for combined results  put .co.ke and .com first
 * (anything not listed falls to the end in arrival order).
 */
const TLD_SORT_ORDER = ["co.ke", "com", "ke", "net", "org", "africa"];

function tldSortIndex(domain: string): number {
  for (let i = 0; i < TLD_SORT_ORDER.length; i++) {
    if (domain.endsWith(`.${TLD_SORT_ORDER[i]}`)) return i;
  }
  return TLD_SORT_ORDER.length;
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
  required = false,
}: DomainUpsellProps) {
  const { calculatePricesBatch, getPricingInfo } = usePricing();

  // ---- Search state ----
  const [input, setInput] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [searchTrigger, setSearchTrigger] = React.useState<{ name: string; id: number } | null>(null);
  const [results, setResults] = React.useState<DomainSearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

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

  // ---- Trigger search ----
  const handleSearch = () => {
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
    // Always increment id so the effect re-fires even for the same name
    setSearchTrigger((prev) => ({ name, id: (prev?.id ?? 0) + 1 }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (validationError) setValidationError(null);
    if (results.length) {
      setResults([]);
      setSearchTrigger(null);
    }
  };

  // ---- Fetch: fires every time searchTrigger.id changes ----
  React.useEffect(() => {
    if (!searchTrigger) return;
    const { name } = searchTrigger;

    let cancelled = false;
    setIsLoading(true);
    setIsError(false);
    setResults([]);

    // ---- OpenProvider (gTLDs) ----
    const opPromise = trpcQuery<{
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
      name,
      extensions: OP_TLDS,
      with_price: true,
      with_whois: false,
    }).then(async (res) => {
      if (!res?.success || !res.data?.results) return [] as DomainSearchResult[];
      const raw: DomainSearchResult[] = res.data.results.map((r) => ({
        domain: r.domain ?? "",
        status: r.status ?? "unknown",
        reason: r.reason,
        price: r.price,
      }));
      return calculatePricesBatch(raw).catch(() => raw);
    }).catch(() => [] as DomainSearchResult[]);

    // ---- KENIC (.co.ke, .ke) ----
    const kenicDomains = KENIC_TLDS_TO_CHECK.map((tld) => `${name}.${tld}`);
    const kenicPromise = trpcMutation<{
      normalized?: Array<{
        domain: string;
        available: boolean;
        reason?: string;
        currency?: string;
        createFee?: { amount: number; currency: string };
        renewFee?: { amount: number; currency: string };
        transferFee?: { amount: number; currency: string };
      }>;
    }>("kenic.domainCheck.check", {
      domains: kenicDomains,
      withFee: true,
      currency: "KES",
      periodYears: 1,
    }).then((data) => {
      const normalized = data?.normalized;
      if (!normalized) return [] as DomainSearchResult[];
      const cards = normalizeToKenicCards(name, normalized);
      return cards.map((item) => {
        const createCalc = getPricingInfo(item.domain, item.createPrice ?? 0, item.currency ?? "KES");
        return kenicItemToDomainSearchResult(item, {
          createFinal: createCalc.finalPrice,
          createCalc,
        });
      });
    }).catch(() => [] as DomainSearchResult[]);

    Promise.all([opPromise, kenicPromise]).then(([opResults, kenicResults]) => {
      if (cancelled) return;
      const combined = [...opResults, ...kenicResults].sort(
        (a, b) => tldSortIndex(a.domain) - tldSortIndex(b.domain),
      );
      setResults(combined);
      setIsLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setIsError(true);
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTrigger?.id]);

  const applyTransferCheckResult = React.useCallback((result: CheckTransferResult) => {
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

    setTransferStatus("loading");
    setTransferMessage("");
    setTransferResult(null);
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
  }, [transferStatus, transferResult, calculatePricesBatch]);

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

  const getDomainPrice = (r: DomainSearchResult): number => {
    const calc = r.price?.calculated;
    if (calc?.convertedPrice) return Math.ceil(calc.convertedPrice);
    if (calc?.finalPrice) return Math.ceil(calc.finalPrice);
    if (r.price?.product?.price) return Math.ceil(r.price.product.price);
    return 0;
  };

  // ---- Add own domain ----
  const handleAddOwnDomain = () => {
    const v = ownDomainInput.trim().toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0] ?? "";
    if (!isValidExistingDomain(v)) {
      setOwnDomainError("Enter a valid domain (e.g. mybusiness.co.ke or mybusiness.com).");
      return;
    }
    setOwnDomainError(null);
    onDomainSelect({ domain: v, priceKes: 0, isExisting: true });
  };

  const searchedName = searchTrigger?.name ?? "";

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Search className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-base font-bold text-foreground">
          {required ? "Domain required" : "Secure your domain"}
        </h3>
        {required && (
          <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">
            Required
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {required
          ? "This hosting plan needs a domain before you can continue. Register a new one, transfer from elsewhere, or connect a domain you already own."
          : "Search to register a new domain, transfer one you own elsewhere, or connect an existing domain."}
      </p>

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
            label: "I already have one",
            icon: <Link2 className="h-3.5 w-3.5 shrink-0" />,
          },
        ]}
      />

      {/* ── Search tab ── */}
      {tab === "search" && (
        <>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                placeholder="e.g. mybusiness (without extension)"
                className={cn(
                  "h-11 rounded-xl text-sm",
                  validationError && "border-destructive focus-visible:ring-destructive",
                )}
              />
              {validationError && (
                <p className="text-xs text-destructive mt-1">{validationError}</p>
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !input.trim()}
              className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {/* Results */}
          {(searchedName || isLoading) && (
            <div className="mt-4 space-y-2">
              {isError && (
                <p className="text-sm text-destructive py-2">
                  Could not fetch results. Please try again.
                </p>
              )}

              {isLoading && (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking availability for{" "}
                  <strong className="text-foreground">{searchedName}</strong>…
                </div>
              )}

              {!isLoading && !isError && results.length === 0 && searchedName && (
                <p className="text-sm text-muted-foreground py-2">No results found.</p>
              )}

              {!isLoading &&
                results.map((r) => {
                  const available = isAvailable(r);
                  const price = getDomainPrice(r);
                  const isSelected = selectedDomain?.domain === r.domain;

                  return (
                    <div
                      key={r.domain}
                      className={cn(
                        "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all",
                        available
                          ? isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 bg-white"
                          : "border-border bg-muted/30 opacity-60",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {available ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            available ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {r.domain}
                        </span>
                        {available && (
                          <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 hidden sm:inline-flex shrink-0">
                            Available
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {available && price > 0 && (
                          <span className="text-sm font-bold text-foreground whitespace-nowrap">
                            KES {price.toLocaleString()}/yr
                          </span>
                        )}
                        {!available && (
                          <span className="text-xs text-muted-foreground">Taken</span>
                        )}
                        {available && (
                          <Button
                            size="sm"
                            variant={isSelected ? "destructive" : "outline"}
                            className={cn(
                              "h-8 w-8 p-0 rounded-lg transition-all",
                              !isSelected && "border-primary text-primary hover:bg-primary/10",
                            )}
                            onClick={() =>
                              onDomainSelect(
                                isSelected ? null : { domain: r.domain, priceKes: price },
                              )
                            }
                            aria-label={isSelected ? "Remove domain" : "Add domain"}
                          >
                            {isSelected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {!searchedName && !isLoading && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Type a name above and press Search to check .co.ke, .com, .ke, .net, .org &amp; .africa.
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
                  setTransferResult(null);
                  setTransferPriceKes(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTransferCheck();
              }}
              placeholder="e.g. mybusiness.co.ke or mybusiness.com"
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

          {transferStatus === "error" && transferApiStatus === "locked" && (
            <div className="mt-4 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <Lock className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Domain is locked</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Unlock it at your current registrar, wait about 15 seconds, then check again.
                </p>
              </div>
            </div>
          )}

          {transferStatus === "error" &&
            transferMessage &&
            transferApiStatus !== "available" &&
            transferApiStatus !== "locked" && (
              <div className="mt-4 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <h4 className="text-sm font-semibold text-destructive">Transfer not available</h4>
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
                    : "border-border hover:border-primary/40 bg-white",
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
                    </span>
                  </div>
                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20 hidden sm:inline-flex shrink-0">
                    Ready to transfer
                  </Badge>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-foreground whitespace-nowrap">
                    KES {transferPriceKes!.toLocaleString()}
                  </span>
                  <Button
                    size="sm"
                    variant={selectedDomain?.domain === transferResult.domain ? "destructive" : "outline"}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg transition-all",
                      selectedDomain?.domain !== transferResult.domain &&
                        "border-primary text-primary hover:bg-primary/10",
                    )}
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
                    aria-label={
                      selectedDomain?.domain === transferResult.domain
                        ? "Remove transfer domain"
                        : "Add transfer domain"
                    }
                  >
                    {selectedDomain?.domain === transferResult.domain ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
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
            Enter the domain you already own. We&apos;ll use it as the name for your hosting subscription and connect it after setup  no domain purchase is added.
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
                placeholder="e.g. mybusiness.co.ke"
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
              className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0"
            >
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            No extra charge  you already own this domain.
          </p>
        </>
      )}

      {/* Selected domain confirmation */}
      {selectedDomain && (
        <div
          className={cn(
            "mt-4 rounded-xl border p-4",
            selectedDomain.isTransfer
              ? "border-primary/30 bg-primary/5"
              : "border-emerald-200 bg-emerald-50",
          )}
        >
          <div className="flex items-start gap-3">
            {selectedDomain.isTransfer ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
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
                      selectedDomain.isTransfer ? "text-muted-foreground" : "text-emerald-700",
                    )}
                  >
                    {selectedDomain.isExisting
                      ? "Will be used as your subscription name and connected after setup"
                      : selectedDomain.isTransfer
                        ? "Domain transfer added to your order"
                        : "Domain registration added to your order"}
                    {!selectedDomain.isExisting && selectedDomain.priceKes > 0 && (
                      <span className="ml-1">
                        · KES {selectedDomain.priceKes.toLocaleString()}
                        {selectedDomain.isTransfer ? "" : "/yr"}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  className={cn(
                    "text-xs underline hover:no-underline shrink-0",
                    selectedDomain.isTransfer ? "text-primary" : "text-emerald-600",
                  )}
                  onClick={() => {
                    onDomainSelect(null);
                    onTransferAuthCodeChange?.("");
                    setOwnDomainInput("");
                  }}
                >
                  Remove
                </button>
              </div>

              {selectedDomain.isTransfer && onTransferAuthCodeChange && (
                <div className="mt-4 rounded-xl border border-border bg-white p-4 shadow-sm">
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
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
