"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { creativeAssetSchema } from "./schema";
import { CreativeAssetsTable } from "./creative-assets-table";

// Skeleton component for loading state (table style, matching subscriptions)
function CreativeAssetsListingSkeleton() {
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Name</TableHead>
						<TableHead>Category</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Visibility</TableHead>
						<TableHead>Internal</TableHead>
						<TableHead>Public</TableHead>
						<TableHead>Updated</TableHead>
						<TableHead className="w-24">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{[...Array(5)].map((_, i) => (
						<TableRow key={i}>
							<TableCell className="pl-6">
								<Skeleton className="h-4 w-40" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-20" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-16" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-16" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-12" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-12" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-20" />
							</TableCell>
							<TableCell />
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

// Error component (card wrapper to match subscriptions pattern)
function CreativeAssetsListingError({ error, onRetry }: { error: Error; onRetry: () => void }) {
	return (
		<div className="overflow-hidden rounded-lg border bg-card">
			<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
				<p className="text-sm text-muted-foreground mb-4">
					{error.message ?? "An error occurred while fetching creative assets."}
				</p>
				<Button type="button" onClick={onRetry} variant="outline">
					Try again
				</Button>
			</div>
		</div>
	);
}

interface CreativeAssetsListingProps {
  data: z.infer<typeof creativeAssetSchema>[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  archivingAssetId?: string | null;
  unarchivingAssetId?: string | null;
  onAddAsset?: () => void;
}

export function CreativeAssetsListing({
  data,
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  onEdit,
  onArchive,
  onUnarchive,
  archivingAssetId = null,
  unarchivingAssetId = null,
  onAddAsset,
}: CreativeAssetsListingProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [publicFilter, setPublicFilter] = React.useState<string>("all");

  // Filter data based on search query and filters
  const filteredData = React.useMemo(() => {
    let filtered = data;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((asset) =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.description && asset.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((asset) => asset.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((asset) => asset.category === categoryFilter);
    }

    // Public filter
    if (publicFilter !== "all") {
      const isPublic = publicFilter === "public";
      filtered = filtered.filter((asset) => asset.isPublic === isPublic);
    }

    return filtered;
  }, [data, searchQuery, statusFilter, categoryFilter, publicFilter]);

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = data.map((asset) => asset.category).filter(Boolean) as string[];
    return Array.from(new Set(cats));
  }, [data]);

  const handleEdit = (id: string) => {
    if (onEdit) {
      onEdit(id);
    }
  };

  const handleArchive = (id: string) => {
    if (onArchive) {
      onArchive(id);
    }
  };

  // const handleUploadVersion = (id: string) => {
  //   if (onUploadVersion) {
  //     onUploadVersion(id);
  //   }
  // };

  // Show loading state
  if (isLoading) {
    return <CreativeAssetsListingSkeleton />;
  }

  // Show error state
  if (isError && error) {
    return <CreativeAssetsListingError error={error} onRetry={onRetry || (() => {})} />;
  }

	return (
		<>
			{/* Toolbar: search + filters + Create (subscriptions-style) */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-2">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search assets..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
							aria-label="Search creative assets"
						/>
					</div>
					{searchQuery ? (
						<Badge variant="outline" className="text-muted-foreground shrink-0">
							{filteredData.length} of {data.length}
						</Badge>
					) : null}
				</div>

				<div className="flex items-center gap-2 flex-wrap">
					<div className="flex items-center gap-2">
						<Label htmlFor="status-filter" className="text-xs text-muted-foreground shrink-0">
							Status
						</Label>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger id="status-filter" className="w-32">
								<SelectValue placeholder="All" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="DRAFT">Draft</SelectItem>
								<SelectItem value="IN_REVIEW">In Review</SelectItem>
								<SelectItem value="APPROVED">Approved</SelectItem>
								<SelectItem value="ARCHIVED">Archived</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{categories.length > 0 ? (
						<div className="flex items-center gap-2">
							<Label htmlFor="category-filter" className="text-xs text-muted-foreground shrink-0">
								Category
							</Label>
							<Select value={categoryFilter} onValueChange={setCategoryFilter}>
								<SelectTrigger id="category-filter" className="w-32">
									<SelectValue placeholder="All" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									{categories.map((cat) => (
										<SelectItem key={cat} value={cat}>
											{cat}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					) : null}

					<div className="flex items-center gap-2">
						<Label htmlFor="public-filter" className="text-xs text-muted-foreground shrink-0">
							Visibility
						</Label>
						<Select value={publicFilter} onValueChange={setPublicFilter}>
							<SelectTrigger id="public-filter" className="w-32">
								<SelectValue placeholder="All" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="public">Public</SelectItem>
								<SelectItem value="internal">Internal</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{onAddAsset ? (
						<Button type="button" size="sm" onClick={onAddAsset}>
							<Plus className="mr-2 h-4 w-4" />
							Create new
						</Button>
					) : null}
				</div>
			</div>

			<div className="mt-6">
				{filteredData.length > 0 ? (
					<CreativeAssetsTable
						data={filteredData}
						onEdit={handleEdit}
						onArchive={handleArchive}
						onUnarchive={onUnarchive}
						archivingAssetId={archivingAssetId}
						unarchivingAssetId={unarchivingAssetId}
					/>
				) : (
					<div className="overflow-hidden rounded-lg border bg-card">
						<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
							<p className="text-lg font-semibold mb-1">No creative assets found</p>
							<p className="text-sm text-muted-foreground">
								{searchQuery || statusFilter !== "all" || categoryFilter !== "all" || publicFilter !== "all"
									? "Try adjusting your filters."
									: "Create your first asset to get started."}
							</p>
						</div>
					</div>
				)}
			</div>
		</>
	);
}

