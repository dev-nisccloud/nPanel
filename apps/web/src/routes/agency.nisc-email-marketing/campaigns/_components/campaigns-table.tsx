"use client";

import * as React from "react";
import { Link, useNavigate } from "react-router";
import { Ban, CheckCircle2, Clock, Trash2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

type CampaignSummary = RouterOutputs["niscEmailMarketing"]["campaigns"]["list"]["campaigns"][0];

const ACTION_BTN = "h-7 px-2.5 text-xs";

const getStatusBadge = (status: string) => {
	switch (status) {
		case "COMPLETED":
			return (
				<Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
					<CheckCircle2 className="mr-1 h-3 w-3" />
					Sent
				</Badge>
			);
		case "FAILED":
			return (
				<Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800">
					<XCircle className="mr-1 h-3 w-3" />
					Failed
				</Badge>
			);
		case "SCHEDULED":
			return (
				<Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
					<Clock className="mr-1 h-3 w-3" />
					Scheduled
				</Badge>
			);
		case "DRAFT":
			return (
				<Badge variant="outline" className="bg-muted text-muted-foreground">
					Draft
				</Badge>
			);
		case "CANCELLED":
			return (
				<Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800">
					<Ban className="mr-1 h-3 w-3" />
					Cancelled
				</Badge>
			);
		default:
			return <Badge variant="outline">{status}</Badge>;
	}
};

const formatDate = (value: Date | string | null | undefined) => {
	if (!value) return "—";
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

const formatNumber = (value: number | null | undefined) => {
	if (value === null || value === undefined) return "—";
	return value.toLocaleString();
};

export interface CampaignsTableProps {
	campaigns: CampaignSummary[];
	isLoading?: boolean;
	isError?: boolean;
	error?: Error | null;
	onRetry?: () => void;
	onRefetch?: () => void | Promise<unknown>;
	toolbarActions?: React.ReactNode;
}

export function CampaignsTable({
	campaigns,
	isLoading,
	isError,
	error,
	onRetry,
	onRefetch,
	toolbarActions,
}: CampaignsTableProps) {
	const navigate = useNavigate();
	const { basePath, showAdminFeatures } = useNiscEmailMarketingRoute();
	const utils = trpc.useUtils();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [deleteTarget, setDeleteTarget] = React.useState<CampaignSummary | null>(null);
	const [cancelTarget, setCancelTarget] = React.useState<CampaignSummary | null>(null);
	const [linkTarget, setLinkTarget] = React.useState<CampaignSummary | null>(null);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [isCancelling, setIsCancelling] = React.useState(false);

	const deleteMutation = trpc.niscEmailMarketing.campaigns.delete.useMutation({
		onSuccess: (_data, variables) => {
			const name = campaigns.find((campaign) => campaign.id === variables.id)?.name;
			toast.success("Campaign deleted successfully", {
				description: name ? `Campaign ${name} has been deleted.` : undefined,
			});
			utils.niscEmailMarketing.campaigns.list.invalidate();
			onRefetch?.();
			setIsDeleting(false);
			setDeleteTarget(null);
		},
		onError: (e: { message: string }) => {
			toast.error("Failed to delete campaign", { description: e.message });
			setIsDeleting(false);
		},
	});

	const cancelMutation = trpc.niscEmailMarketing.campaigns.cancel.useMutation({
		onSuccess: (data) => {
			toast.success("Scheduled campaign cancelled", {
				description: data?.cancelledAt ? `Cancelled at ${data.cancelledAt}.` : undefined,
			});
			utils.niscEmailMarketing.campaigns.list.invalidate();
			onRefetch?.();
			setIsCancelling(false);
			setCancelTarget(null);
		},
		onError: (e: { message: string }) => {
			toast.error("Failed to cancel campaign", { description: e.message });
			setIsCancelling(false);
		},
	});

	const linkMutation = trpc.niscEmailMarketing.campaigns.linkOrganization.useMutation({
		onSuccess: () => {
			toast.success("Organization linked", {
				description: linkTarget
					? `"${linkTarget.name}" is now linked to the selected organization.`
					: undefined,
			});
			utils.niscEmailMarketing.campaigns.list.invalidate();
			onRefetch?.();
			setLinkTarget(null);
		},
		onError: (e: { message: string }) => {
			toast.error("Failed to link organization", { description: e.message });
		},
	});

	const filteredCampaigns = React.useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return campaigns;
		return campaigns.filter((campaign) => {
			const organization = campaign.teamId ? "linked" : "not linked";
			return (
				campaign.name?.toLowerCase().includes(query) ||
				campaign.subject?.toLowerCase().includes(query) ||
				campaign.status?.toLowerCase().includes(query) ||
				organization.includes(query)
			);
		});
	}, [campaigns, searchQuery]);

	const requestCancel = async (campaign: CampaignSummary) => {
		try {
			const fresh = await utils.niscEmailMarketing.campaigns.getById.fetch({ id: campaign.id });
			if (fresh.status !== "SCHEDULED") {
				toast.error("Campaign is no longer scheduled", {
					description:
						fresh.status === "COMPLETED"
							? "It has already been sent."
							: fresh.status === "CANCELLED"
								? "It has already been cancelled."
								: "You cannot cancel this campaign.",
				});
				utils.niscEmailMarketing.campaigns.list.invalidate();
				onRefetch?.();
				return;
			}
			setCancelTarget(campaign);
		} catch {
			toast.error("Could not load campaign status. Please try again.");
		}
	};

	const items: SearchableCleanListItem[] = filteredCampaigns.map((campaign) => ({
		key: campaign.id,
		title: (
			<Link
				to={`${basePath}/campaigns/${campaign.id}`}
				className="text-foreground hover:underline"
				onClick={(event) => event.stopPropagation()}
			>
				{campaign.name}
			</Link>
		),
		description: campaign.subject || undefined,
		cells: {
			status: getStatusBadge(campaign.status),
			recipients: <CleanListCell>{formatNumber(campaign.recipientCount)}</CleanListCell>,
			organization: (
				<CleanListCell>{campaign.teamId ? "Linked" : "Not linked"}</CleanListCell>
			),
			created: <CleanListCell>{formatDate(campaign.createdAt)}</CleanListCell>,
		},
		actions: (
			<>
				<ViewDetailsButton
					onClick={() => navigate(`${basePath}/campaigns/${campaign.id}`)}
				/>
				{campaign.status === "SCHEDULED" ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className={ACTION_BTN}
						disabled={isCancelling}
						onClick={() => void requestCancel(campaign)}
					>
						<Ban className="mr-1 h-3.5 w-3.5" />
						Cancel
					</Button>
				) : null}
				{showAdminFeatures ? (
					<NiscEmLinkOrganizationButton
						alreadyLinked={Boolean(campaign.teamId)}
						disabled={linkMutation.isPending}
						className={ACTION_BTN}
						onClick={() => setLinkTarget(campaign)}
					/>
				) : null}
				<Button
					type="button"
					variant="outline"
					size="sm"
					className={`${ACTION_BTN} text-destructive hover:text-destructive`}
					disabled={isDeleting}
					onClick={() => setDeleteTarget(campaign)}
				>
					<Trash2 className="mr-1 h-3.5 w-3.5" />
					Delete
				</Button>
			</>
		),
		onClick: () => navigate(`${basePath}/campaigns/${campaign.id}`),
	}));

	const columns = [
		{ key: "name", label: "Campaign" },
		{ key: "status", label: "Status", className: "w-40", hideBelow: "@md" as const },
		{ key: "recipients", label: "Recipients", className: "w-28", hideBelow: "@lg" as const },
		...(showAdminFeatures
			? [{ key: "organization", label: "Organization", className: "w-36", hideBelow: "@xl" as const }]
			: []),
		{ key: "created", label: "Created", className: "w-32", hideBelow: "@2xl" as const },
		{ key: "actions", label: "Actions", align: "end" as const },
	];

	return (
		<>
			<SearchableCleanList
				items={items}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				totalCount={campaigns.length}
				toolbarActions={toolbarActions}
				isLoading={isLoading}
				isError={isError}
				error={error}
				onRetry={onRetry}
				searchPlaceholder="Search campaigns..."
				errorTitle="Unable to load campaigns"
				emptyMessage={
					searchQuery.trim()
						? "No campaigns match your search."
						: "No campaigns yet. Create one to start sending."
				}
				columns={columns}
			/>

			<AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !isDeleting && !open && setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Campaign</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete campaign "{deleteTarget?.name}"? This action cannot be undone and will permanently delete the campaign and all associated data.
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
							{isDeleting ? "Deleting..." : "Delete Campaign"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={Boolean(cancelTarget)} onOpenChange={(open) => !isCancelling && !open && setCancelTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel scheduled campaign</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel the scheduled send for "{cancelTarget?.name}"? The campaign will not be sent at the scheduled time. You can schedule it again later from the campaign details.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isCancelling}>Keep scheduled</AlertDialogCancel>
						<AlertDialogAction
							disabled={isCancelling || !cancelTarget}
							onClick={() => {
								if (!cancelTarget) return;
								setIsCancelling(true);
								cancelMutation.mutate({ id: cancelTarget.id });
							}}
						>
							{isCancelling ? "Cancelling…" : "Cancel scheduled send"}
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
