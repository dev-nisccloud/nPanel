import * as React from "react";
import { useInView, useReducedMotion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import { Search, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { PricingProvider } from "@/lib/domain-search/pricing-context.tsx";
import { useDomainCart } from "@/lib/domain-search/use-domain-cart.ts";
import {
  isValidSearchQuery,
  sanitizeDomainName,
  toSingleLabelName,
} from "@/lib/domain-search/search-utils.ts";
import { DomainSearchResults } from "./DomainSearchResults.tsx";
import { TldPricingCards } from "./TldPricingCards.tsx";
import { trackEvent } from "@/lib/track.ts";

type DomainSearchProps = {
  /** Homepage preview: top promo cards + CTA; full categories live on /hosting/domains */
  compact?: boolean;
  /** When true, skip wrapping PricingProvider (parent already provides it) */
  embedded?: boolean;
};

function DomainSearchContent({ compact = false }: DomainSearchProps) {
  const cart = useDomainCart();
  const searchRef = React.useRef<HTMLElement>(null);
  const inView = useInView(searchRef);
  const reducedMotion = useReducedMotion();
  const [focused, setFocused] = React.useState(false);
  const [promptIndex, setPromptIndex] = React.useState(0);
  const [letters, setLetters] = React.useState(0);
  const [deleting, setDeleting] = React.useState(false);
  const prompts = ["Search your domain", "Type your domain here", "Register your business domain"];

  const [searchParams] = useSearchParams();
  const [domainName, setDomainName] = React.useState("");
  const [searchQueryName, setSearchQueryName] = React.useState("");
  const [rawSearchQueryForResults, setRawSearchQueryForResults] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  React.useEffect(() => {
    if (!inView || focused || domainName || reducedMotion) return;
    const length = prompts[promptIndex].length;
    const timer = window.setTimeout(() => {
      if (!deleting && letters < length) setLetters(n => n + 1);
      else if (!deleting) setDeleting(true);
      else if (letters > 0) setLetters(n => n - 1);
      else { setDeleting(false); setPromptIndex(i => (i + 1) % 3); }
    }, !deleting && letters === length ? 1800 : deleting ? 35 : 75);
    return () => window.clearTimeout(timer);
  }, [inView, focused, domainName, reducedMotion, letters, deleting, promptIndex]);
  const appliedUrlSearchRef = React.useRef<string | null>(null);

  const applySearch = React.useCallback(
    (rawInput: string): { started: boolean; changed: boolean } => {
      const raw = rawInput.trim();
      if (!raw) return { started: false, changed: false };
      setError(null);
      const sanitized = sanitizeDomainName(raw);
      if (!isValidSearchQuery(sanitized)) {
        setError("Enter a valid search query to find your domain.");
        return { started: false, changed: false };
      }
      const nextSearchQuery = toSingleLabelName(sanitized);
      const isSameQuery = nextSearchQuery === searchQueryName && raw === rawSearchQueryForResults;
      if (isSameQuery) return { started: true, changed: false };
      setDomainName(raw);
      setSearchQueryName(nextSearchQuery);
      setRawSearchQueryForResults(raw);
      return { started: true, changed: true };
    },
    [searchQueryName, rawSearchQueryForResults],
  );

  const triggerSearch = React.useCallback((): { started: boolean; changed: boolean } => {
    return applySearch(domainName);
  }, [applySearch, domainName]);

  const handleSearch = () => {
    const result = triggerSearch();
    if (result.started && result.changed) {
      setIsSearching(true);
      trackEvent("domain_search", { source: compact ? "homepage" : "domains_page" });
    }
  };

  // Prefill + run search from ?search= (e.g. homepage “View more” or transfer CTA)
  React.useEffect(() => {
    if (compact) return;
    const q = searchParams.get("search")?.trim() ?? "";
    if (!q || appliedUrlSearchRef.current === q) return;
    appliedUrlSearchRef.current = q;
    const result = applySearch(q);
    if (result.started && result.changed) setIsSearching(true);

    const scroll = () => {
      document.getElementById("domain-search")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const t = window.setTimeout(scroll, 80);
    return () => window.clearTimeout(t);
  }, [applySearch, compact, searchParams]);

  return (
    <section ref={searchRef} id="domain-search" className="py-4 md:py-6 relative overflow-hidden scroll-mt-24">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 60%, color-mix(in srgb, var(--color-primary) 5%, transparent), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <div className="text-center mb-4">
          <h2 className="type-h2 mb-2">
            Search for your domain
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Check if the name you want is free, then check out easily and point it to your hosting.
          </p>
        </div>

        <Card className="border border-primary/30 bg-gradient-to-br from-primary/15 via-background/80 to-orange-200/20 dark:to-orange-950/20 backdrop-blur-xl shadow-xl shadow-primary/10 rounded-3xl mb-4">
          <CardContent className="p-4 md:p-5">
            <div className="space-y-3">
              {error && (
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
                <Input
                  aria-label="Domain name"
                  placeholder={reducedMotion || focused ? prompts[0] : prompts[promptIndex].slice(0, letters)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  value={domainName}
                  onChange={(e) => {
                    setDomainName(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && domainName.trim()) handleSearch();
                  }}
                  className="flex-1 h-14 text-base rounded-2xl bg-background/80 border-primary/25 shadow-inner"
                />
                <Button
                  size="lg"
                  onClick={handleSearch}
                  disabled={!domainName.trim() || isSearching}
                  className="h-14 px-8 rounded-2xl cursor-pointer"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              <TldPricingCards />
            </div>
          </CardContent>
        </Card>

        {searchQueryName && (
          <DomainSearchResults
            searchQuery={searchQueryName}
            rawSearchQuery={rawSearchQueryForResults}
            error={error}
            compact={compact}
            onLoadingChange={setIsSearching}
            isDomainInCart={cart.isDomainInCart}
            onAddToCart={cart.handleAddToCart}
            onRemoveFromCart={cart.handleRemoveFromCart}
            isDomainBundleInCart={cart.isDomainBundleInCart}
            onAddDomainBundle={cart.handleAddDomainBundle}
            onRemoveDomainBundle={cart.handleRemoveDomainBundle}
          />
        )}
      </div>
    </section>
  );
}

export default function DomainSearch({ compact = false, embedded = false }: DomainSearchProps) {
  const content = <DomainSearchContent compact={compact} />;
  if (embedded) return content;
  return <PricingProvider>{content}</PricingProvider>;
}
