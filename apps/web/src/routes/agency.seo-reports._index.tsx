"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoSearchConsoleView } from "./agency.seo-reports/_components/seo-search-console-view";
import { SeoGa4View } from "./agency.seo-reports/_components/seo-ga4-view";

export default function SeoReportsPage() {
  // Fetch manageable sites in the parent to pass down
  // This avoids double fetching if we want, but also allows each tab to start with the list.
  const {
    data: sitesData,
    isLoading: isLoadingSites,
  } = trpc.seoReports.listManageableSites.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const sites = sitesData || [];

  if (isLoadingSites) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-xl font-bold tracking-tight">SEO Reports</h1>
          <p className="text-xs text-muted-foreground">
            Comprehensive SEO performance metrics from Google Search Console & Google Analytics 4.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="search-console" className="w-full">
          <TabsList className="w-fit mb-4">
            <TabsTrigger value="search-console">Search Console</TabsTrigger>
            <TabsTrigger value="ga4">Google Analytics 4</TabsTrigger>
          </TabsList>

          <TabsContent value="search-console" className="mt-0">
            <SeoSearchConsoleView sites={sites} />
          </TabsContent>

          <TabsContent value="ga4" className="mt-0">
            <SeoGa4View />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
