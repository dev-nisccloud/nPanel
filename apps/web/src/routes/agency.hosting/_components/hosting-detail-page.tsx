"use client";

import * as React from "react";
import { ArrowLeft, LayoutDashboard, Network, Mail, Folder, Layers, Database, ArchiveRestore } from "lucide-react";
import { Icons } from "@/components/icons";
import { Link, useSearchParams } from "react-router";
import { hostingDetailTabFromSearch } from "@/components/wordpress/wordpress-return-to";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DetailCardTabsTrigger, DETAIL_TABS_LIST_CLASS } from "@/components/ui/detail-card-tabs";

import { HostingOverview, type HostingDetailTab } from "@/components/hosting/hosting-overview";
import { DnsTable } from "@/components/hosting/dns";
import { MailTable } from "@/components/hosting/mail";
import { EmailMalwareProtectionBadge } from "@/components/hosting/mail/email-malware-protection-badge";
import { FileManager } from "./file-manager";
import { SubdomainsTable } from "@/components/hosting/subdomains";
import { DatabasesTable, usePrefetchDatabasesBySiteId } from "@/components/hosting/databases";
import { WordPressInstancesTable, InstallWordPressSheet } from "@/components/hosting/wordpress";
import { hostingDetailSchema } from "@/components/hosting/hosting-detail-schema";
import { useHostingDetailBatched } from "./use-hosting-detail-batched";
import { getStatusDisplayText, getStatusBadgeVariant } from "./hosting-utils";
import { CreateSubscriptionForHostingDialog } from "./create-subscription-for-hosting-dialog";
import { HostingSubscriptionActionMenu } from "./hosting-subscription-action-menu";
import { PleskLinkedSubscriptionUpgradeButton } from "@/routes/agency.subscriptions/_components/subscription-upgrade-button";
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
  const [searchParams] = useSearchParams();
  const { data: hostingData, isLoading, isError, error, refetch } = useHostingDetailBatched(subscriptionId);
  const [isCreateSubscriptionOpen, setIsCreateSubscriptionOpen] = React.useState(false);
  const [installWordPressOpen, setInstallWordPressOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(() =>
    hostingDetailTabFromSearch(searchParams.get("tab")),
  );
  const [createIntentTab, setCreateIntentTab] = React.useState<HostingDetailTab | null>(null);
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
  usePrefetchDatabasesBySiteId(hostingData?.id);

  const clearCreateIntent = React.useCallback(() => {
    setCreateIntentTab(null);
  }, []);

  const handleNavigateTab = React.useCallback(
    (tab: HostingDetailTab, options?: { openCreate?: boolean }) => {
      setActiveTab(tab);
      if (options?.openCreate) {
        if (tab === "wordpress") {
          setInstallWordPressOpen(true);
          setCreateIntentTab(null);
          return;
        }
        setCreateIntentTab(tab);
        return;
      }
      setCreateIntentTab(null);
    },
    [],
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

          <div className="flex flex-wrap items-center justify-end gap-2">
            {getStatusBadge(hostingData.gen_info.status ?? 0)}
            <EmailMalwareProtectionBadge variant="header" />
            <PleskLinkedSubscriptionUpgradeButton
              pleskSubscriptionId={hostingData.id ?? subscriptionId}
              domain={hostingData.gen_info.name}
              onUpgraded={() => refetch()}
            />
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
              <TabsList className={DETAIL_TABS_LIST_CLASS}>
                <DetailCardTabsTrigger value="overview" icon={LayoutDashboard} title="Overview" subtitle="Details" />
                <DetailCardTabsTrigger value="dns" icon={Network} title="DNS" subtitle="Records" />
                <DetailCardTabsTrigger value="mail" icon={Mail} title="Mail" subtitle="Accounts" />
                <DetailCardTabsTrigger value="file-manager" icon={Folder} title="File Manager" subtitle="Files" />
                <DetailCardTabsTrigger value="subdomains" icon={Layers} title="Subdomains" subtitle="Domains" />
                <DetailCardTabsTrigger value="databases" icon={Database} title="Databases" subtitle="MySQL/PostgreSQL" />
                <DetailCardTabsTrigger value="wordpress" icon={Icons.Wordpress} title="WordPress" subtitle="Instances" />
                <DetailCardTabsTrigger value="backup-restore" icon={ArchiveRestore} title="Backup & Restore" subtitle="Nisc Backup" />
              </TabsList>
              <ScrollBar orientation="horizontal" className="flex mt-0.5" />
            </ScrollArea>

            <TabsContent value="overview" className="mt-10">
              <HostingOverview
                hostingData={hostingData}
                onNavigateTab={handleNavigateTab}
              />
            </TabsContent>

            <TabsContent value="dns" className="mt-10">
              <DnsTable
                siteId={hostingData.id}
                domainName={hostingData.gen_info?.name}
                openCreateSheet={createIntentTab === "dns"}
                onCreateSheetOpened={clearCreateIntent}
              />
            </TabsContent>

            <TabsContent value="mail" className="mt-10">
              <MailTable
                siteId={hostingData.id}
                domainName={hostingData.gen_info?.name}
                maxMailboxQuotaBytes={mailboxQuotaLimitBytes}
                openCreateSheet={createIntentTab === "mail"}
                onCreateSheetOpened={clearCreateIntent}
              />
            </TabsContent>

            <TabsContent value="file-manager" className="mt-10">
              <FileManager
                hostingData={hostingData}
                openCreateSheet={createIntentTab === "file-manager"}
                onCreateSheetOpened={clearCreateIntent}
              />
            </TabsContent>

            <TabsContent value="subdomains" className="mt-10">
              <SubdomainsTable
                domainName={hostingData.gen_info?.name || ""}
                openCreateSheet={createIntentTab === "subdomains"}
                onCreateSheetOpened={clearCreateIntent}
              />
            </TabsContent>

            <TabsContent value="databases" className="mt-10">
              <DatabasesTable
                siteId={hostingData.id}
                openCreateSheet={createIntentTab === "databases"}
                onCreateSheetOpened={clearCreateIntent}
              />
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
                  restoreRole="admin"
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
