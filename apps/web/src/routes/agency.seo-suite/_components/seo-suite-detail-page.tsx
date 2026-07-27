"use client";

import * as React from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  LayoutDashboard,
  Search,
  Globe,
  Swords,
  Link2,
  TrendingUp,
  ShieldCheck,
  Radar,
  Bookmark,
  Sparkles,
  MessageSquareText,
  Newspaper,
  MapPin,
  Cpu,
  Bell,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { useSeoProject } from "./use-seo-project";
import { CredentialsBanner } from "./credentials-banner";
import type { SeoProject } from "./seo-suite-utils";

import { OverviewTab } from "./overview-tab";
import { KeywordResearchTab } from "./keyword-research-tab";
import { DomainOverviewTab } from "./domain-overview-tab";
import { CompetitorsTab } from "./competitors-tab";
import { BacklinksTab } from "./backlinks-tab";
import { RankTrackingTab } from "./rank-tracking-tab";
import { SiteAuditTab } from "./site-audit-tab";
import { SerpLabTab } from "./serp-lab-tab";
import { SavedKeywordsTab } from "./saved-keywords-tab";
import { AiVisibilityTab } from "./ai-visibility-tab";
import { PromptExplorerTab } from "./prompt-explorer-tab";
import { ContentMentionsTab } from "./content-mentions-tab";
import { LocalReviewsTab } from "./local-reviews-tab";
import { TechWhoisTab } from "./tech-whois-tab";
import { ReportsAlertsTab } from "./reports-alerts-tab";
import { HistoricalTrendsTab } from "./historical-trends-tab";
import { AdvancedKeywordsTab } from "./advanced-keywords-tab";
import { SmartRecommendationsTab } from "./smart-recommendations-tab";
import { ContentStrategyTab } from "./content-strategy-tab";
import { CompetitorIntelligenceTab } from "./competitor-intelligence-tab";

const TAB_TRIGGER_CLASS =
  "group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]";

const TABS = [
  { value: "overview", title: "Overview", subtitle: "Snapshot", icon: LayoutDashboard },
  { value: "research", title: "Research", subtitle: "Keywords", icon: Search },
  { value: "domain", title: "Domain", subtitle: "Visibility", icon: Globe },
  { value: "competitors", title: "Competitors", subtitle: "Gaps", icon: Swords },
  { value: "backlinks", title: "Backlinks", subtitle: "Links", icon: Link2 },
  { value: "ranks", title: "Ranks", subtitle: "Tracking", icon: TrendingUp },
  { value: "audit", title: "Audit", subtitle: "Technical", icon: ShieldCheck },
  { value: "serp", title: "SERP Lab", subtitle: "Live", icon: Radar },
  { value: "saved", title: "Saved", subtitle: "Lists", icon: Bookmark },
  { value: "ai", title: "AI Visibility", subtitle: "GEO", icon: Sparkles },
  { value: "prompts", title: "Prompts", subtitle: "Explorer", icon: MessageSquareText },
  { value: "mentions", title: "Mentions", subtitle: "Content", icon: Newspaper },
  { value: "local", title: "Local", subtitle: "Reviews", icon: MapPin },
  { value: "tech", title: "Tech", subtitle: "WHOIS", icon: Cpu },
  { value: "reports", title: "Reports", subtitle: "Alerts", icon: Bell },
  { value: "trends", title: "Trends", subtitle: "Historical", icon: TrendingUp },
  { value: "advanced", title: "Advanced", subtitle: "Keywords", icon: Sparkles },
  { value: "insights", title: "Insights", subtitle: "Smart", icon: Sparkles },
  { value: "content", title: "Content", subtitle: "Strategy", icon: Newspaper },
  { value: "intel", title: "Intel", subtitle: "Competitive", icon: Swords },
] as const;

export type SeoSuiteTabValue = (typeof TABS)[number]["value"];

function DetailSkeleton() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-20" />
          <div>
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="mt-8 space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px] w-[160px]" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

function DetailError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link to="/agency/seo-suite">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Error loading project</h1>
            <p className="text-xs text-muted-foreground">Failed to load SEO project details</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
          <h3 className="mb-2 text-lg font-semibold">Failed to load project</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {error.message || "An error occurred while fetching the SEO project."}
          </p>
          <div className="flex gap-2">
            <Button onClick={onRetry} variant="outline">
              Try Again
            </Button>
            <Link to="/agency/seo-suite">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to SEO Suite
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SeoSuiteDetailPageProps {
  projectId: string;
}

export function SeoSuiteDetailPage({ projectId }: SeoSuiteDetailPageProps) {
  const { data: project, isLoading, isError, error, refetch } = useSeoProject(projectId);
  const [activeTab, setActiveTab] = React.useState<string>("overview");

  if (isLoading) return <DetailSkeleton />;
  if (isError || !project) {
    return <DetailError error={(error as Error) ?? new Error("Project not found")} onRetry={() => refetch()} />;
  }

  const seoProject = project as SeoProject;

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/agency/seo-suite">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-base font-semibold tracking-tight">{seoProject.name}</h1>
              <p className="text-xs text-muted-foreground">SEO project workspace</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {seoProject.primaryDomain} · {seoProject.locationName} · {seoProject.languageCode}
          </p>
        </div>

        <div className="mt-4">
          <CredentialsBanner />
        </div>

        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollArea className="w-full -mx-4 px-4 md:mx-0 md:px-0 scrollbar-default">
              <TabsList className="inline-flex h-auto w-max min-w-full gap-2 p-1.5 bg-muted/50 rounded-lg border border-border/50">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger key={tab.value} value={tab.value} className={TAB_TRIGGER_CLASS}>
                      <div className="flex items-center justify-between w-full">
                        <Icon className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="text-sm font-semibold tracking-tight">{tab.title}</span>
                        <span className="text-xs text-muted-foreground">{tab.subtitle}</span>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <ScrollBar orientation="horizontal" className="flex" />
            </ScrollArea>

            <TabsContent value="overview" className="mt-10">
              <OverviewTab
                projectId={projectId}
                project={seoProject}
                onNavigateTab={setActiveTab}
              />
            </TabsContent>
            <TabsContent value="research" className="mt-10">
              <KeywordResearchTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="domain" className="mt-10">
              <DomainOverviewTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="competitors" className="mt-10">
              <CompetitorsTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="backlinks" className="mt-10">
              <BacklinksTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="ranks" className="mt-10">
              <RankTrackingTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="audit" className="mt-10">
              <SiteAuditTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="serp" className="mt-10">
              <SerpLabTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="saved" className="mt-10">
              <SavedKeywordsTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="ai" className="mt-10">
              <AiVisibilityTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="prompts" className="mt-10">
              <PromptExplorerTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="mentions" className="mt-10">
              <ContentMentionsTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="local" className="mt-10">
              <LocalReviewsTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="tech" className="mt-10">
              <TechWhoisTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="reports" className="mt-10">
              <ReportsAlertsTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="trends" className="mt-10">
              <HistoricalTrendsTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="advanced" className="mt-10">
              <AdvancedKeywordsTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="insights" className="mt-10">
              <SmartRecommendationsTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="content" className="mt-10">
              <ContentStrategyTab projectId={projectId} project={seoProject} />
            </TabsContent>
            <TabsContent value="intel" className="mt-10">
              <CompetitorIntelligenceTab projectId={projectId} project={seoProject} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
