"use client";

import * as React from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  LayoutDashboard,
  Code,
  FileText,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { WpInstallationStatusBadge } from "@/components/wordpress/wp-installation-status-badge";
import { wpDetailLayout, DETAIL_TABS_LIST_CLASS, DETAIL_TABS_SCROLL_CLASS, DETAIL_TAB_CONTENT_CLASS } from "@/components/wordpress/wp-detail-layout";
import { DetailCardTabsTrigger } from "@/components/ui/detail-card-tabs";
import { wordpressInstallationSchema } from "@/routes/$slug.wordpress/_components/schema";
import { useWordPressDetailBatched } from "@/routes/$slug.wordpress/_components/use-wordpress-detail-batched";
import { WordPressOverview } from "@/components/wordpress/wordpress-overview";
import { WordPressPlugins } from "@/routes/$slug.wordpress/_components/wordpress-plugins";
import { WordPressThemes } from "@/routes/$slug.wordpress/_components/wordpress-themes";
import { useCanTeamPermission } from "@/contexts/team-permissions-context";

interface TabDef {
  value: string;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  permissionKey: string;
}

const TABS: TabDef[] = [
  { value: "overview", label: "Overview", sub: "Summary", icon: LayoutDashboard, permissionKey: "wordpress.list" },
  { value: "plugins", label: "Plugins", sub: "Extensions", icon: Code, permissionKey: "wordpress.plugins" },
  { value: "themes", label: "Themes", sub: "Design", icon: FileText, permissionKey: "wordpress.themes" },
];

export interface WordPressDetailPageProps {
  installationId: string;
  backTo: string;
  backLabel?: string;
}

function WordPressDetailSkeleton() {
  return (
    <div className={wpDetailLayout.page}>
      <div className={wpDetailLayout.container}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <div>
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-24 w-36" />
            <Skeleton className="h-24 w-36" />
            <Skeleton className="h-24 w-36" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

function WordPressDetailError({
  error,
  onRetry,
  backTo,
  backLabel,
}: {
  error: Error;
  onRetry: () => void;
  backTo: string;
  backLabel: string;
}) {
  return (
    <div className={wpDetailLayout.page}>
      <div className={wpDetailLayout.container}>
        <div className="flex items-center gap-4">
          <Link to={backTo}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backLabel}
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Error loading installation</h1>
            <p className="text-xs text-muted-foreground">Failed to load WordPress installation details</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
          <h3 className="mb-2 text-base font-semibold">Failed to load installation</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {error.message || "An error occurred while fetching WordPress installation details."}
          </p>
          <div className="flex gap-2">
            <Button onClick={onRetry} variant="outline">
              Try again
            </Button>
            <Link to={backTo}>
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WordPressDetailPage({
  installationId,
  backTo,
  backLabel = "Back",
}: WordPressDetailPageProps) {
  const { data: wpData, isLoading, isError, error, refetch } =
    useWordPressDetailBatched(installationId);
  const [activeTab, setActiveTab] = React.useState("overview");
  const { can } = useCanTeamPermission();
  const visibleTabs = TABS.filter((tab) => can(tab.permissionKey));
  React.useEffect(() => {
    if (!visibleTabs.some((tab) => tab.value === activeTab) && visibleTabs[0]) {
      setActiveTab(visibleTabs[0].value);
    }
  }, [activeTab, visibleTabs]);

  if (isLoading) return <WordPressDetailSkeleton />;

  if (isError || !wpData?.id) {
    return (
      <WordPressDetailError
        error={(error as Error) ?? new Error("Installation not found")}
        onRetry={() => refetch()}
        backTo={backTo}
        backLabel={backLabel}
      />
    );
  }

  const wp = wpData as z.infer<typeof wordpressInstallationSchema>;

  return (
    <div className={wpDetailLayout.page}>
      <div className={wpDetailLayout.container}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={backTo}>
              <Button variant="ghost" size="sm" className="shrink-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight truncate">
                {wp.displayTitle || wp.title || `Installation ${wp.id}`}
              </h1>
              <p className="text-xs text-muted-foreground">WordPress installation</p>
            </div>
          </div>
          <WpInstallationStatusBadge status={wp.status} />
        </div>

        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
            <ScrollArea className={DETAIL_TABS_SCROLL_CLASS}>
              <TabsList className={DETAIL_TABS_LIST_CLASS}>
                {visibleTabs.map((tab) => (
                  <DetailCardTabsTrigger
                    key={tab.value}
                    value={tab.value}
                    icon={tab.icon}
                    title={tab.label}
                    subtitle={tab.sub}
                  />
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" className="flex mt-0.5" />
            </ScrollArea>

            <TabsContent value="overview" className={DETAIL_TAB_CONTENT_CLASS}>
              <WordPressOverview wpData={wp} onNavigateToTab={setActiveTab} />
            </TabsContent>
            <TabsContent value="plugins" className={DETAIL_TAB_CONTENT_CLASS}>
              <WordPressPlugins installationId={String(wp.id)} />
            </TabsContent>
            <TabsContent value="themes" className={DETAIL_TAB_CONTENT_CLASS}>
              <WordPressThemes installationId={String(wp.id)} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
