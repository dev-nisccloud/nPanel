"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CreativeAssetsListing } from "./_components/creative-assets-listing";
import { AddAssetSheet } from "./_components/add-asset-sheet";
import { EditAssetSheet } from "./_components/edit-asset-sheet";
import { creativeAssetSchema } from "./_components/schema";
import { CreativeBriefsTabContent } from "./_components/creative-briefs-tab-content";

export default function CreativeAssetsPage() {
  const [isAddAssetOpen, setIsAddAssetOpen] = React.useState(false);
  const [isEditAssetOpen, setIsEditAssetOpen] = React.useState(false);
  const [editingAsset, setEditingAsset] = React.useState<z.infer<typeof creativeAssetSchema> | null>(null);

  // Fetch creative assets
  const { data: assets, isLoading, isError, error, refetch } = trpc.creativeAssets.getAll.useQuery();

  const handleAddAsset = () => {
    // Refetch after creation
    refetch();
    toast.success("Creative asset created successfully!");
  };

  const [archivingAssetId, setArchivingAssetId] = React.useState<string | null>(null);
  const [unarchivingAssetId, setUnarchivingAssetId] = React.useState<string | null>(null);

  // Archive mutation
  const archiveMutation = trpc.creativeAssets.archive.useMutation({
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
  });

  // Unarchive mutation
  const unarchiveMutation = trpc.creativeAssets.unarchive.useMutation({
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
  });

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

  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "briefs" ? "briefs" : "design";

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">Creative Assets</h1>
					<p className="text-xs text-muted-foreground">
						Manage creative assets, versions, approvals, and collaborate with your team and clients.
					</p>
				</div>

				<Tabs defaultValue={defaultTab} className="w-full mt-6">
					<TabsList className="w-fit">
						<TabsTrigger value="design">Creative & design</TabsTrigger>
						<TabsTrigger value="briefs">Creative briefs</TabsTrigger>
					</TabsList>

					<TabsContent value="design" className="mt-6">
						<CreativeAssetsListing
							data={(assets ?? []).map((asset) => ({
								...asset,
								status: asset.status as "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED",
								versions:
									asset.versions?.map((version) => ({
										...version,
										fileMetadata: (version as { fileMetadata?: unknown })?.fileMetadata ?? null,
										internalApprovalStatus: version.internalApprovalStatus as
											| "PENDING"
											| "APPROVED"
											| "REJECTED"
											| "NOT_APPLICABLE",
										publicApprovalStatus: version.publicApprovalStatus as
											| "PENDING"
											| "APPROVED"
											| "REJECTED"
											| "NOT_APPLICABLE",
									})) ?? [],
							}))}
							isLoading={isLoading}
							isError={isError}
							error={error ? new Error(error.message ?? "An error occurred") : undefined}
							onRetry={() => refetch()}
							onEdit={handleEdit}
							onArchive={handleArchive}
							onUnarchive={handleUnarchive}
							archivingAssetId={archivingAssetId}
							unarchivingAssetId={unarchivingAssetId}
							onAddAsset={() => setIsAddAssetOpen(true)}
						/>
					</TabsContent>

					<TabsContent value="briefs" className="mt-6">
						<CreativeBriefsTabContent />
					</TabsContent>
				</Tabs>
			</div>
			<AddAssetSheet
				open={isAddAssetOpen}
				onOpenChange={setIsAddAssetOpen}
				onAddAsset={handleAddAsset}
			/>
			<EditAssetSheet
				open={isEditAssetOpen}
				onOpenChange={(open) => {
					setIsEditAssetOpen(open);
					if (!open) setEditingAsset(null);
				}}
				asset={editingAsset}
				onEditAsset={handleEditAsset}
			/>
		</div>
	);
}

