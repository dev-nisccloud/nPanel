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

export type SubscriptionStatusConfirmAction = "suspend" | "reactivate";

interface SubscriptionStatusConfirmDialogProps {
	open: boolean;
	action: SubscriptionStatusConfirmAction | null;
	subscriptionName: string;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function SubscriptionStatusConfirmDialog({
	open,
	action,
	subscriptionName,
	isPending,
	onOpenChange,
	onConfirm,
}: SubscriptionStatusConfirmDialogProps) {
	const isSuspend = action === "suspend";
	const name = subscriptionName || "this subscription";

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isSuspend ? "Suspend this subscription?" : "Reactivate this subscription?"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isSuspend ? (
							<>
								This will mark <span className="font-medium text-foreground">{name}</span> as
								suspended in nPanel. Billing and renewal workflows may be affected until you
								reactivate it. This does not change any linked hosting services.
							</>
						) : (
							<>
								This will mark <span className="font-medium text-foreground">{name}</span> as
								active again in nPanel.
							</>
						)}
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
						className={isSuspend ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
					>
						{isPending ? (
							<>
								<Spinner size={16} className="mr-2" />
								{isSuspend ? "Suspending…" : "Reactivating…"}
							</>
						) : isSuspend ? (
							"Suspend"
						) : (
							"Reactivate"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
