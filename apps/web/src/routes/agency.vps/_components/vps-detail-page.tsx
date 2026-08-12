"use client";

import * as React from "react";
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Network, 
  HardDrive, 
  Key, 
  Activity, 
  History, 
  Disc,
  MoreVertical,
  Terminal as TerminalIcon
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DetailCardTabsTrigger, DETAIL_TABS_LIST_CLASS } from "@/components/ui/detail-card-tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { trpc } from "@/utils/trpc";
import { VpsOverview } from "./vps-overview";
import { VpsNetwork } from "./vps-network";
import { VpsStorage } from "./vps-storage";
import { VpsAccess } from "./vps-access";
import { VpsMetrics } from "./vps-metrics";
import { VpsHistory } from "./vps-history";
import { VpsRescue } from "./vps-rescue";
import { VpsTerminal } from "./vps-terminal";
import {
	TeamHivelocityAccessProvider,
	type TeamHivelocityAccess,
} from "./team-hivelocity-access-context";
import { VpsInstanceSuspendDialog } from "./vps-instance-suspend-dialog";
import { useVpsInstanceSuspend } from "./use-vps-instance-suspend";
import { VpsSuspendedPaywall } from "./vps-suspended-paywall";

interface VpsDetailPageProps {
  deviceId: string;
  /** Back link target (VPS/VDS list). Default agency list. */
  vpsListPath?: string;
  subscriptionsPathPrefix?: string;
  /** When set, all Hivelocity calls are scoped to this organization's subscription-linked devices. */
  teamHivelocityAccess?: TeamHivelocityAccess | null;
}

function VpsDetailSkeleton() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="mt-8 space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-[100px] w-[160px] rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export function VpsDetailPage({
  deviceId,
  vpsListPath = "/agency/vps",
  subscriptionsPathPrefix = "/agency/subscriptions",
  teamHivelocityAccess = null,
}: VpsDetailPageProps) {
  const id = parseInt(deviceId, 10);
  const [activeTab, setActiveTab] = React.useState("overview");

  const teamInput =
    teamHivelocityAccess != null
      ? {
          teamSlug: teamHivelocityAccess.teamSlug,
          teamResourceCategory: teamHivelocityAccess.teamResourceCategory,
        }
      : {};

  const isAgencyView = teamHivelocityAccess == null;
  const customerTeamSlug = teamHivelocityAccess?.teamSlug ?? "";
  const teamResourceCategory = teamHivelocityAccess?.teamResourceCategory ?? "vps";

  const suspendedContextQuery = trpc.hivelocity.getCustomerSuspendedVpsContext.useQuery(
    {
      deviceId: id,
      teamSlug: customerTeamSlug,
      teamResourceCategory,
    },
    { enabled: !isAgencyView && customerTeamSlug.length > 0 },
  );

  const customerSuspended = !isAgencyView && suspendedContextQuery.data?.suspended === true;
  const canLoadDeviceDetails =
    isAgencyView ||
    (suspendedContextQuery.isSuccess && suspendedContextQuery.data?.suspended === false);

  const deviceQuery = trpc.hivelocity.getDeviceDetails.useQuery(
    { deviceId: id, ...teamInput },
    { enabled: canLoadDeviceDetails },
  );
  const vpsQuery = trpc.hivelocity.getVpsDetails.useQuery(
    { deviceId: id, ...teamInput },
    { enabled: canLoadDeviceDetails },
  );
  const subscriptionLinkQuery = trpc.clientSubscriptions.getHasLinkedSubscriptionByHivelocityDeviceId.useQuery(
    { hivelocityDeviceId: id },
    { enabled: isAgencyView },
  );

  const suspendActions = useVpsInstanceSuspend(id);
  const instanceName =
    deviceQuery.data?.data?.name ||
    deviceQuery.data?.data?.hostname ||
    `Device ${deviceId}`;

  const isLoading =
    (!isAgencyView && suspendedContextQuery.isLoading) ||
    (canLoadDeviceDetails && (deviceQuery.isLoading || vpsQuery.isLoading));
  const isError = canLoadDeviceDetails && (deviceQuery.isError || vpsQuery.isError);
  const deviceData = deviceQuery.data?.data;
  const vpsData = vpsQuery.data?.data;

  if (isLoading) {
    return <VpsDetailSkeleton />;
  }

  if (customerSuspended && suspendedContextQuery.data?.suspended && customerTeamSlug) {
    return (
      <VpsSuspendedPaywall
        deviceId={id}
        teamSlug={customerTeamSlug}
        context={{
          subscriptionId: suspendedContextQuery.data.subscriptionId,
          serviceLabel: suspendedContextQuery.data.serviceLabel,
          amount: suspendedContextQuery.data.amount,
          currency: suspendedContextQuery.data.currency,
          billingCycle: suspendedContextQuery.data.billingCycle,
          productId: suspendedContextQuery.data.productId,
        }}
        vpsListPath={vpsListPath}
      />
    );
  }

  if (isError || !deviceData) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Failed to load device details</h2>
        <Button className="mt-4" onClick={() => deviceQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  if (!deviceData) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Failed to load device details</h2>
        <Button className="mt-4" onClick={() => deviceQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const linkedSubscriptionId = subscriptionLinkQuery.data?.subscriptionId;
  const linkedSubscriptionStatus = subscriptionLinkQuery.data?.status;
  const isPanelSuspended = linkedSubscriptionStatus === "SUSPENDED";
  const canSuspendPanel =
    isAgencyView &&
    subscriptionLinkQuery.data?.hasLinked &&
    linkedSubscriptionId &&
    (linkedSubscriptionStatus === "ACTIVE" || linkedSubscriptionStatus === "PENDING");
  const canReactivatePanel =
    isAgencyView &&
    subscriptionLinkQuery.data?.hasLinked &&
    linkedSubscriptionId &&
    isPanelSuspended;

  const getStatusBadge = (status: string | undefined) => {
    const s = (status || "unknown").toLowerCase();
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let className = "";

    if (s === "active" || s === "on" || s === "running") {
      className = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";
    } else if (s === "inactive" || s === "off" || s === "stopped") {
      variant = "secondary";
    }

    return (
      <Badge variant={variant} className={`capitalize ${className}`}>
        {status || "Unknown"}
      </Badge>
    );
  };

  const tabTriggers = [
    { value: "overview", icon: LayoutDashboard, title: "Overview", subtitle: "Instance" },
    { value: "network", icon: Network, title: "Network", subtitle: "Routing" },
    { value: "storage", icon: HardDrive, title: "Storage", subtitle: "Volumes" },
    { value: "access", icon: Key, title: "Access", subtitle: "Security" },
    { value: "terminal", icon: TerminalIcon, title: "Terminal", subtitle: "SSH Access" },
    { value: "metrics", icon: Activity, title: "Metrics", subtitle: "Performance" },
    { value: "history", icon: History, title: "History", subtitle: "Events" },
    { value: "rescue", icon: Disc, title: "Rescue", subtitle: "Tools" },
  ];

  return (
    <TeamHivelocityAccessProvider value={teamHivelocityAccess ?? null}>
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={vpsListPath}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-base font-semibold tracking-tight">
                {deviceData.name || deviceData.hostname || `Device ${deviceId}`}
              </h1>
              <p className="text-xs text-muted-foreground">VPS management dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(deviceData.status)}
            {subscriptionLinkQuery.data?.hasLinked ? (
              <Link to={`${subscriptionsPathPrefix}/${subscriptionLinkQuery.data.subscriptionId}`}>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800 gap-1.5 py-1 px-3 hover:bg-green-100/80 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600 shrink-0" />
                  Linked to Subscription
                </Badge>
              </Link>
            ) : null}
            {isAgencyView && isPanelSuspended ? (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800 gap-1.5 py-1 px-3"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" />
                Customer access suspended
              </Badge>
            ) : null}
            {isAgencyView ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Page actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      const promise = Promise.all([deviceQuery.refetch(), vpsQuery.refetch()]);
                      toast.promise(promise, {
                        loading: "Refreshing device data...",
                        success: "Data refreshed successfully",
                        error: "Failed to refresh data",
                      });
                    }}
                  >
                    Refresh Data
                  </DropdownMenuItem>
                  {canSuspendPanel && linkedSubscriptionId ? (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() =>
                        suspendActions.requestSuspend(linkedSubscriptionId, instanceName)
                      }
                    >
                      Deprovision
                    </DropdownMenuItem>
                  ) : null}
                  {canReactivatePanel && linkedSubscriptionId ? (
                    <DropdownMenuItem
                      onClick={() =>
                        suspendActions.requestReactivate(linkedSubscriptionId, instanceName)
                      }
                    >
                      Restore customer access
                    </DropdownMenuItem>
                  ) : null}
                  {isAgencyView &&
                  !canSuspendPanel &&
                  !canReactivatePanel &&
                  !subscriptionLinkQuery.isLoading ? (
                    <DropdownMenuItem
                      disabled
                      className="text-muted-foreground"
                      onSelect={(e) => e.preventDefault()}
                    >
                      Deprovision (requires linked subscription)
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollArea className="w-full -mx-4 px-4 md:mx-0 md:px-0">
              <TabsList className={DETAIL_TABS_LIST_CLASS}>
                {tabTriggers.map((tab) => (
                  <DetailCardTabsTrigger
                    key={tab.value}
                    value={tab.value}
                    icon={tab.icon}
                    title={tab.title}
                    subtitle={tab.subtitle}
                  />
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" className="flex mt-0.5" />
            </ScrollArea>

            <div className="mt-10">
              <TabsContent value="overview">
                <VpsOverview
                  deviceData={deviceData}
                  vpsData={vpsData}
                  teamSlug={teamHivelocityAccess?.teamSlug}
                />
              </TabsContent>
              <TabsContent value="terminal" forceMount className="data-[state=inactive]:hidden">
                <VpsTerminal deviceData={deviceData} />
              </TabsContent>
              <TabsContent value="network">
                <VpsNetwork deviceData={deviceData} vpsData={vpsData} />
              </TabsContent>
              <TabsContent value="storage">
                <VpsStorage deviceId={id} facilityCode={(deviceData?.location as any)?.facility} />
              </TabsContent>
              <TabsContent value="access">
                <VpsAccess deviceData={deviceData} onTabChange={setActiveTab} />
              </TabsContent>
              <TabsContent value="metrics">
                <VpsMetrics deviceId={id} />
              </TabsContent>
              <TabsContent value="history">
                <VpsHistory deviceId={id} />
              </TabsContent>
              <TabsContent value="rescue">
                <VpsRescue deviceId={id} deviceData={deviceData} vpsData={vpsData} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
      <VpsInstanceSuspendDialog
        dialog={suspendActions.dialog}
        isPending={suspendActions.isPending}
        onOpenChange={suspendActions.setDialogOpen}
        onConfirm={suspendActions.confirm}
      />
    </TeamHivelocityAccessProvider>
  );
}
