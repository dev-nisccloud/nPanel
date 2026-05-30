"use client";

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
import { Spinner } from "@/components/ui/shadcn-io/spinner";

interface SubscriptionDeleteDialogProps {
	open: boolean;
	subscriptionName: string;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function SubscriptionDeleteDialog({
	open,
	subscriptionName,
	isPending,
	onOpenChange,
	onConfirm,
}: SubscriptionDeleteDialogProps) {
	const name = subscriptionName || "this subscription";

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete subscription permanently?</AlertDialogTitle>
					<AlertDialogDescription>
						This will permanently remove{" "}
						<span className="font-medium text-foreground">{name}</span> from nPanel,
						including usage records and activity history. Linked orders will keep their
						history but lose the subscription link. This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
							onConfirm();
						}}
						disabled={isPending}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isPending ? (
							<>
								<Spinner size={16} className="mr-2" />
								Deleting…
							</>
						) : (
							"Delete permanently"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
