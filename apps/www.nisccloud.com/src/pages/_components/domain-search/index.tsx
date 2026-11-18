import * as React from "react";
import { useInView, useReducedMotion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import { Search, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
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
  const prompts = ["yourbusiness.com", "yourshop.com", "yourbrand.com"];

  const [searchParams] = useSearchParams();
  const [domainName, setDomainName] = React.useState("");
  const [searchQueryName, setSearchQueryName] = React.useState("");
  const [rawSearchQueryForResults, setRawSearchQueryForResults] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
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

  const pickTld = (tld: string) => {
    const base = toSingleLabelName(sanitizeDomainName(domainName.trim()));
    if (!base) {
      setDomainName(`.${tld}`);
      inputRef.current?.focus();
      window.requestAnimationFrame(() => inputRef.current?.setSelectionRange(0, 0));
      return;
    }
    const next = `${base}.${tld}`;
    setDomainName(next);
    const result = applySearch(next);
    if (result.started && result.changed) {
      setIsSearching(true);
      trackEvent("domain_search", { source: compact ? "homepage" : "domains_page" });
    }
  };

  return (
    <section ref={searchRef} id="domain-search" className="relative scroll-mt-24 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[28px] bg-brand-midnight px-5 py-8 text-white ring-1 ring-transparent dark:ring-white/10 sm:px-10 sm:py-12">
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 -right-16 size-72 rounded-full bg-brand-orange/20 blur-3xl" />

          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="type-h2 text-white">Find the name for your business</h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-white/75">
              Check .co.ke, .ke, .com and more in one search, then point it to your hosting from nPanel.
            </p>

            <form
              role="search"
              className="mt-7"
              onSubmit={(e) => {
                e.preventDefault();
                if (domainName.trim()) handleSearch();
              }}
            >
              <label htmlFor={`domain-search-input-${compact ? "home" : "page"}`} className="sr-only">
                Domain name
              </label>
              <div className="flex items-center gap-2 rounded-2xl bg-white p-2 pl-4 shadow-2xl shadow-black/30 ring-1 ring-white/20 focus-within:ring-4 focus-within:ring-primary/40 dark:bg-zinc-950">
                <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <input
                  ref={inputRef}
                  id={`domain-search-input-${compact ? "home" : "page"}`}
                  placeholder={reducedMotion || focused ? "yourbusiness.com" : prompts[promptIndex].slice(0, letters)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  value={domainName}
                  onChange={(e) => {
                    setDomainName(e.target.value);
                    if (error) setError(null);
                  }}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "domain-search-error" : undefined}
                  className="h-12 min-w-0 flex-1 bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white sm:text-lg"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={!domainName.trim() || isSearching}
                  className="h-12 shrink-0 rounded-xl px-5 text-base font-semibold sm:px-7"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                      <span className="hidden sm:inline">Checking…</span>
                      <span className="sr-only sm:hidden">Checking</span>
                    </>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
              {error && (
                <p id="domain-search-error" role="alert" className="mt-2 flex items-center justify-center gap-1.5 text-sm text-red-200">
                  <AlertCircle className="size-4" aria-hidden />
                  {error}
                </p>
              )}
            </form>

            <TldPricingCards onPick={pickTld} />
          </div>
        </div>

        {searchQueryName && (
          <div className="mt-8">
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
          </div>
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
