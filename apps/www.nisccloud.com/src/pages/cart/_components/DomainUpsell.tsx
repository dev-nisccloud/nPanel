import * as React from "react";
import {
  Search, CheckCircle2, XCircle, Loader2, Plus, Minus, Link2,
} from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { trpcQuery, trpcMutation } from "@/lib/domain-search/api.ts";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectedDomain {
  domain: string;
  priceKes: number;
  isExisting?: boolean;
}

interface DomainUpsellProps {
  selectedDomain: SelectedDomain | null;
  onDomainSelect: (domain: SelectedDomain | null) => void;
}

// ---------------------------------------------------------------------------
// Provider split config
// ---------------------------------------------------------------------------

/** TLDs routed to OpenProvider (gTLD) */
const OP_TLDS = ["com", "net", "org", "africa"];

/** KENIC TLD FQDNs to always check (name is filled in at runtime) */
const KENIC_TLDS_TO_CHECK = ["co.ke", "ke"];

/**
 * Display order for combined results — put .co.ke and .com first
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

function DomainUpsellInner({ selectedDomain, onDomainSelect }: DomainUpsellProps) {
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

  // ---- Tab ----
  const [tab, setTab] = React.useState<"search" | "own">("search");

  // ---- Trigger search ----
  const handleSearch = () => {
    const sanitized = sanitizeDomainName(input);
    if (!sanitized) {
      setValidationError("Please enter a domain name to search.");
      return;
    }
    if (!isValidSearchQuery(sanitized)) {
      setValidationError("Enter a valid domain name — letters, numbers and hyphens only.");
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
        <h3 className="text-base font-bold text-foreground">Secure your domain</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Search to register a new domain, or add one you already own.
      </p>

      {/* Tab switcher */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "search" | "own")} className="mb-4">
        <TabsList className="w-full h-9 rounded-lg">
          <TabsTrigger value="search" className="flex-1 text-xs rounded-md">
            <Search className="w-3.5 h-3.5 mr-1.5" />
            Search &amp; register
          </TabsTrigger>
          <TabsTrigger value="own" className="flex-1 text-xs rounded-md">
            <Link2 className="w-3.5 h-3.5 mr-1.5" />
            I already have one
          </TabsTrigger>
        </TabsList>
      </Tabs>

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

      {/* ── Own domain tab ── */}
      {tab === "own" && (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Enter the domain you already own. We'll connect it to your hosting after setup.
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
            No extra charge — you already own this domain.
          </p>
        </>
      )}

      {/* Selected domain confirmation */}
      {selectedDomain && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-emerald-800 font-medium">
              <strong>{selectedDomain.domain}</strong>
              {selectedDomain.isExisting ? " will be connected after setup" : " added to your order"}
            </span>
            {!selectedDomain.isExisting && selectedDomain.priceKes > 0 && (
              <span className="text-xs text-emerald-700 ml-2">
                (KES {selectedDomain.priceKes.toLocaleString()}/yr)
              </span>
            )}
          </div>
          <button
            className="text-xs text-emerald-600 underline hover:no-underline shrink-0"
            onClick={() => {
              onDomainSelect(null);
              setOwnDomainInput("");
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported wrapper — wraps with PricingProvider
// ---------------------------------------------------------------------------

export function DomainUpsell(props: DomainUpsellProps) {
  return (
    <PricingProvider>
      <DomainUpsellInner {...props} />
    </PricingProvider>
  );
}
