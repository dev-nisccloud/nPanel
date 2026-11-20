"use client";

import { format } from "date-fns";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

import { errorMessage } from "./format";

export function DeleteBucketDialog({
	open,
	onOpenChange,
	resourceId,
	bucketName,
	isSuperAdmin,
	alreadyScheduled = false,
	onDeleted,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	resourceId: string;
	bucketName: string;
	isSuperAdmin: boolean;
	alreadyScheduled?: boolean;
	onDeleted: () => void;
}) {
	const utils = trpc.useUtils();
	const schedule = trpc.niscStorage.beginDeletion.useMutation();
	const removeNow = trpc.niscStorage.deleteNow.useMutation();
	const pending = schedule.isPending || removeNow.isPending;

	const finishNow = async () => {
		let complete = false;
		for (let attempt = 0; attempt < 20 && !complete; attempt += 1) {
			const result = await removeNow.mutateAsync({ resourceId });
			complete = result.complete;
		}
		if (!complete) throw new Error("Removal is still in progress. Open the bucket and delete it now again.");
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete {bucketName}</AlertDialogTitle>
					<AlertDialogDescription>
						{alreadyScheduled
							? "The 7 day wait is already running. Deleting now removes the bucket and its files, and that cannot be undone."
							: "Scheduling deletion keeps the files for 7 days. You can cancel during that time. A super admin can remove the bucket now, and that cannot be undone."}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="min-h-11" disabled={pending}>
						Cancel
					</AlertDialogCancel>
					{alreadyScheduled ? null : (
					<Button
						variant="outline"
						className="min-h-11"
						disabled={pending}
						onClick={() => {
							schedule.mutate(
								{ resourceId },
								{
									onSuccess: async () => {
										const when = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "d MMM yyyy");
										toast.success(`Deletion started. This bucket will be removed on ${when}.`);
										await utils.niscStorage.list.invalidate();
										await utils.niscStorage.get.invalidate({ resourceId });
										onOpenChange(false);
									},
									onError: (error) => toast.error(errorMessage(error)),
								},
							);
						}}
					>
						{schedule.isPending ? "Scheduling…" : "Delete in 7 days"}
					</Button>
					)}
					{isSuperAdmin ? (
						<Button
							variant="destructive"
							className="min-h-11"
							disabled={pending}
							onClick={() => {
								void finishNow()
									.then(async () => {
										toast.success("Bucket deleted.");
										await utils.niscStorage.list.invalidate();
										await utils.niscStorage.get.invalidate({ resourceId });
										onOpenChange(false);
										onDeleted();
									})
									.catch((error) => toast.error(errorMessage(error)));
							}}
						>
							{removeNow.isPending ? "Deleting…" : "Delete now"}
						</Button>
					) : null}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
