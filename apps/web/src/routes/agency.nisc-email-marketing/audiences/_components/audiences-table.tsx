"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { Users, EllipsisVertical, Trash2, Eye } from "lucide-react";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
import { trpc, type RouterOutputs } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";
import {
	NiscEmLinkOrganizationDialog,
	NiscEmLinkOrganizationMenuItem,
} from "@/components/nisc-email-marketing/nisc-em-link-organization";

type AudienceSummary = RouterOutputs["niscEmailMarketing"]["audiences"]["list"]["audiences"][0];

const formatDate = (value: Date | string | null | undefined) => {
	if (!value) return "- ";
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? "- " : d.toLocaleDateString();
};

interface AudienceRowActionsProps {
	audience: AudienceSummary;
	onRefetch?: () => void;
	onView: () => void;
}

function AudienceRowActions({ audience, onRefetch, onView }: AudienceRowActionsProps) {
	const utils = trpc.useUtils();
	const { showAdminFeatures } = useNiscEmailMarketingRoute();
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
	const [linkOpen, setLinkOpen] = React.useState(false);
	const alreadyLinked = Boolean(audience.teamId);

	const deleteMutation = trpc.niscEmailMarketing.audiences.delete.useMutation({
		onSuccess: () => {
			toast.success("Audience deleted", {
				description: `Audience "${audience.name}" has been deleted.`,
			});
			utils.niscEmailMarketing.audiences.list.invalidate();
			onRefetch?.();
			setIsDeleting(false);
			setShowDeleteDialog(false);
		},
		onError: (e) => {
			toast.error("Failed to delete audience", { description: e.message });
			setIsDeleting(false);
		},
	});

	const linkMutation = trpc.niscEmailMarketing.audiences.linkOrganization.useMutation({
		onSuccess: () => {
			toast.success("Organization linked", {
				description: `"${audience.name}" is now linked to the selected organization.`,
			});
			utils.niscEmailMarketing.audiences.list.invalidate();
			onRefetch?.();
			setLinkOpen(false);
		},
		onError: (e) => {
			toast.error("Failed to link organization", { description: e.message });
		},
	});

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteMutation.mutateAsync({ id: audience.id });
		} catch {
			// handled in mutation
		}
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="h-8 w-8">
						<EllipsisVertical className="h-4 w-4" />
						<span className="sr-only">Actions</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuItem onClick={onView}>
						<Eye className="mr-2 h-4 w-4" />
						View
					</DropdownMenuItem>
					{showAdminFeatures ? (
						<NiscEmLinkOrganizationMenuItem
							alreadyLinked={alreadyLinked}
							disabled={isDeleting || linkMutation.isPending}
							onSelect={() => setLinkOpen(true)}
						/>
					) : null}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => setShowDeleteDialog(true)}
						disabled={isDeleting}
						className="text-destructive focus:text-destructive"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						{isDeleting ? "Deleting..." : "Delete"}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete audience</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete audience "{audience.name}"? This will remove all contacts in
							this audience. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Deleting..." : "Delete audience"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{showAdminFeatures ? (
				<NiscEmLinkOrganizationDialog
					open={linkOpen}
					onOpenChange={setLinkOpen}
					alreadyLinked={alreadyLinked}
					isPending={linkMutation.isPending}
					resourceLabel={audience.name}
					onConfirm={async (teamId) => {
						await linkMutation.mutateAsync({ id: audience.id, teamId });
					}}
				/>
			) : null}
		</>
	);
}

export interface AudiencesTableProps {
	audiences: AudienceSummary[];
	onRefetch?: () => void;
}

export function AudiencesTable({ audiences, onRefetch }: AudiencesTableProps) {
	const navigate = useNavigate();
	const { basePath, showAdminFeatures } = useNiscEmailMarketingRoute();

	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Audience</TableHead>
						<TableHead>Contacts</TableHead>
						{showAdminFeatures ? <TableHead>Organization</TableHead> : null}
						<TableHead>Created</TableHead>
						<TableHead className="w-12 pr-6" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{audiences.map((audience) => (
						<TableRow key={audience.id}>
							<TableCell className="pl-6">
								<button
									type="button"
									className="flex items-center gap-2 text-left hover:text-primary focus:outline-none cursor-pointer"
									onClick={() =>
										navigate(
											`${basePath}/audiences/${audience.id}`,
										)
									}
								>
									<Users className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">{audience.name}</span>
								</button>
							</TableCell>
							<TableCell>{audience.contactsCount}</TableCell>
							{showAdminFeatures ? (
								<TableCell className="text-sm text-muted-foreground">
									{audience.teamId ? "Linked" : "Not linked"}
								</TableCell>
							) : null}
							<TableCell>{formatDate(audience.createdAt)}</TableCell>
							<TableCell className="pr-6">
								<div
									onClick={(event) => {
										// prevent triggering row click
										event.stopPropagation();
									}}
								>
									<AudienceRowActions
										audience={audience}
										onRefetch={onRefetch}
										onView={() =>
											navigate(
												`${basePath}/audiences/${audience.id}`,
											)
										}
									/>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

