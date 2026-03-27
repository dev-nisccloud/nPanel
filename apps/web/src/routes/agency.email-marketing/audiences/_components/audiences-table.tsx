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

type AudienceSummary = RouterOutputs["emailMarketing"]["audiences"]["list"]["audiences"][0];

const formatDate = (value: Date | string | null | undefined) => {
	if (!value) return "—";
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

interface AudienceRowActionsProps {
	audience: AudienceSummary;
	onRefetch?: () => void;
	onView: () => void;
}

function AudienceRowActions({ audience, onRefetch, onView }: AudienceRowActionsProps) {
	const utils = trpc.useUtils();
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

	const deleteMutation = trpc.emailMarketing.audiences.delete.useMutation({
		onSuccess: () => {
			toast.success("Audience deleted", {
				description: `Audience "${audience.name}" has been deleted.`,
			});
			utils.emailMarketing.audiences.list.invalidate();
			onRefetch?.();
			setIsDeleting(false);
			setShowDeleteDialog(false);
		},
		onError: (e) => {
			toast.error("Failed to delete audience", { description: e.message });
			setIsDeleting(false);
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
				<DropdownMenuContent align="end" className="w-40">
					<DropdownMenuItem onClick={onView}>
						<Eye className="mr-2 h-4 w-4" />
						View
					</DropdownMenuItem>
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
		</>
	);
}

export interface AudiencesTableProps {
	audiences: AudienceSummary[];
	onRefetch?: () => void;
}

export function AudiencesTable({ audiences, onRefetch }: AudiencesTableProps) {
	const navigate = useNavigate();

	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Audience</TableHead>
						<TableHead>Contacts</TableHead>
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
											`/agency/email-marketing/audiences/${audience.id}`,
										)
									}
								>
									<Users className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">{audience.name}</span>
								</button>
							</TableCell>
							<TableCell>{audience.contactsCount}</TableCell>
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
												`/agency/email-marketing/audiences/${audience.id}`,
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

