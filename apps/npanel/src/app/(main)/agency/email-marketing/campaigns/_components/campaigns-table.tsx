"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, EllipsisVertical, CheckCircle2, Clock, XCircle, Trash2, RefreshCw } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { toast } from "sonner";

type CampaignSummary = RouterOutputs["emailMarketing"]["campaigns"]["list"]["campaigns"][0];

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
		default:
			return (
				<Badge variant="outline">
					{status}
				</Badge>
			);
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

interface CampaignRowActionsProps {
	campaign: CampaignSummary;
	onRefetch?: () => void;
}

function CampaignRowActions({ campaign, onRefetch }: CampaignRowActionsProps) {
	const router = useRouter();
	const utils = trpc.useUtils();
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
	const [isRefreshing, setIsRefreshing] = React.useState(false);

	const handleRefresh = async () => {
		if (isRefreshing) return;
		setIsRefreshing(true);
		toast.loading("Refreshing…", { id: "campaigns-list-refresh" });
		try {
			await utils.emailMarketing.campaigns.list.invalidate();
			await onRefetch?.();
			toast.success("Campaigns list refreshed", { id: "campaigns-list-refresh" });
		} catch {
			toast.error("Failed to refresh", { id: "campaigns-list-refresh" });
		} finally {
			setIsRefreshing(false);
		}
	};

	const deleteMutation = trpc.emailMarketing.campaigns.delete.useMutation({
		onSuccess: () => {
			toast.success("Campaign deleted successfully", {
				description: `Campaign ${campaign.name} has been deleted.`,
			});
			utils.emailMarketing.campaigns.list.invalidate();
			onRefetch?.();
			setIsDeleting(false);
		},
		onError: (e: { message: string }) => {
			toast.error("Failed to delete campaign", { description: e.message });
			setIsDeleting(false);
		},
	});

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteMutation.mutateAsync({ id: campaign.id });
		} catch (error) {
			// Error handled in mutation
		}
	};

	const busy = isDeleting || isRefreshing;

	return (
		<>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<EllipsisVertical className="h-4 w-4" />
									<span className="sr-only">Actions</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem onClick={() => router.push(`/agency/email-marketing/campaigns/${campaign.id}`)}>
									View Details
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
									<RefreshCw className={`mr-2 h-4 w-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} />
									{isRefreshing ? "Refreshing…" : "Refresh"}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => setShowDeleteDialog(true)}
									disabled={busy}
									className="text-destructive focus:text-destructive"
								>
									{isDeleting ? "Deleting..." : "Delete Campaign"}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</TooltipTrigger>
					<TooltipContent>Actions</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Campaign</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete campaign "{campaign.name}"? This action cannot be undone and will permanently delete the campaign and all associated data.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction 
							onClick={handleDelete} 
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Deleting..." : "Delete Campaign"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export interface CampaignsTableProps {
	campaigns: CampaignSummary[];
	onRefetch?: () => void | Promise<unknown>;
}

export function CampaignsTable({ campaigns, onRefetch }: CampaignsTableProps) {
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Campaign Name</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Recipients</TableHead>
						<TableHead>Created At</TableHead>
						<TableHead className="w-12 pr-6"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{campaigns.map((campaign) => (
						<TableRow key={campaign.id}>
							<TableCell className="pl-6">
								<Link
									href={`/agency/email-marketing/campaigns/${campaign.id}`}
									className="flex items-center gap-2 font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
								>
									<Mail className="h-4 w-4 text-muted-foreground shrink-0" />
									<span>{campaign.name}</span>
								</Link>
							</TableCell>
							<TableCell>
								{getStatusBadge(campaign.status)}
							</TableCell>
							<TableCell>
								{formatNumber(campaign.recipientCount)}
							</TableCell>
							<TableCell>
								{formatDate(campaign.createdAt)}
							</TableCell>
							<TableCell className="pr-6">
								<CampaignRowActions campaign={campaign} onRefetch={onRefetch} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
