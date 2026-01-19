"use client";

import * as React from "react";
import { ArrowLeft, MoreVertical, Edit, Unlink, LayoutDashboard, Mail, ChevronRight } from "lucide-react";
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
import { MailTable } from "./mail-table";
import { hostingDetailSchema } from "./hosting-detail-schema";
import { useHostingDetailBatched } from "./use-hosting-detail-batched";
import { getStatusDisplayText, getStatusBadgeVariant } from "./hosting-utils";
import { LinkToTeamDialog } from "./link-to-team-dialog";
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
    <div className="@container/main flex flex-col gap-4 md:gap-6">
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
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-16" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

// Error component
function HostingDetailError({ error, onRetry, teamSlug }: { error: Error; onRetry: () => void; teamSlug: string }) {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${teamSlug}/emails`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Error Loading Subscription</h1>
            <p className="text-muted-foreground">Failed to load email hosting subscription details</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center">
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
          {error.message || "An error occurred while fetching email hosting subscription details."}
        </p>
        <div className="flex gap-2">
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
          <Link href={`/${teamSlug}/emails`}>
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Emails
            </Button>
          </Link>
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
  const [isLinkToTeamOpen, setIsLinkToTeamOpen] = React.useState(false);
  const [isEditSubscriptionOpen, setIsEditSubscriptionOpen] = React.useState(false);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = React.useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);

  // Get pleskFilterId from raw data
  const pleskFilterId = String(rawData?.parsed?.packet?.webspace?.get?.result?.["filter-id"] || "");

  const isLinkedToTeam = !!subscriptionData?.teamId;

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
    return (
      <Badge variant={getStatusBadgeVariant(status)}>
        {getStatusDisplayText(status)}
      </Badge>
    );
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${teamSlug}/emails`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {hostingData.gen_info.name || `Subscription ${hostingData.id}`}
            </h1>
            <p className="text-muted-foreground">Email hosting subscription details</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full flex-wrap gap-3 @sm/main:flex-nowrap @sm/main:grid @sm/main:grid-cols-2 h-auto p-0 bg-transparent">
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
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <HostingOverview 
            hostingData={hostingData} 
            subscriptionData={subscriptionData}
            serviceSubscriptionData={serviceSubscriptionData}
          />
        </TabsContent>
        
        <TabsContent value="mail" className="mt-6">
          <MailTable siteId={hostingData.id} domainName={hostingData.gen_info?.name} />
        </TabsContent>
      </Tabs>

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
