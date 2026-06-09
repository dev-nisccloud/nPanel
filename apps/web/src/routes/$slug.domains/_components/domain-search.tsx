"use client";

import * as React from "react";
import { Search } from "lucide-react";
// import { Sparkles } from "lucide-react"; // Temporarily disabled
// import { Icons } from "@/components/icons"; // Temporarily disabled
import { z } from "zod";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Temporarily disabled
import { Spinner } from "@/components/ui/shadcn-io/spinner";

// Import extracted components
// import { BusinessDescriptionInput } from "./business-description-input"; // Temporarily disabled
// import { AIResultsSection } from "./ai-results-section"; // Temporarily disabled
import { DomainSearchResults } from "./domain-search-results";
import { CurrencySelector } from "./currency-selector";
import { CurrencyProvider } from "./currency-context";
import { TLDPricingCards } from "./tld-pricing-cards";

// Import custom hooks
import { useDomainSearch } from "./use-domain-search";
// import { useAIDomainGeneration } from "./use-ai-domain-generation"; // Temporarily disabled

// Import shared type
export type { DomainSearchResult } from "@/hooks/use-domain-search";

export function DomainSearch() {
  return (
    <CurrencyProvider>
      <DomainSearchContent />
    </CurrencyProvider>
  );
}

function DomainSearchContent() {
  // const [mainTab, setMainTab] = React.useState("find"); // Temporarily disabled
  const [isSearching, setIsSearching] = React.useState(false);

  // Use custom hooks
  const domainSearch = useDomainSearch();
  // const aiGeneration = useAIDomainGeneration(); // Temporarily disabled

  return (
    <div className="space-y-6">
      {/* Currency Selector - Positioned on the right side, prominent and visible */}
      {/* Commented out for agency side - default currency is KES */}
      {/* <div className="flex justify-end w-full mb-2">
        <CurrencySelector />
      </div> */}

      {/* Search Input */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-base font-semibold tracking-tight">Find Your Perfect Domain</h2>
              <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
                Search for available domain names and find the perfect match for your business.
              </p>
            </div>

            {domainSearch.error && (
              <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{domainSearch.error}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-3 max-w-2xl mx-auto">
              <Input
                placeholder="Enter domain name (e.g., mybusiness)"
                value={domainSearch.domainName}
                onChange={(e) => {
                  domainSearch.setDomainName(e.target.value);
                  if (domainSearch.error) domainSearch.setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && domainSearch.domainName.trim()) {
                    const result = domainSearch.triggerSearch();
                    if (result.started && result.changed) {
                      setIsSearching(true);
                    }
                  }
                }}
                className="flex-1 h-12 text-base"
              />
              {/* Global loading: button reflects when any section (Kenyan or category) is still loading */}
              <Button
                size="lg"
                onClick={() => {
                  const result = domainSearch.triggerSearch();
                  if (result.started && result.changed) {
                    setIsSearching(true);
                  }
                }}
                disabled={!domainSearch.domainName.trim() || isSearching}
                className="h-12 px-8"
              >
                {isSearching ? (
                  <>
                    <Spinner variant="ellipsis" className="h-4 w-4 mr-2" />
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

            {/* TLD Pricing Cards */}
            <TLDPricingCards />
          </div>
        </CardContent>
      </Card>

      {/* Search Results - sections load on scroll */}
      {domainSearch.searchQueryName && (
        <DomainSearchResults
          searchQuery={domainSearch.searchQueryName}
          rawSearchQuery={domainSearch.rawSearchQueryForResults}
          error={domainSearch.error}
          isDomainInCart={domainSearch.isDomainInCart}
          isDomainBundleInCart={domainSearch.isDomainBundleInCart}
          onAddToCart={domainSearch.handleAddToCart}
          onRemoveFromCart={domainSearch.handleRemoveFromCart}
          onAddDomainBundle={domainSearch.handleAddDomainBundle}
          onRemoveDomainBundle={domainSearch.handleRemoveDomainBundle}
          onLoadingChange={setIsSearching}
        />
      )}
    </div>
  );
}
