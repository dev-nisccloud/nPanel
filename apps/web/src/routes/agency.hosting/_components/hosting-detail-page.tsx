"use client";

import * as React from "react";
import { ArrowLeft, LayoutDashboard, Network, Mail, Folder, Layers, ChevronRight, Database, ArchiveRestore } from "lucide-react";
import { Icons } from "@/components/icons";
import { Link } from "react-router";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { HostingOverview } from "./hosting-overview";
import { DnsTable } from "./dns-table";
import { MailTable } from "./mail-table";
import { FileManager } from "./file-manager";
import { SubdomainsTable } from "./subdomains-table";
import { DatabasesTable } from "./databases-table";
import { WordPressInstancesTable } from "./wordpress-instances-table";
import { InstallWordPressSheet } from "./install-wordpress-sheet";
import { hostingDetailSchema } from "./hosting-detail-schema";
import { useHostingDetailBatched } from "./use-hosting-detail-batched";
import { getStatusDisplayText, getStatusBadgeVariant } from "./hosting-utils";
import { CreateSubscriptionForHostingDialog } from "./create-subscription-for-hosting-dialog";
import { HostingSubscriptionActionMenu } from "./hosting-subscription-action-menu";
import { HostingSubscriptionSuspendDialog } from "./hosting-subscription-suspend-dialog";
import { useHostingSubscriptionSuspend } from "./use-hosting-subscription-suspend";
import { trpc } from "@/utils/trpc";
import { HostingBackupRestoreTab } from "@/components/nisc-backup/hosting-backup-restore-tab";
import { resolveHostingNiscBackupUsername } from "@/components/nisc-backup/resolve-hosting-nisc-backup-username";

interface HostingDetailPageProps {
  subscriptionId: string;
}

// Loading skeleton component
function HostingDetailSkeleton() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

// Error component
function HostingDetailError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/agency/hosting">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Error Loading Subscription</h1>
              <p className="text-muted-foreground">Failed to load hosting subscription details</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold">Failed to load subscription</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {error.message || "An error occurred while fetching hosting subscription details."}
          </p>
          <div className="flex gap-2">
            <Button onClick={onRetry} variant="outline">
              Try Again
            </Button>
            <Link to="/agency/hosting">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Hosting
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HostingDetailPage({ subscriptionId }: HostingDetailPageProps) {
  // Use batched endpoint - fetches both hosting data and subscription link in one request
  const { data: hostingData, isLoading, isError, error, refetch } = useHostingDetailBatched(subscriptionId);
  const [isCreateSubscriptionOpen, setIsCreateSubscriptionOpen] = React.useState(false);
  const [installWordPressOpen, setInstallWordPressOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("overview");
  const suspendActions = useHostingSubscriptionSuspend({
    onSuccess: () => refetch(),
  });
  const mailboxQuotaLimitBytes = React.useMemo(() => {
    const limits = hostingData?.limits?.limit ?? [];
    const mailboxQuota = limits.find((limit) => limit?.name === "mbox_quota")?.value;
    return typeof mailboxQuota === "number" && mailboxQuota > 0 ? mailboxQuota : undefined;
  }, [hostingData?.limits?.limit]);
  const niscBackupUsername = React.useMemo(
    () => resolveHostingNiscBackupUsername(hostingData),
    [hostingData],
  );

  const utils = trpc.useUtils();
  const { data: hasLinkedResult } =
    trpc.clientSubscriptions.getHasLinkedSubscriptionByPleskId.useQuery(
      { pleskSubscriptionId: subscriptionId },
      { enabled: !!subscriptionId }
    );
  const hasLinkedSubscription = hasLinkedResult?.hasLinked ?? false;

  const createSubscriptionTooltipLinked =
    "This service already has a subscription attached. You need to suspend or disable the current subscription to link it to a new one.";

  // Show loading state
  if (isLoading) {
    return <HostingDetailSkeleton />;
  }

  // Show error state
  if (isError || !hostingData) {
    return <HostingDetailError error={error as Error} onRetry={() => refetch()} />;
  }

  const getStatusBadge = (status: number) => {
    const isActive = status === 0;
    return (
      <Badge
        variant={getStatusBadgeVariant(status)}
        className={isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800" : ""}
      >
        {getStatusDisplayText(status)}
      </Badge>
    );
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/agency/hosting">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-base font-semibold tracking-tight">
                {hostingData.gen_info.name || `Subscription ${hostingData.id}`}
              </h1>
              <p className="text-xs text-muted-foreground">Hosting subscription details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(hostingData.gen_info.status ?? 0)}
            <HostingSubscriptionActionMenu
              subscriptionId={Number(subscriptionId)}
              subscriptionName={hostingData.gen_info.name || `Subscription ${hostingData.id}`}
              status={hostingData.gen_info.status}
              hasLinkedSubscription={hasLinkedSubscription}
              createSubscriptionTooltipLinked={createSubscriptionTooltipLinked}
              onCreateSubscription={() => setIsCreateSubscriptionOpen(true)}
              onSuspend={() =>
                suspendActions.requestSuspend(
                  Number(subscriptionId),
                  hostingData.gen_info.name || `Subscription ${hostingData.id}`,
                )
              }
              onUnsuspend={() =>
                suspendActions.requestUnsuspend(
                  Number(subscriptionId),
                  hostingData.gen_info.name || `Subscription ${hostingData.id}`,
                )
              }
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollArea className="w-full -mx-4 px-4 md:mx-0 md:px-0 scrollbar-default">
              <TabsList className="inline-flex h-auto w-max min-w-full gap-2 p-1.5 pb-2.5 mb-1.5 bg-muted/50 rounded-lg border border-border/50">
                <TabsTrigger
                  value="overview"
                  className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <LayoutDashboard className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-start gap-1 w-full">
                    <span className="text-sm font-semibold tracking-tight">Overview</span>
                    <span className="text-xs text-muted-foreground">Details</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="dns"
                  className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <Network className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-start gap-1 w-full">
                    <span className="text-sm font-semibold tracking-tight">DNS</span>
                    <span className="text-xs text-muted-foreground">Records</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="mail"
                  className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <Mail className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-start gap-1 w-full">
                    <span className="text-sm font-semibold tracking-tight">Mail</span>
                    <span className="text-xs text-muted-foreground">Accounts</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="file-manager"
                  className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <Folder className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-start gap-1 w-full">
                    <span className="text-sm font-semibold tracking-tight">File Manager</span>
                    <span className="text-xs text-muted-foreground">Files</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="subdomains"
                  className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <Layers className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-start gap-1 w-full">
                    <span className="text-sm font-semibold tracking-tight">Subdomains</span>
                    <span className="text-xs text-muted-foreground">Domains</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="databases"
                  className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <Database className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-start gap-1 w-full">
                    <span className="text-sm font-semibold tracking-tight">Databases</span>
                    <span className="text-xs text-muted-foreground">MySQL/PostgreSQL</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="wordpress"
                  className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <Icons.Wordpress className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-start gap-1 w-full">
                    <span className="text-sm font-semibold tracking-tight">WordPress</span>
                    <span className="text-xs text-muted-foreground">Instances</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="backup-restore"
                  className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <ArchiveRestore className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-start gap-1 w-full">
                    <span className="text-sm font-semibold tracking-tight">Backup & Restore</span>
                    <span className="text-xs text-muted-foreground">Nisc Backup</span>
                  </div>
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" className="flex mt-0.5" />
            </ScrollArea>

            <TabsContent value="overview" className="mt-10">
              <HostingOverview hostingData={hostingData} />
            </TabsContent>

            <TabsContent value="dns" className="mt-10">
              <DnsTable siteId={hostingData.id} domainName={hostingData.gen_info?.name} />
            </TabsContent>

            <TabsContent value="mail" className="mt-10">
              <MailTable
                siteId={hostingData.id}
                domainName={hostingData.gen_info?.name}
                maxMailboxQuotaBytes={mailboxQuotaLimitBytes}
              />
            </TabsContent>

            <TabsContent value="file-manager" className="mt-10">
              <FileManager hostingData={hostingData} />
            </TabsContent>

            <TabsContent value="subdomains" className="mt-10">
              <SubdomainsTable domainName={hostingData.gen_info?.name || ""} />
            </TabsContent>

            <TabsContent value="databases" className="mt-10">
              <DatabasesTable siteId={hostingData.id} domainName={hostingData.gen_info?.name} />
            </TabsContent>

            <TabsContent value="wordpress" className="mt-10">
              <WordPressInstancesTable
                domainName={hostingData.gen_info?.name || ""}
                hostingData={hostingData}
                onInstallClick={() => setInstallWordPressOpen(true)}
              />
            </TabsContent>

            <TabsContent value="backup-restore" className="mt-10">
              {activeTab === "backup-restore" ? (
                <HostingBackupRestoreTab
                  domainName={hostingData.gen_info?.name}
                  username={niscBackupUsername}
                  enabled
                />
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create subscription (Nisc client subscription linked to this Plesk hosting) */}
      <CreateSubscriptionForHostingDialog
        open={isCreateSubscriptionOpen}
        onOpenChange={setIsCreateSubscriptionOpen}
        pleskSubscriptionId={subscriptionId}
        subscriptionName={hostingData?.gen_info?.name}
        onSuccess={() => {
          refetch();
          utils.clientSubscriptions.getHasLinkedSubscriptionByPleskId.invalidate({
            pleskSubscriptionId: subscriptionId,
          });
        }}
      />

      {/* Install WordPress Sheet */}
      {hostingData && (
        <InstallWordPressSheet
          open={installWordPressOpen}
          onOpenChange={setInstallWordPressOpen}
          hostingData={hostingData}
          onSuccess={() => {
            refetch(); // Refresh to show new installation
          }}
        />
      )}

      <HostingSubscriptionSuspendDialog
        dialog={suspendActions.dialog}
        isPending={suspendActions.isPending}
        onOpenChange={suspendActions.setDialogOpen}
        onConfirm={suspendActions.confirm}
      />
    </div>
  );
}
