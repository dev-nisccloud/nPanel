"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { OpenProviderTldsTable } from "./_components/openprovider-tlds-table";
import { DomainSearch } from "./_components/domain-search";
import { TldSettings } from "./_components/tld-settings";
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
      <Tabs defaultValue="domain-search" className="w-full max-w-7xl mx-auto">
        <div className="flex justify-center mb-6">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="domain-search">Domain Search</TabsTrigger>
            {/* <TabsTrigger value="openprovider-tlds">Openprovider TLDs</TabsTrigger> */}
            {/* <TabsTrigger value="supported-domains">Supported Domains</TabsTrigger> */}
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="domain-search" className="mt-6">
          <DomainSearch />
        </TabsContent>

        {/* <TabsContent value="openprovider-tlds" className="mt-6">
          <OpenProviderTldsTable />
        </TabsContent> */}

        {/* <TabsContent value="supported-domains" className="mt-6">
          <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
            <p className="text-muted-foreground">Supported Domains section coming soon...</p>
          </div>
        </TabsContent> */}

        <TabsContent value="settings" className="mt-6">
          <TldSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
