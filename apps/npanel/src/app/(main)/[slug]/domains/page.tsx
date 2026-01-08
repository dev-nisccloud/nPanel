"use client";

import * as React from "react";
import { DomainSearch } from "./_components/domain-search";
import { trpc } from "@/utils/trpc";

export default function DomainsPage() {
  const utils = trpc.useUtils();

  // P0-1: Prefetch TLD settings and exchange rates on page load for better performance
  // P0-2: Using optimized getDefault endpoint instead of list
  React.useEffect(() => {
    // Prefetch in parallel to eliminate delays on first search
    Promise.all([
      utils.tldSettings.getDefault.prefetch(),
      utils.currency.getExchangeRates.prefetch({ baseCurrency: 'USD' })
    ]).catch(error => {
      console.error('Failed to prefetch domain data:', error);
    });
  }, [utils]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <DomainSearch />
    </div>
  );
}
