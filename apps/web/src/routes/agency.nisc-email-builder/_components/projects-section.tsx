"use client";

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { CopyIcon, Trash } from "lucide-react";

import { useGetNebDesigns } from "../_api/use-get-neb-designs";
import { useDeleteNebDesign } from "../_api/use-delete-neb-design";
import { useDuplicateNebDesign } from "../_api/use-duplicate-neb-design";
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";
import {
	NiscEmLinkOrganizationButton,
	NiscEmLinkOrganizationDialog,
} from "@/components/nisc-email-marketing/nisc-em-link-organization";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { CleanListCell } from "@/components/ui/clean-list";
import {
	SearchableCleanList,
	type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import { ViewDetailsButton } from "@/components/ui/list-row-actions";
import { useConfirm } from "@/hooks/use-confirm";
import { NebSpinner } from "./neb-loading";

const ACTION_BTN = "h-7 px-2.5 text-xs";

export const ProjectsSection = ({ toolbarActions }: { toolbarActions?: React.ReactNode }) => {
	const [ConfirmDialog, confirm] = useConfirm(
		"Are you sure?",
		"You are about to delete this email design.",
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [navigatingDesignId, setNavigatingDesignId] = useState<string | null>(null);
	const [duplicatingDesignId, setDuplicatingDesignId] = useState<string | null>(null);
	const [deletingDesignId, setDeletingDesignId] = useState<string | null>(null);
	const [linkDesign, setLinkDesign] = useState<{
		id: string;
		name: string;
		teamId: string | null;
	} | null>(null);
	const duplicateMutation = useDuplicateNebDesign();
	const removeMutation = useDeleteNebDesign();
	const navigate = useNavigate();
	const route = useNiscEmailMarketingRoute();
	const utils = trpc.useUtils();

	const linkMutation = trpc.niscEmailBuilder.design.linkOrganization.useMutation({
		onSuccess: async () => {
			toast.success("Organization linked");
			setLinkDesign(null);
			await utils.niscEmailBuilder.design.list.invalidate();
		},
		onError: (e) => {
			toast.error(e.message || "Failed to link organization");
		},
	});

	const teamId = route.isCustomer ? route.teamId ?? undefined : undefined;

	const isDeleteInProgress = deletingDesignId !== null || removeMutation.isPending;

	const { data, status, error, fetchNextPage, isFetchingNextPage, hasNextPage, refetch } =
		useGetNebDesigns({ teamId });

	const designs = useMemo(
		() => data?.pages.flatMap((page) => page.data ?? []) ?? [],
		[data],
	);

	const filteredDesigns = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return designs;
		return designs.filter((design) => {
			const visibility = design.isPublic ? "public" : "private";
			return (
				design.name.toLowerCase().includes(query) ||
				design.description?.toLowerCase().includes(query) ||
				visibility.includes(query)
			);
		});
	}, [designs, searchQuery]);

	const handleDesignClick = (designId: string) => {
		if (isDeleteInProgress || duplicatingDesignId || navigatingDesignId) return;
		setNavigatingDesignId(designId);
		navigate(`${route.emailBuilderBasePath}/${designId}`);
	};

	const onCopy = (designId: string) => {
		if (isDeleteInProgress) return;
		setDuplicatingDesignId(designId);
		duplicateMutation.mutate(
			{ designId },
			{
				onSettled: () => setDuplicatingDesignId(null),
			},
		);
	};

	const onDelete = async (designId: string) => {
		const ok = await confirm();
		if (!ok) return;
		setDeletingDesignId(designId);
		removeMutation.mutate(
			{ designId },
			{
				onSettled: () => setDeletingDesignId(null),
			},
		);
	};

	const items: SearchableCleanListItem[] = filteredDesigns.map((design) => {
		const isDeleting =
			deletingDesignId === design.id ||
			(removeMutation.isPending && removeMutation.variables?.designId === design.id);
		const isDuplicating = duplicatingDesignId === design.id;
		const isNavigating = navigatingDesignId === design.id;
		const isRowBusy = isDeleting || isDuplicating || isNavigating;
		const canOpen =
			!isDeleteInProgress && !duplicatingDesignId && !navigatingDesignId && !isRowBusy;

		return {
			key: design.id,
			title: design.name,
			description: design.description || undefined,
			cells: {
				visibility: (
					<span
						className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
							design.isPublic
								? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
								: "bg-muted text-muted-foreground ring-1 ring-inset ring-border"
						}`}
					>
						{design.isPublic ? "Public" : "Private"}
					</span>
				),
				updated: (
					<CleanListCell>
						{formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true })}
					</CleanListCell>
				),
			},
			actions: isRowBusy ? (
				<NebSpinner context="inline" size={16} />
			) : (
				<>
					<ViewDetailsButton
						label="Edit"
						onClick={() => canOpen && handleDesignClick(design.id)}
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className={ACTION_BTN}
						disabled={duplicateMutation.isPending || isDeleteInProgress}
						onClick={() => onCopy(design.id)}
					>
						<CopyIcon className="mr-1 h-3.5 w-3.5" />
						Copy
					</Button>
					{route.showAdminFeatures ? (
						<NiscEmLinkOrganizationButton
							alreadyLinked={Boolean(design.teamId)}
							disabled={isDeleteInProgress}
							className={ACTION_BTN}
							onClick={() =>
								setLinkDesign({
									id: design.id,
									name: design.name,
									teamId: design.teamId ?? null,
								})
							}
						/>
					) : null}
					<Button
						type="button"
						variant="outline"
						size="sm"
						className={`${ACTION_BTN} text-destructive hover:text-destructive`}
						disabled={isDeleteInProgress}
						onClick={() => void onDelete(design.id)}
					>
						<Trash className="mr-1 h-3.5 w-3.5" />
						Delete
					</Button>
				</>
			),
			onClick: canOpen ? () => handleDesignClick(design.id) : undefined,
		};
	});

	return (
		<div className="space-y-4">
			<ConfirmDialog />
			{route.showAdminFeatures ? (
				<NiscEmLinkOrganizationDialog
					open={Boolean(linkDesign)}
					onOpenChange={(open) => {
						if (!open) setLinkDesign(null);
					}}
					alreadyLinked={Boolean(linkDesign?.teamId)}
					isPending={linkMutation.isPending}
					resourceLabel={linkDesign?.name ?? "this email design"}
					onConfirm={async (nextTeamId) => {
						if (!linkDesign) return;
						await linkMutation.mutateAsync({ designId: linkDesign.id, teamId: nextTeamId });
					}}
				/>
			) : null}

			<SearchableCleanList
				items={items}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				totalCount={designs.length}
				toolbarActions={toolbarActions}
				isLoading={status === "pending"}
				isError={status === "error"}
				error={error instanceof Error ? error : null}
				onRetry={() => void refetch()}
				searchPlaceholder="Search designs..."
				errorTitle="Failed to load designs"
				emptyMessage={
					searchQuery.trim()
						? "No designs match your search."
						: "No designs yet. Create one to get started."
				}
				columns={[
					{ key: "name", label: "Design" },
					{ key: "visibility", label: "Visibility", className: "w-28", hideBelow: "@md" },
					{ key: "updated", label: "Updated", className: "w-40", hideBelow: "@lg" },
					{ key: "actions", label: "Actions", align: "end" },
				]}
			/>

			{hasNextPage ? (
				<div className="flex w-full items-center justify-center pt-2">
					<Button variant="ghost" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
						{isFetchingNextPage ? "Loading…" : "Load more"}
					</Button>
				</div>
			) : null}
		</div>
	);
};
