"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { OpenProviderTldsTable } from "./agency.domains/_components/openprovider-tlds-table";
import { AiDomainSearch } from "./agency.domains/_components/ai-domain-search";
import { DomainSearch } from "./agency.domains/_components/domain-search";
import { TldSettings } from "./agency.domains/_components/tld-settings";
import { trpc } from "@/utils/trpc";
import { AiTabTrigger } from "@/components/ai-tab-trigger";

export default function DomainsPage() {
  const utils = trpc.useUtils();

  // Prefetch margin map (default + per-TLD overrides) and exchange rates
  React.useEffect(() => {
    Promise.all([
      utils.tldSettings.listMarginMap.prefetch(),
      utils.currency.getExchangeRates.prefetch({ baseCurrency: 'USD' })
    ]).catch(error => {
      console.error('Failed to prefetch domain data:', error);
    });
  }, [utils]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <Tabs defaultValue="domain-search" className="w-full max-w-7xl mx-auto">
        <div className="flex justify-center mb-6">
          <TabsList className="inline-flex w-auto gap-1.5 px-1.5">
            <TabsTrigger value="domain-search">Domain Search</TabsTrigger>
            <AiTabTrigger value="ai-domain-search" />
            {/* <TabsTrigger value="openprovider-tlds">Openprovider TLDs</TabsTrigger> */}
            {/* <TabsTrigger value="supported-domains">Supported Domains</TabsTrigger> */}
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="domain-search" className="mt-6 data-[state=inactive]:hidden" forceMount>
          <DomainSearch />
        </TabsContent>

        <TabsContent value="ai-domain-search" className="mt-6 data-[state=inactive]:hidden" forceMount>
          <AiDomainSearch />
        </TabsContent>

        {/* <TabsContent value="openprovider-tlds" className="mt-6">
          <OpenProviderTldsTable />
        </TabsContent> */}

        {/* <TabsContent value="supported-domains" className="mt-6">
          <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
            <p className="text-muted-foreground">Supported Domains section coming soon...</p>
          </div>
        </TabsContent> */}

        <TabsContent value="settings" className="mt-6 data-[state=inactive]:hidden" forceMount>
          <TldSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
