import * as React from "react";
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

function DomainSearchContent() {
  const cart = useDomainCart();
  const [domainName, setDomainName] = React.useState("");
  const [searchQueryName, setSearchQueryName] = React.useState("");
  const [rawSearchQueryForResults, setRawSearchQueryForResults] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  const triggerSearch = React.useCallback((): { started: boolean; changed: boolean } => {
    const raw = domainName.trim();
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
    setSearchQueryName(nextSearchQuery);
    setRawSearchQueryForResults(raw);
    return { started: true, changed: true };
  }, [domainName, searchQueryName, rawSearchQueryForResults]);

  const handleSearch = () => {
    const result = triggerSearch();
    if (result.started && result.changed) setIsSearching(true);
  };

  return (
    <section className="py-4 md:py-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 60%, color-mix(in srgb, var(--color-primary) 5%, transparent), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-2 tracking-wide">
            FIND YOUR NAME ONLINE
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Search for Your Domain
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Check if the name you want is free, then check out easily and point it to your hosting.
          </p>
        </div>

        <Card className="border border-border/60 shadow-xl shadow-primary/5 mb-4">
          <CardContent className="p-4 md:p-5">
            <div className="space-y-3">
              {error && (
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-3 max-w-2xl mx-auto">
                <Input
                  placeholder="Enter domain name (e.g., mybusiness)"
                  value={domainName}
                  onChange={(e) => {
                    setDomainName(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && domainName.trim()) handleSearch();
                  }}
                  className="flex-1 h-12 text-base rounded-xl"
                />
                <Button
                  size="lg"
                  onClick={handleSearch}
                  disabled={!domainName.trim() || isSearching}
                  className="h-12 px-8 rounded-xl cursor-pointer"
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

export default function DomainSearch() {
  return (
    <PricingProvider>
      <DomainSearchContent />
    </PricingProvider>
  );
}
