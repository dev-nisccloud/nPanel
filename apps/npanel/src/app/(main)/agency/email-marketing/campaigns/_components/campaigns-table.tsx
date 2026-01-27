"use client";

import * as React from "react";
import { Mail, EllipsisVertical, CheckCircle2, Clock, XCircle, Send, Pause, Trash2 } from "lucide-react";
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
		case "SENT":
			return (
				<Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
					<CheckCircle2 className="mr-1 h-3 w-3" />
					Sent
				</Badge>
			);
		case "SENDING":
			return (
				<Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800">
					<Send className="mr-1 h-3 w-3" />
					Sending
				</Badge>
			);
		case "SCHEDULED":
			return (
				<Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
					<Clock className="mr-1 h-3 w-3" />
					Scheduled
				</Badge>
			);
		case "PAUSED":
			return (
				<Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800">
					<Pause className="mr-1 h-3 w-3" />
					Paused
				</Badge>
			);
		// Removed FAILED status display - campaigns are only marked as FAILED if ALL emails failed
		// If some emails were sent, status is SENT
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
	const utils = trpc.useUtils();
	const [isPausing, setIsPausing] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [showPauseDialog, setShowPauseDialog] = React.useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

	const pauseMutation = trpc.emailMarketing.campaigns.pause.useMutation({
		onSuccess: () => {
			toast.success("Campaign paused successfully", {
				description: `Campaign ${campaign.name} has been paused.`,
			});
			utils.emailMarketing.campaigns.list.invalidate();
			onRefetch?.();
			setIsPausing(false);
		},
		onError: (e) => {
			toast.error("Failed to pause campaign", { description: e.message });
			setIsPausing(false);
		},
	});

	const deleteMutation = trpc.emailMarketing.campaigns.delete.useMutation({
		onSuccess: () => {
			toast.success("Campaign deleted successfully", {
				description: `Campaign ${campaign.name} has been deleted.`,
			});
			utils.emailMarketing.campaigns.list.invalidate();
			onRefetch?.();
			setIsDeleting(false);
		},
		onError: (e) => {
			toast.error("Failed to delete campaign", { description: e.message });
			setIsDeleting(false);
		},
	});

	const handlePause = async () => {
		setIsPausing(true);
		try {
			await pauseMutation.mutateAsync({ id: campaign.id });
		} catch (error) {
			// Error handled in mutation
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteMutation.mutateAsync({ id: campaign.id });
		} catch (error) {
			// Error handled in mutation
		}
	};

	const busy = isPausing || isDeleting;

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
								{campaign.status === "SCHEDULED" && (
									<>
										<DropdownMenuItem
											onClick={() => setShowPauseDialog(true)}
											disabled={busy}
										>
											{busy ? "Pausing..." : "Pause Campaign"}
										</DropdownMenuItem>
										<DropdownMenuSeparator />
									</>
								)}
								<DropdownMenuItem disabled>
									View Details
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

			{/* Pause Confirmation Dialog */}
			<AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Pause Campaign</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to pause campaign "{campaign.name}"? You can resume it later.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPausing}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handlePause} disabled={isPausing}>
							{isPausing ? "Pausing..." : "Pause Campaign"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

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
	onRefetch?: () => void;
}

export function CampaignsTable({ campaigns, onRefetch }: CampaignsTableProps) {
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Campaign Name</TableHead>
						<TableHead>Subject</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Recipients</TableHead>
						<TableHead>Sent</TableHead>
						<TableHead>Created At</TableHead>
						<TableHead className="w-12 pr-6"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{campaigns.map((campaign) => (
						<TableRow key={campaign.id}>
							<TableCell className="pl-6">
								<div className="flex items-center gap-2">
									<Mail className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">{campaign.name}</span>
								</div>
							</TableCell>
							<TableCell>
								<span className="text-sm">{campaign.subject}</span>
							</TableCell>
							<TableCell>
								{getStatusBadge(campaign.status)}
							</TableCell>
							<TableCell>
								{formatNumber(campaign.totalRecipients)}
							</TableCell>
							<TableCell>
								{formatNumber(campaign.sentCount)} / {formatNumber(campaign.totalRecipients)}
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
