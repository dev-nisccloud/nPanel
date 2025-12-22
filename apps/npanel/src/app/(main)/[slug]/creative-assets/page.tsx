"use client";

import * as React from "react";
import { z } from "zod";
import { trpc } from "@/utils/trpc";

import { CreativeAssetsListing } from "./_components/creative-assets-listing";
import { EditAssetSheet } from "./_components/edit-asset-sheet";
import { creativeAssetSchema } from "./_components/schema";
import { useVisualCreativeSubscriptions } from "./_components/use-visual-creative-subscriptions";
import { CreativeAssetsPricing } from "./_components/creative-assets-pricing";

export default function CreativeAssetsPage() {
  const [isEditAssetOpen, setIsEditAssetOpen] = React.useState(false);
  const [editingAsset, setEditingAsset] = React.useState<z.infer<typeof creativeAssetSchema> | null>(null);

  // Check for VISUAL_CREATIVE subscriptions
  const { hasServiceSubscriptions, isLoading: isSubscriptionsLoading } = useVisualCreativeSubscriptions();

  // Fetch creative assets - only public ones owned by the team
  const { data: assets, isLoading: isAssetsLoading, isError, error, refetch } = trpc.creativeAssets.getAll.useQuery();
  
  // Filter to only show public creatives owned by the team
  const publicAssets = React.useMemo(() => {
    if (!assets) return [];
    return assets.filter(asset => asset.isPublic === true);
  }, [assets]);

  const isLoading = isSubscriptionsLoading || isAssetsLoading;

  const [archivingAssetId] = React.useState<string | null>(null);
  const [unarchivingAssetId] = React.useState<string | null>(null);

  // Note: Archive/unarchive functionality removed for customer side
  const archiveMutation = {
    mutate: () => {},
  } as any;

  // Archive mutation (disabled for customer side)
  /* const archiveMutation = trpc.creativeAssets.archive.useMutation({
    onMutate: (variables) => {
      setArchivingAssetId(variables.id);
      toast.loading("Archiving asset...", {
        id: `archive-${variables.id}`,
        description: "Please wait while we archive the asset",
      });
    },
    onSuccess: (data, variables) => {
      setArchivingAssetId(null);
      toast.success("Asset archived successfully", {
        id: `archive-${variables.id}`,
        description: `${data.name} has been archived`,
      });
      refetch();
    },
    onError: (error, variables) => {
      setArchivingAssetId(null);
      toast.error("Failed to archive asset", {
        id: `archive-${variables.id}`,
        description: error.message,
      });
    },
  }); */

  // Unarchive mutation (disabled for customer side)
  const unarchiveMutation = {
    mutate: () => {},
  } as any;
  
  /* const unarchiveMutation = trpc.creativeAssets.unarchive.useMutation({
    onMutate: (variables) => {
      setUnarchivingAssetId(variables.id);
      toast.loading("Unarchiving asset...", {
        id: `unarchive-${variables.id}`,
        description: "Please wait while we unarchive the asset",
      });
    },
    onSuccess: (data, variables) => {
      setUnarchivingAssetId(null);
      toast.success("Asset unarchived successfully", {
        id: `unarchive-${variables.id}`,
        description: `${data.name} has been unarchived and set to Draft`,
      });
      refetch();
    },
    onError: (error, variables) => {
      setUnarchivingAssetId(null);
      toast.error("Failed to unarchive asset", {
        id: `unarchive-${variables.id}`,
        description: error.message,
      });
    },
  }); */

  const handleEdit = (id: string) => {
    const asset = assets?.find((a) => a.id === id);
    if (asset) {
      // Cast status to ensure type safety
      setEditingAsset({
        ...asset,
        status: asset.status as "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED",
        versions: asset.versions?.map(version => ({
          ...version,
          fileMetadata: (version as any).fileMetadata ?? null,
          internalApprovalStatus: version.internalApprovalStatus as "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE",
          publicApprovalStatus: version.publicApprovalStatus as "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE",
        })) || [],
      });
      setIsEditAssetOpen(true);
    }
  };

  const handleArchive = (id: string) => {
    archiveMutation.mutate({ id });
  };

  const handleUnarchive = (id: string) => {
    unarchiveMutation.mutate({ id });
  };

  const handleEditAsset = () => {
    refetch();
  };

  // Show pricing if no subscriptions
  if (!isLoading && hasServiceSubscriptions === false) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Creative Assets</h1>
          <p className="text-muted-foreground">
            View and manage your creative assets, versions, and collaborate with your team.
          </p>
        </div>
        <CreativeAssetsPricing />
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Creative Assets</h1>
        <p className="text-muted-foreground">
          View and manage your creative assets, versions, and collaborate with your team.
        </p>
      </div>
      <CreativeAssetsListing 
        data={(publicAssets || []).map(asset => ({
          ...asset,
          status: asset.status as "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED",
          versions: asset.versions?.map(version => ({
            ...version,
            fileMetadata: (version as any).fileMetadata ?? null,
            internalApprovalStatus: version.internalApprovalStatus as "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE",
            publicApprovalStatus: version.publicApprovalStatus as "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE",
          })) || [],
        }))}
        isLoading={isLoading}
        isError={isError}
        error={error ? new Error(error.message || "An error occurred") : undefined}
        onRetry={() => refetch()}
        onEdit={handleEdit}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        archivingAssetId={archivingAssetId}
        unarchivingAssetId={unarchivingAssetId}
      />
      <EditAssetSheet
        open={isEditAssetOpen}
        onOpenChange={(open) => {
          setIsEditAssetOpen(open);
          if (!open) {
            setEditingAsset(null);
          }
        }}
        asset={editingAsset}
        onEditAsset={handleEditAsset}
      />
    </div>
  );
}

