"use client";

import * as React from "react";
import { CreditCard, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
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
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { BillingSettingsForm } from "./billing-settings-form";

interface BillingSettingsTabProps {
	teamId: string;
}

export function BillingSettingsTab({ teamId }: BillingSettingsTabProps) {
	const [isEditMode, setIsEditMode] = React.useState(false);
	const [deleteDialog, setDeleteDialog] = React.useState(false);

	const utils = trpc.useUtils();

	const { data: billingSettings, isLoading } = trpc.teamBilling.getByTeam.useQuery(
		{ teamId },
		{ enabled: Boolean(teamId) }
	);

	const deleteMutation = trpc.teamBilling.delete.useMutation({
		onSuccess: () => {
			toast.success("Billing settings deleted successfully");
			utils.teamBilling.getByTeam.invalidate({ teamId });
			setDeleteDialog(false);
			setIsEditMode(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete billing settings");
		},
	});

	const handleDelete = () => {
		setDeleteDialog(true);
	};

	const confirmDelete = () => {
		deleteMutation.mutate({ teamId });
	};

	const handleFormSuccess = () => {
		utils.teamBilling.getByTeam.invalidate({ teamId });
		setIsEditMode(false);
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="border rounded-lg p-4 space-y-4">
					<div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
					<div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
					<div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
				</div>
			</div>
		);
	}

	if (isEditMode) {
		return (
			<BillingSettingsForm
				teamId={teamId}
				initialData={billingSettings ? {
					legalName: billingSettings.legalName,
					billingEmail: billingSettings.billingEmail,
					billingPhone: billingSettings.billingPhone ?? null,
					addressLine1: billingSettings.addressLine1,
					addressLine2: billingSettings.addressLine2 ?? null,
					city: billingSettings.city,
					state: billingSettings.state ?? null,
					country: billingSettings.country,
					postalCode: billingSettings.postalCode ?? null,
					taxId: billingSettings.taxId ?? null,
					additionalNotes: billingSettings.additionalNotes ?? null,
				} : undefined}
				onSuccess={handleFormSuccess}
				onCancel={() => setIsEditMode(false)}
			/>
		);
	}

	if (!billingSettings) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
				<p className="text-muted-foreground mb-4">No billing settings found</p>
				<Button size="sm" onClick={() => setIsEditMode(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Add Billing Settings
				</Button>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-4 min-w-0">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<h3 className="text-lg font-semibold">Billing Information</h3>
					<div className="flex flex-wrap items-center gap-2">
						<Button size="sm" variant="outline" onClick={() => setIsEditMode(true)}>
							<Edit className="mr-2 h-4 w-4" />
							Edit
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={handleDelete}
							className="text-destructive hover:text-destructive"
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete
						</Button>
					</div>
				</div>

				<div className="border rounded-lg p-4 space-y-4">
					<div className="grid grid-cols-1 gap-4 min-w-0">
						<div className="space-y-2">
							<div className="text-sm text-muted-foreground">Legal Name</div>
							<p className="text-sm font-medium break-words">{billingSettings.legalName}</p>
						</div>

						<div className="space-y-2">
							<div className="text-sm text-muted-foreground">Billing Email</div>
							<p className="text-sm font-medium break-all">{billingSettings.billingEmail}</p>
						</div>

						{billingSettings.billingPhone && (
							<div className="space-y-2">
								<div className="text-sm text-muted-foreground">Billing Phone</div>
								<p className="text-sm font-medium">{billingSettings.billingPhone}</p>
							</div>
						)}

						<div className="space-y-2">
							<div className="text-sm text-muted-foreground">Address Line 1</div>
							<p className="text-sm font-medium break-words">{billingSettings.addressLine1}</p>
						</div>

						{billingSettings.addressLine2 && (
							<div className="space-y-2">
								<div className="text-sm text-muted-foreground">Address Line 2</div>
								<p className="text-sm font-medium break-words">{billingSettings.addressLine2}</p>
							</div>
						)}

						<div className="space-y-2">
							<div className="text-sm text-muted-foreground">City</div>
							<p className="text-sm font-medium">{billingSettings.city}</p>
						</div>

						{billingSettings.state && (
							<div className="space-y-2">
								<div className="text-sm text-muted-foreground">State</div>
								<p className="text-sm font-medium">{billingSettings.state}</p>
							</div>
						)}

						<div className="space-y-2">
							<div className="text-sm text-muted-foreground">Country</div>
							<p className="text-sm font-medium">{billingSettings.country}</p>
						</div>

						{billingSettings.postalCode && (
							<div className="space-y-2">
								<div className="text-sm text-muted-foreground">Postal Code</div>
								<p className="text-sm font-medium">{billingSettings.postalCode}</p>
							</div>
						)}

						{billingSettings.taxId && (
							<div className="space-y-2">
								<div className="text-sm text-muted-foreground">Tax ID</div>
								<p className="text-sm font-medium">{billingSettings.taxId}</p>
							</div>
						)}

						{billingSettings.additionalNotes && (
							<div className="space-y-2 min-w-0">
								<div className="text-sm text-muted-foreground">Additional Notes</div>
								<p className="text-sm font-medium break-words">{billingSettings.additionalNotes}</p>
							</div>
						)}
					</div>

					<div className="pt-4 border-t text-xs text-muted-foreground">
						<div>Created: {new Date(billingSettings.createdAt).toLocaleString()}</div>
						<div>Last Updated: {new Date(billingSettings.updatedAt).toLocaleString()}</div>
					</div>
				</div>
			</div>

			<AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Billing Settings</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete the billing settings for this organization? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							disabled={deleteMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteMutation.isPending ? (
								<>
									<Spinner size={16} className="mr-2" />
									Deleting...
								</>
							) : (
								"Delete"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

