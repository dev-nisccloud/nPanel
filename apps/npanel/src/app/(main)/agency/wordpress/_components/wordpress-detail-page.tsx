"use client";

import * as React from "react";
import { ArrowLeft, MoreVertical, Unlink, Edit } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

import { PluginDataTable } from "./plugin-data-table";
import { ThemeDataTable } from "./theme-data-table";
import { WordPressOverview } from "./wordpress-overview";
import { WordPressSiteCredentials } from "./wordpress-site-credentials";
import { WordPressPlugins } from "./wordpress-plugins";
import { WordPressThemes } from "./wordpress-themes";
import { wordpressInstallationSchema } from "./schema";
import { useWordPressDetailBatched } from "./use-wordpress-detail-batched";
import { LinkToTeamDialog } from "./link-to-team-dialog";
import pluginData from "./plugin-data.json";
import themeData from "./theme-data.json";

interface WordPressDetailPageProps {
  installationId: string;
}

// Loading skeleton component
function WordPressDetailSkeleton() {
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
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

// Error component
function WordPressDetailError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agency/wordpress">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Error Loading Installation</h1>
            <p className="text-muted-foreground">Failed to load WordPress installation details</p>
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
        <h3 className="mb-2 text-lg font-semibold">Failed to load installation</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {error.message || "An error occurred while fetching WordPress installation details."}
        </p>
        <div className="flex gap-2">
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
          <Link href="/agency/wordpress">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to WordPress
            </Button>
          </Link>
        </div>
        </div>
      </div>
    );
}

export function WordPressDetailPage({ installationId }: WordPressDetailPageProps) {
  // Use batched endpoint - fetches both WordPress installation and subscription link in one request
  const { data: wpData, subscription: subscriptionData, isLoading, isError, error, refetch } = useWordPressDetailBatched(installationId);
  const [isLinkToTeamOpen, setIsLinkToTeamOpen] = React.useState(false);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = React.useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);

  // Get installation ID as number from wpData or fallback to installationId prop
  const wpInstallationId = wpData?.id ? Number(wpData.id) : Number(installationId);

  const isLinkedToTeam = !!subscriptionData?.teamId;

  const utils = trpc.useUtils();

  // Unlink mutation
  const unlinkMutation = trpc.wordpressSubscriptions.unlinkFromTeam.useMutation({
    onSuccess: () => {
      toast.success("WordPress instance unlinked from team successfully");
      setIsUnlinkDialogOpen(false);
      // Invalidate batched query to refresh data
      utils.wordpressSubscriptions.getDetailWithSubscription.invalidate({ installationId: wpInstallationId });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unlink WordPress instance from team");
    },
  });

  const handleUnlink = () => {
    if (subscriptionData?.id) {
      unlinkMutation.mutate({ subscriptionId: subscriptionData.id });
    }
  };

  // Show loading state
  if (isLoading) {
    return <WordPressDetailSkeleton />;
  }

  // Show error state - check for error or missing data
  if (isError || !wpData || !wpData.id) {
    return <WordPressDetailError error={error as Error} onRetry={() => refetch()} />;
  }

  const getStatusBadge = () => {
    if (wpData.status?.infected) {
      return <Badge variant="destructive">Infected</Badge>;
    }
    if (wpData.status?.unsupported) {
      return <Badge variant="secondary">Unsupported</Badge>;
    }
    if (wpData.status?.alive) {
    return <Badge variant="default">Online</Badge>;
    }
    return <Badge variant="secondary">Offline</Badge>;
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agency/wordpress">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {wpData.displayTitle || wpData.title || `Installation ${wpData.id}`}
            </h1>
            <p className="text-muted-foreground">WordPress installation details</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge()}
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
              <DropdownMenuSeparator />
              {/* Commented out menu items - to be restored later */}
              {/* <DropdownMenuItem>View Details</DropdownMenuItem> */}
              {/* <DropdownMenuItem>Edit Installation</DropdownMenuItem> */}
              {/* <DropdownMenuItem>Update WordPress</DropdownMenuItem> */}
              {/* <DropdownMenuSeparator /> */}
              {/* <DropdownMenuSub> */}
              {/*   <DropdownMenuSubTrigger>Manage</DropdownMenuSubTrigger> */}
              {/*   <DropdownMenuSubContent> */}
              {/*     <DropdownMenuItem>Manage Plugins</DropdownMenuItem> */}
              {/*     <DropdownMenuItem>Manage Themes</DropdownMenuItem> */}
              {/*     <DropdownMenuItem>Backup</DropdownMenuItem> */}
              {/*   </DropdownMenuSubContent> */}
              {/* </DropdownMenuSub> */}
              {/* <DropdownMenuSeparator /> */}
              {/* <DropdownMenuItem>Clone</DropdownMenuItem> */}
              {/* <DropdownMenuItem variant="destructive">Delete Installation</DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="site-credentials">Site Credentials</TabsTrigger>
          <TabsTrigger value="plugins">Plugins</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <WordPressOverview wpData={wpData} />
        </TabsContent>

        <TabsContent value="site-credentials" className="mt-6">
          <WordPressSiteCredentials installationId={String(wpData.id)} />
        </TabsContent>

        <TabsContent value="plugins" className="mt-6">
          <WordPressPlugins installationId={String(wpData.id)} />
        </TabsContent>

        <TabsContent value="themes" className="mt-6">
          <WordPressThemes installationId={String(wpData.id)} />
        </TabsContent>
      </Tabs>

      {/* Link to Team Dialog */}
      <LinkToTeamDialog
        open={isLinkToTeamOpen}
        onOpenChange={setIsLinkToTeamOpen}
        installationId={wpInstallationId}
        onSuccess={() => {
          // Invalidate batched query to refresh data
          utils.wordpressSubscriptions.getDetailWithSubscription.invalidate({ installationId: wpInstallationId });
          refetch();
        }}
      />

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink from Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this WordPress instance from its team? This will remove the association and delete the subscription record so it can be linked to another team later.
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
