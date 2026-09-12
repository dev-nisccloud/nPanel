"use client";

import * as React from "react";
import { useParams } from "react-router";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoSearchConsoleView } from "./$slug.seo-reports/_components/seo-search-console-view";
import { SeoGa4View } from "./$slug.seo-reports/_components/seo-ga4-view";
import { TeamProductUpgradeButton } from "@/routes/agency.subscriptions/_components/subscription-upgrade-button";

export default function TeamSeoReportsPage() {
  const { slug: teamSlug } = useParams();

  const {
    data: sitesData,
    isLoading: isLoadingSites,
  } = trpc.seoReports.listManageableSites.useQuery(
    { teamSlug: teamSlug! },
    {
      enabled: Boolean(teamSlug),
      refetchOnWindowFocus: false,
      retry: 1,
    },
  );

  const sites = sitesData || [];

  if (!teamSlug) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        Missing team in URL.
      </div>
    );
  }

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
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-base font-semibold tracking-tight">SEO Reports</h1>
            <p className="text-sm text-muted-foreground">
              Track the results of your managed SEO - rankings, traffic, and conversions from Google Search and Analytics.
            </p>
          </div>
          <TeamProductUpgradeButton
            teamSlug={teamSlug}
            productNameIncludes={["seo"]}
          />
        </div>

        <Tabs defaultValue="search-console" className="w-full">
          <TabsList className="w-fit mb-4">
            <TabsTrigger value="search-console">Search Console</TabsTrigger>
            <TabsTrigger value="ga4">Google Analytics 4</TabsTrigger>
          </TabsList>

          <TabsContent value="search-console" className="mt-0">
            <SeoSearchConsoleView sites={sites} teamSlug={teamSlug} />
          </TabsContent>

          <TabsContent value="ga4" className="mt-0">
            <SeoGa4View teamSlug={teamSlug} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
