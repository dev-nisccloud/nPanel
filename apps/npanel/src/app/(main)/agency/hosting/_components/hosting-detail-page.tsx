"use client";

import * as React from "react";
import { ArrowLeft, MoreVertical, Edit, Unlink, LayoutDashboard, Network, Mail, Folder, Layers, ChevronRight, Database } from "lucide-react";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { LinkToTeamDialog } from "./link-to-team-dialog";
import { LinkToSubscriptionDialog } from "./link-to-subscription-dialog";
import { EditSubscriptionDialog } from "./edit-subscription-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

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
            <Link href="/agency/hosting">
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
            <Link href="/agency/hosting">
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
  const { data: hostingData, subscription: subscriptionData, isLoading, isError, error, refetch, rawData } = useHostingDetailBatched(subscriptionId);
  const [isLinkToTeamOpen, setIsLinkToTeamOpen] = React.useState(false);
  const [installWordPressOpen, setInstallWordPressOpen] = React.useState(false);
  const [isLinkToSubscriptionOpen, setIsLinkToSubscriptionOpen] = React.useState(false);
  const [isEditSubscriptionOpen, setIsEditSubscriptionOpen] = React.useState(false);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = React.useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);

  // Get pleskFilterId from raw data
  const pleskFilterId = String(rawData?.parsed?.packet?.webspace?.get?.result?.["filter-id"] || "");

  const isLinkedToTeam = !!subscriptionData?.teamId;

  // Find or get HostingSubscription ID by pleskFilterId
  // We need this to check if it's linked to a service subscription and to link it
  const { data: hostingSubscriptionByFilter } = trpc.hosting.getByPleskFilterId.useQuery(
    { pleskFilterId },
    { enabled: !!pleskFilterId && pleskFilterId !== "" }
  );

  // Check if hosting subscription is already linked to a service subscription
  const { data: existingServiceSubscription } = trpc.serviceSubscriptions.getByHostingSubscriptionId.useQuery(
    { hostingSubscriptionId: hostingSubscriptionByFilter?.id || "" },
    { enabled: !!hostingSubscriptionByFilter?.id }
  );
  const isLinkedToServiceSubscription = !!existingServiceSubscription;

  const utils = trpc.useUtils();

  // Unlink mutation
  const unlinkMutation = trpc.hosting.unlinkFromTeam.useMutation({
    onSuccess: () => {
      toast.success("Subscription unlinked from team successfully");
      setIsUnlinkDialogOpen(false);
      // Invalidate subscription query to refresh data
      utils.hosting.getByPleskFilterId.invalidate({ pleskFilterId });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unlink subscription from team");
    },
  });

  const handleUnlink = () => {
    if (subscriptionData?.id) {
      unlinkMutation.mutate({ subscriptionId: subscriptionData.id });
    }
  };

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
            <Link href="/agency/hosting">
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
            <DropdownMenu open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setIsActionMenuOpen(false);
                    setTimeout(() => setIsLinkToTeamOpen(true), 0);
                  }}
                  disabled={isLinkedToTeam}
                >
                  Link to Team
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setIsActionMenuOpen(false);
                    setTimeout(() => setIsLinkToSubscriptionOpen(true), 0);
                  }}
                  disabled={isLinkedToServiceSubscription}
                >
                  Link to Subscription
                </DropdownMenuItem>
                {isLinkedToTeam && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setIsActionMenuOpen(false);
                      setTimeout(() => setIsUnlinkDialogOpen(true), 0);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Unlink className="mr-2 h-4 w-4" />
                    Unlink from Team
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setIsActionMenuOpen(false);
                    setTimeout(() => setIsEditSubscriptionOpen(true), 0);
                  }}
                  disabled={!subscriptionData}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Subscription
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Commented out menu items - to be restored later */}
                {/* <DropdownMenuItem>View Details</DropdownMenuItem> */}
                {/* <DropdownMenuItem>Renew</DropdownMenuItem> */}
                {/* <DropdownMenuSeparator /> */}
                {/* <DropdownMenuSub> */}
                {/*   <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger> */}
                {/*   <DropdownMenuSubContent> */}
                {/*     <DropdownMenuItem>Active</DropdownMenuItem> */}
                {/*     <DropdownMenuItem>Suspended</DropdownMenuItem> */}
                {/*     <DropdownMenuItem>Disabled</DropdownMenuItem> */}
                {/*   </DropdownMenuSubContent> */}
                {/* </DropdownMenuSub> */}
                {/* <DropdownMenuSeparator /> */}
                {/* <DropdownMenuItem>Suspend</DropdownMenuItem> */}
                {/* <DropdownMenuItem variant="destructive">Cancel</DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="overview" className="w-full">
            <ScrollArea className="w-full -mx-4 px-4 md:mx-0 md:px-0 scrollbar-default">
              <TabsList className="inline-flex h-auto w-max min-w-full gap-2 p-1.5 bg-muted/50 rounded-lg border border-border/50">
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
              </TabsList>
              <ScrollBar orientation="horizontal" className="flex" />
            </ScrollArea>

            <TabsContent value="overview" className="mt-10">
              <HostingOverview hostingData={hostingData} />
            </TabsContent>

            <TabsContent value="dns" className="mt-10">
              <DnsTable siteId={hostingData.id} domainName={hostingData.gen_info?.name} />
            </TabsContent>

            <TabsContent value="mail" className="mt-10">
              <MailTable siteId={hostingData.id} domainName={hostingData.gen_info?.name} />
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
          </Tabs>
        </div>
      </div>

      {/* Link to Team Dialog */}
      <LinkToTeamDialog
        open={isLinkToTeamOpen}
        onOpenChange={setIsLinkToTeamOpen}
        subscriptionId={subscriptionId}
        pleskFilterId={pleskFilterId}
        hostingType={hostingData?.gen_info?.htype}
        onSuccess={() => {
          // Invalidate subscription query to refresh data
          utils.hosting.getByPleskFilterId.invalidate({ pleskFilterId });
          refetch();
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

      {/* Link to Subscription Dialog */}
      <LinkToSubscriptionDialog
        open={isLinkToSubscriptionOpen}
        onOpenChange={setIsLinkToSubscriptionOpen}
        subscriptionId={subscriptionId}
        pleskFilterId={pleskFilterId}
        hostingType={hostingData?.gen_info?.htype}
        subscriptionName={hostingData?.gen_info?.name}
        onSuccess={() => {
          // Invalidate queries to refresh data
          if (hostingSubscriptionByFilter?.id) {
            utils.serviceSubscriptions.getByHostingSubscriptionId.invalidate({
              hostingSubscriptionId: hostingSubscriptionByFilter.id
            });
          }
          utils.hosting.getByPleskFilterId.invalidate({ pleskFilterId });
          refetch();
        }}
      />

      {/* Edit Subscription Dialog */}
      <EditSubscriptionDialog
        open={isEditSubscriptionOpen}
        onOpenChange={setIsEditSubscriptionOpen}
        subscriptionId={subscriptionData?.id || ""}
        initialData={subscriptionData ? {
          hostingPlanId: subscriptionData.hostingPlanId,
          primaryDomain: subscriptionData.primaryDomain,
          billingCycle: subscriptionData.billingCycle,
          nextRenewalDate: subscriptionData.nextRenewalDate ? new Date(subscriptionData.nextRenewalDate) : null,
          expiryDate: subscriptionData.expiryDate ? new Date(subscriptionData.expiryDate) : null,
          notes: subscriptionData.notes,
          autoRenew: subscriptionData.autoRenew,
        } : undefined}
        onSuccess={() => {
          // Invalidate subscription query to refresh data
          utils.hosting.getByPleskFilterId.invalidate({ pleskFilterId });
          refetch();
        }}
      />

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink from Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this subscription from its team? This will remove the association but will not delete the subscription.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlinkMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlink}
              disabled={unlinkMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unlinkMutation.isPending ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Unlinking...
                </>
              ) : (
                "Unlink"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
