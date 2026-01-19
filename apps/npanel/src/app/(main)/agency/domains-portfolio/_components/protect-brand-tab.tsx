"use client";

import * as React from "react";
import { CurrencyProvider } from "../../domains/_components/currency-context";
import { useDomainSearch } from "../../domains/_components/use-domain-search";
import { DomainSearchResults } from "../../domains/_components/domain-search-results";

interface ProtectBrandTabProps {
  domainNameWithoutTld: string;
}

function ProtectBrandTabContent({ domainNameWithoutTld }: ProtectBrandTabProps) {
  const [activeTab, setActiveTab] = React.useState("popular");
  const domainSearch = useDomainSearch();
  const hasSearchedRef = React.useRef(false);

  // Auto-trigger search when component mounts or domain name changes
  React.useEffect(() => {
    if (domainNameWithoutTld && domainNameWithoutTld.trim().length > 0 && !hasSearchedRef.current) {
      // Set domain name and trigger search
      domainSearch.setDomainName(domainNameWithoutTld);
      // Trigger search immediately
      setTimeout(() => {
        domainSearch.triggerSearch();
        hasSearchedRef.current = true;
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainNameWithoutTld]);

  // Reset search flag when domain name changes
  React.useEffect(() => {
    hasSearchedRef.current = false;
  }, [domainNameWithoutTld]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Protect your brand</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Secure your brand name with different domain extensions.
        </p>
      </div>
      
      <DomainSearchResults
        results={domainSearch.searchResults}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLoading={domainSearch.isLoading}
        error={domainSearch.error}
        isDomainInCart={domainSearch.isDomainInCart}
        onAddToCart={domainSearch.handleAddToCart}
        onRemoveFromCart={domainSearch.handleRemoveFromCart}
        searchQuery=""
        promotionalResults={undefined}
        isPromotionalLoading={false}
      />
    </div>
  );
}

export function ProtectBrandTab({ domainNameWithoutTld }: ProtectBrandTabProps) {
  return (
    <CurrencyProvider>
      <ProtectBrandTabContent domainNameWithoutTld={domainNameWithoutTld} />
    </CurrencyProvider>
  );
}
