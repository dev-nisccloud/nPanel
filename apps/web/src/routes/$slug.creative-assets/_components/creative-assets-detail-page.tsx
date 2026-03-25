"use client";

import * as React from "react";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { Link } from "react-router";
import { useLocation } from "react-router";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

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

import { creativeAssetSchema } from "./schema";
import { AssetStatusBadge } from "./asset-status-badge";
import { VersionsTab } from "./versions-tab";
import { PermissionsTab } from "./permissions-tab";
import { ManagePermissionsSheet } from "./manage-permissions-sheet";
import { Globe, Lock, Archive, ArchiveRestore, Check, X } from "lucide-react";
import { useUserName } from "./use-user-names";

interface CreativeAssetsDetailPageProps {
  assetId: string;
  onEdit?: () => void;
  onArchive?: () => void;
}

// Loading skeleton component
function CreativeAssetsDetailSkeleton() {
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
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

// Error component
function CreativeAssetsDetailError({
  error,
  onRetry,
  teamSlug,
}: {
  error: Error;
  onRetry: () => void;
  teamSlug: string;
}) {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/${teamSlug}/creative-assets`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Error Loading Asset</h1>
            <p className="text-muted-foreground">Failed to load creative asset details</p>
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
        <h3 className="mb-2 text-lg font-semibold">Failed to load asset</h3>
        <p className="mb-4 text-sm text-muted-foreground">{error.message || "An error occurred"}</p>
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      </div>
    </div>
  );
}

export function CreativeAssetsDetailPage({
  assetId,
  onEdit,
  onArchive,
}: CreativeAssetsDetailPageProps) {
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1];
  
  // Fetch asset with proper caching - staleTime of 5 minutes to prevent refetching when switching tabs
  const {
    data: asset,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.creativeAssets.getById.useQuery(
    { id: assetId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - prevents refetching when switching tabs
      gcTime: 10 * 60 * 1000, // 10 minutes - keeps cache for longer
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (NOT_FOUND, FORBIDDEN, etc.)
        if (error?.data?.code === "NOT_FOUND" || error?.data?.code === "FORBIDDEN") {
          return false;
        }
        return failureCount < 3;
      },
    }
  );

  // All hooks must be called at the top level, before any conditional returns
  const utils = trpc.useUtils();
  const [isManagePermissionsOpen, setIsManagePermissionsOpen] = React.useState(false);
  
  // Fetch createdBy user name - cached to avoid refetching
  const { name: createdByName } = useUserName(asset?.createdBy);

  // Mutations for version management
  const updateVersionStatusMutation = trpc.creativeAssets.updateVersionStatus.useMutation({
    onSuccess: () => {
      utils.creativeAssets.getById.invalidate({ id: assetId });
      toast.success("Version status updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update version status");
    },
  });

  const makeVersionPrivateMutation = trpc.creativeAssets.makeVersionPrivate.useMutation({
    onSuccess: () => {
      utils.creativeAssets.getById.invalidate({ id: assetId });
      toast.success("Version made private successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to make version private");
    },
  });

  // Mutations for asset status management
  const updateAssetStatusMutation = trpc.creativeAssets.update.useMutation({
    onSuccess: () => {
      utils.creativeAssets.getById.invalidate({ id: assetId });
      toast.success("Asset status updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update asset status");
    },
  });

  const archiveAssetMutation = trpc.creativeAssets.archive.useMutation({
    onSuccess: () => {
      utils.creativeAssets.getById.invalidate({ id: assetId });
      toast.success("Asset archived successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to archive asset");
    },
  });

  const unarchiveAssetMutation = trpc.creativeAssets.unarchive.useMutation({
    onSuccess: () => {
      utils.creativeAssets.getById.invalidate({ id: assetId });
      toast.success("Asset unarchived successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unarchive asset");
    },
  });

  const handleUpdateVersionStatus = React.useCallback((versionId: string, status: "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE") => {
    updateVersionStatusMutation.mutate({ versionId, status });
  }, [updateVersionStatusMutation]);

  const handleMakeVersionPrivate = React.useCallback((versionId: string) => {
    makeVersionPrivateMutation.mutate({ versionId });
  }, [makeVersionPrivateMutation]);

  const handleChangeAssetStatus = React.useCallback((status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED") => {
    updateAssetStatusMutation.mutate({ id: assetId, status });
  }, [updateAssetStatusMutation, assetId]);

  const handleArchiveAsset = React.useCallback(() => {
    archiveAssetMutation.mutate({ id: assetId });
  }, [archiveAssetMutation, assetId]);

  const handleUnarchiveAsset = React.useCallback(() => {
    unarchiveAssetMutation.mutate({ id: assetId });
  }, [unarchiveAssetMutation, assetId]);

  // Show loading state
  if (isLoading) {
    return <CreativeAssetsDetailSkeleton />;
  }

  // Show error state
  if (isError) {
    const errorMessage = error?.message || (error as any)?.data?.message || "An error occurred";
    return (
      <CreativeAssetsDetailError
        error={new Error(errorMessage)}
        onRetry={() => {
          refetch();
        }}
        teamSlug={teamSlug}
      />
    );
  }

  // Show not found state
  if (!asset) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/${teamSlug}/creative-assets`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Asset Not Found</h1>
              <p className="text-muted-foreground">The creative asset you're looking for doesn't exist.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleManagePermissions = () => {
    setIsManagePermissionsOpen(true);
  };

  const handlePermissionsManaged = (data: any) => {
    // Handle permissions update - invalidate query to refetch asset data
    utils.creativeAssets.getById.invalidate({ id: assetId });
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/${teamSlug}/creative-assets`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{asset.name}</h1>
              {asset.description && (
                <p className="text-muted-foreground mt-1">{asset.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => handleChangeAssetStatus("DRAFT")}
                      disabled={asset.status === "DRAFT"}
                    >
                      {asset.status === "DRAFT" && <Check className="mr-2 h-4 w-4" />}
                      Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleChangeAssetStatus("IN_REVIEW")}
                      disabled={asset.status === "IN_REVIEW"}
                    >
                      {asset.status === "IN_REVIEW" && <Check className="mr-2 h-4 w-4" />}
                      In Review
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleChangeAssetStatus("APPROVED")}
                      disabled={asset.status === "APPROVED"}
                    >
                      {asset.status === "APPROVED" && <Check className="mr-2 h-4 w-4" />}
                      Approved
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleChangeAssetStatus("ARCHIVED")}
                      disabled={asset.status === "ARCHIVED"}
                      className="text-destructive focus:text-destructive"
                    >
                      {asset.status === "ARCHIVED" && <Check className="mr-2 h-4 w-4" />}
                      Archived
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                {asset.status === "ARCHIVED" ? (
                  <DropdownMenuItem onClick={handleUnarchiveAsset}>
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Unarchive
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleArchiveAsset} className="text-destructive focus:text-destructive">
                    <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Overview Info in Header */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Status
            </p>
            <AssetStatusBadge status={asset.status as "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED"} />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Category
            </p>
            <Badge variant="outline">{asset.category || "Uncategorized"}</Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Internal Version
            </p>
            <p className="text-sm font-medium">
              {asset.currentInternalVersion ? `v${asset.currentInternalVersion}` : "Ã¢â‚¬â€"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Public Version
            </p>
            <p className="text-sm font-medium">
              {asset.currentPublicVersion ? `v${asset.currentPublicVersion}` : "Ã¢â‚¬â€"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              File Type
            </p>
            <p className="text-sm font-medium">
              {asset.versions && asset.versions.length > 0
                ? asset.versions[0]?.mimeType || "Ã¢â‚¬â€"
                : "Ã¢â‚¬â€"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Visibility
            </p>
            <div className="flex items-center gap-1">
              {asset.isPublic ? (
                <>
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="default" className="text-xs">Public</Badge>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="secondary" className="text-xs">Internal</Badge>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Versions
            </p>
            <p className="text-sm font-medium">{asset.versions?.length || 0}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Created By
            </p>
            <p className="text-sm font-medium">{createdByName}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="versions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="mt-6">
          <VersionsTab
            asset={{
              ...asset,
              status: asset.status as "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED",
              versions: asset.versions?.map(version => ({
                ...version,
                fileMetadata: (version as any).fileMetadata ?? null,
                internalApprovalStatus: version.internalApprovalStatus as "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE",
                publicApprovalStatus: version.publicApprovalStatus as "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE",
              })) || [],
            }}
            onUpdateVersionStatus={handleUpdateVersionStatus}
            onMakePrivate={handleMakeVersionPrivate}
            onEditVersion={(versionId) => {
              // Handle edit version
              console.log("Edit version:", versionId);
            }}
          />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <PermissionsTab 
            asset={{
              ...asset,
              status: asset.status as "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED",
              versions: asset.versions?.map(version => ({
                ...version,
                fileMetadata: (version as any).fileMetadata ?? null,
                internalApprovalStatus: version.internalApprovalStatus as "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE",
                publicApprovalStatus: version.publicApprovalStatus as "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE",
              })) || [],
            }} 
            onManagePermissions={handleManagePermissions} 
          />
        </TabsContent>
      </Tabs>


      {/* Manage Permissions Sheet */}
      <ManagePermissionsSheet
        open={isManagePermissionsOpen}
        onOpenChange={setIsManagePermissionsOpen}
        assetId={assetId}
        onManagePermissions={handlePermissionsManaged}
      />
    </div>
  );
}

