"use client";

import * as React from "react";
import { ArrowLeft, LayoutDashboard, Network, Mail, Folder, Layers, ChevronRight, Database } from "lucide-react";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { EditSubscriptionDialog } from "./edit-subscription-dialog";
import { UnauthorizedAccess } from "./unauthorized-access";
import { NotFoundPage } from "./not-found-page";
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
function HostingDetailError({ error, onRetry, teamSlug }: { error: Error; onRetry: () => void; teamSlug: string }) {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${teamSlug}/hosting`}>
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
          <Link href={`/${teamSlug}/hosting`}>
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
  const pathname = usePathname();
  // Extract team slug from URL (first segment after /)
  const teamSlug = pathname.split("/")[1];

  // Use batched endpoint - fetches both hosting data and subscription link in one request
  const { data: hostingData, subscription: subscriptionData, serviceSubscription: serviceSubscriptionData, isLoading, isError, error, refetch, rawData } = useHostingDetailBatched(subscriptionId);
  const [isEditSubscriptionOpen, setIsEditSubscriptionOpen] = React.useState(false);
  const [installWordPressOpen, setInstallWordPressOpen] = React.useState(false);

  // Get pleskFilterId from raw data
  const pleskFilterId = String(rawData?.parsed?.packet?.webspace?.get?.result?.["filter-id"] || "");

  const utils = trpc.useUtils();

  // Show loading state
  if (isLoading) {
    return <HostingDetailSkeleton />;
  }

  // Handle FORBIDDEN error (unauthorized access)
  if (isError && (error as any)?.data?.code === "FORBIDDEN") {
    return <UnauthorizedAccess />;
  }

  // Handle NOT_FOUND error (404)
  if (isError && (error as any)?.data?.code === "NOT_FOUND") {
    return <NotFoundPage />;
  }

  // Show error state for other errors
  if (isError || !hostingData) {
    return <HostingDetailError error={error as Error} onRetry={() => refetch()} teamSlug={teamSlug} />;
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
            <Link href={`/${teamSlug}/hosting`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {hostingData.gen_info.name || `Subscription ${hostingData.id}`}
              </h1>
              <p className="text-muted-foreground">Hosting subscription details</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full flex-wrap gap-3 @sm/main:flex-nowrap @sm/main:grid @sm/main:grid-cols-5 h-auto p-0 bg-transparent">
          <TabsTrigger 
            value="overview"
            className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
          >
            <div className="flex items-center justify-between w-full">
              <LayoutDashboard className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="font-semibold text-sm">Overview</span>
              <span className="text-xs text-muted-foreground">Details</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="dns"
            className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
          >
            <div className="flex items-center justify-between w-full">
              <Network className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="font-semibold text-sm">DNS</span>
              <span className="text-xs text-muted-foreground">Records</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="mail"
            className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
          >
            <div className="flex items-center justify-between w-full">
              <Mail className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="font-semibold text-sm">Mail</span>
              <span className="text-xs text-muted-foreground">Accounts</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="file-manager"
            className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
          >
            <div className="flex items-center justify-between w-full">
              <Folder className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="font-semibold text-sm">File Manager</span>
              <span className="text-xs text-muted-foreground">Files</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="subdomains"
            className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
          >
            <div className="flex items-center justify-between w-full">
              <Layers className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="font-semibold text-sm">Subdomains</span>
              <span className="text-xs text-muted-foreground">Domains</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="databases"
            className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
          >
            <div className="flex items-center justify-between w-full">
              <Database className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="font-semibold text-sm">Databases</span>
              <span className="text-xs text-muted-foreground">MySQL/PostgreSQL</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="wordpress"
            className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
          >
            <div className="flex items-center justify-between w-full">
              <Icons.Wordpress className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="font-semibold text-sm">WordPress</span>
              <span className="text-xs text-muted-foreground">Instances</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <HostingOverview 
            hostingData={hostingData} 
            subscriptionData={subscriptionData}
            serviceSubscriptionData={serviceSubscriptionData}
          />
        </TabsContent>
        
        <TabsContent value="dns" className="mt-6">
          <DnsTable siteId={hostingData.id} />
        </TabsContent>
        
        <TabsContent value="mail" className="mt-6">
          <MailTable siteId={hostingData.id} domainName={hostingData.gen_info?.name} />
        </TabsContent>
        
        <TabsContent value="file-manager" className="mt-6">
          <FileManager hostingData={hostingData} />
        </TabsContent>
        
        <TabsContent value="subdomains" className="mt-6">
          <SubdomainsTable domainName={hostingData.gen_info?.name || ""} />
        </TabsContent>

        <TabsContent value="databases" className="mt-6">
          <DatabasesTable siteId={hostingData.id} domainName={hostingData.gen_info?.name} />
        </TabsContent>

        <TabsContent value="wordpress" className="mt-6">
          <WordPressInstancesTable 
            domainName={hostingData.gen_info?.name || ""} 
            hostingData={hostingData}
            teamSlug={teamSlug}
            returnToHostingId={subscriptionId}
            onInstallClick={() => setInstallWordPressOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Install WordPress Sheet */}
      {hostingData && (
        <InstallWordPressSheet
          open={installWordPressOpen}
          onOpenChange={setInstallWordPressOpen}
          hostingData={hostingData}
          onSuccess={() => refetch()}
        />
      )}

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
      </div>
    </div>
    </div>
  );
}
