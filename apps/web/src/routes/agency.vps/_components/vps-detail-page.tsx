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
  ChevronRight,
  MoreVertical,
  Terminal as TerminalIcon
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

interface VpsDetailPageProps {
  deviceId: string;
  /** Back link target (VPS/VDS list). Default agency list. */
  vpsListPath?: string;
  subscriptionsPathPrefix?: string;
  /** When set, all Hivelocity calls are scoped to this team's subscription-linked devices. */
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

  const deviceQuery = trpc.hivelocity.getDeviceDetails.useQuery({ deviceId: id, ...teamInput });
  const vpsQuery = trpc.hivelocity.getVpsDetails.useQuery({ deviceId: id, ...teamInput });

  const isLoading = deviceQuery.isLoading || vpsQuery.isLoading;
  const isError = deviceQuery.isError || vpsQuery.isError;
  const deviceData = deviceQuery.data?.data;
  const vpsData = vpsQuery.data?.data;

  if (isLoading) return <VpsDetailSkeleton />;
  if (isError || !deviceData) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Failed to load device details</h2>
        <Button className="mt-4" onClick={() => deviceQuery.refetch()}>Retry</Button>
      </div>
    );
  }

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
            {teamHivelocityAccess == null ? (
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
                  <DropdownMenuItem className="text-destructive">Deprovision</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollArea className="w-full -mx-4 px-4 md:mx-0 md:px-0">
              <TabsList className="inline-flex h-auto w-max min-w-full gap-2 p-1.5 bg-muted/50 rounded-lg border border-border/50">
                {tabTriggers.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]"
                  >
                    <div className="flex items-center justify-between w-full">
                      <tab.icon className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col items-start gap-1 w-full">
                      <span className="text-sm font-semibold tracking-tight">{tab.title}</span>
                      <span className="text-xs text-muted-foreground">{tab.subtitle}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" className="flex" />
            </ScrollArea>

            <div className="mt-10">
              <TabsContent value="overview">
                <VpsOverview
                  deviceData={deviceData}
                  vpsData={vpsData}
                  subscriptionsPathPrefix={subscriptionsPathPrefix}
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
                <VpsRescue deviceId={id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
    </TeamHivelocityAccessProvider>
  );
}
