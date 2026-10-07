"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CleanListCell } from "@/components/ui/clean-list";
import {
	SearchableCleanList,
	type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import { ViewDetailsButton } from "@/components/ui/list-row-actions";
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
import { trpc, type RouterOutputs } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";
import {
	NiscEmLinkOrganizationButton,
	NiscEmLinkOrganizationDialog,
} from "@/components/nisc-email-marketing/nisc-em-link-organization";

type AudienceSummary = RouterOutputs["niscEmailMarketing"]["audiences"]["list"]["audiences"][0];

const ACTION_BTN = "h-7 px-2.5 text-xs";

const formatDate = (value: Date | string | null | undefined) => {
	if (!value) return "—";
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

export interface AudiencesTableProps {
	audiences: AudienceSummary[];
	isLoading?: boolean;
	isError?: boolean;
	error?: Error | null;
	onRetry?: () => void;
	onRefetch?: () => void;
	toolbarActions?: React.ReactNode;
}

export function AudiencesTable({
	audiences,
	isLoading,
	isError,
	error,
	onRetry,
	onRefetch,
	toolbarActions,
}: AudiencesTableProps) {
	const navigate = useNavigate();
	const { basePath, showAdminFeatures } = useNiscEmailMarketingRoute();
	const utils = trpc.useUtils();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [deleteTarget, setDeleteTarget] = React.useState<AudienceSummary | null>(null);
	const [linkTarget, setLinkTarget] = React.useState<AudienceSummary | null>(null);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const deleteMutation = trpc.niscEmailMarketing.audiences.delete.useMutation({
		onSuccess: () => {
			toast.success("Audience deleted", {
				description: deleteTarget ? `Audience "${deleteTarget.name}" has been deleted.` : undefined,
			});
			utils.niscEmailMarketing.audiences.list.invalidate();
			onRefetch?.();
			setIsDeleting(false);
			setDeleteTarget(null);
		},
		onError: (e) => {
			toast.error("Failed to delete audience", { description: e.message });
			setIsDeleting(false);
		},
	});

	const linkMutation = trpc.niscEmailMarketing.audiences.linkOrganization.useMutation({
		onSuccess: () => {
			toast.success("Organization linked", {
				description: linkTarget
					? `"${linkTarget.name}" is now linked to the selected organization.`
					: undefined,
			});
			utils.niscEmailMarketing.audiences.list.invalidate();
			onRefetch?.();
			setLinkTarget(null);
		},
		onError: (e) => {
			toast.error("Failed to link organization", { description: e.message });
		},
	});

	const filteredAudiences = React.useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return audiences;
		return audiences.filter((audience) => {
			const organization = audience.teamId ? "linked" : "not linked";
			return audience.name?.toLowerCase().includes(query) || organization.includes(query);
		});
	}, [audiences, searchQuery]);

	const items: SearchableCleanListItem[] = filteredAudiences.map((audience) => {
		const href = `${basePath}/audiences/${audience.id}`;
		return {
			key: audience.id,
			title: audience.name,
			cells: {
				contacts: <CleanListCell>{audience.contactsCount.toLocaleString()}</CleanListCell>,
				organization: (
					<CleanListCell>{audience.teamId ? "Linked" : "Not linked"}</CleanListCell>
				),
				created: <CleanListCell>{formatDate(audience.createdAt)}</CleanListCell>,
			},
			actions: (
				<>
					<ViewDetailsButton onClick={() => navigate(href)} />
					{showAdminFeatures ? (
						<NiscEmLinkOrganizationButton
							alreadyLinked={Boolean(audience.teamId)}
							disabled={linkMutation.isPending}
							className={ACTION_BTN}
							onClick={() => setLinkTarget(audience)}
						/>
					) : null}
					<Button
						type="button"
						variant="outline"
						size="sm"
						className={`${ACTION_BTN} text-destructive hover:text-destructive`}
						disabled={isDeleting}
						onClick={() => setDeleteTarget(audience)}
					>
						<Trash2 className="mr-1 h-3.5 w-3.5" />
						Delete
					</Button>
				</>
			),
			onClick: () => navigate(href),
		};
	});

	const columns = [
		{ key: "name", label: "Audience" },
		{ key: "contacts", label: "Contacts", className: "w-28", hideBelow: "@md" as const },
		...(showAdminFeatures
			? [{ key: "organization", label: "Organization", className: "w-36", hideBelow: "@lg" as const }]
			: []),
		{ key: "created", label: "Created", className: "w-32", hideBelow: "@xl" as const },
		{ key: "actions", label: "Actions", align: "end" as const },
	];

	return (
		<>
			<SearchableCleanList
				items={items}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				totalCount={audiences.length}
				toolbarActions={toolbarActions}
				isLoading={isLoading}
				isError={isError}
				error={error}
				onRetry={onRetry}
				searchPlaceholder="Search audiences..."
				errorTitle="Unable to load audiences"
				emptyMessage={
					searchQuery.trim()
						? "No audiences match your search."
						: "No audiences yet. Create one to start grouping contacts."
				}
				columns={columns}
			/>

			<AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !isDeleting && !open && setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete audience</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete audience "{deleteTarget?.name}"? This will remove all contacts in this audience. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={isDeleting || !deleteTarget}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => {
								if (!deleteTarget) return;
								setIsDeleting(true);
								deleteMutation.mutate({ id: deleteTarget.id });
							}}
						>
							{isDeleting ? "Deleting..." : "Delete audience"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{showAdminFeatures ? (
				<NiscEmLinkOrganizationDialog
					open={Boolean(linkTarget)}
					onOpenChange={(open) => {
						if (!linkMutation.isPending && !open) setLinkTarget(null);
					}}
					alreadyLinked={Boolean(linkTarget?.teamId)}
					isPending={linkMutation.isPending}
					resourceLabel={linkTarget?.name}
					onConfirm={async (teamId) => {
						if (!linkTarget) return;
						await linkMutation.mutateAsync({ id: linkTarget.id, teamId });
					}}
				/>
			) : null}
		</>
	);
}
