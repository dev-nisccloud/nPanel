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
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";

export type ZeepoDeleteChatTarget = {
	id: string;
	title?: string | null;
};

type ZeepoDeleteChatDialogProps = {
	target: ZeepoDeleteChatTarget | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (id: string) => void | Promise<void>;
	isPending?: boolean;
};

export function ZeepoDeleteChatDialog({
	target,
	open,
	onOpenChange,
	onConfirm,
	isPending,
}: ZeepoDeleteChatDialogProps) {
	const title = target?.title?.trim() || "this chat";

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				if (isPending) return;
				onOpenChange(next);
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete chat?</AlertDialogTitle>
					<AlertDialogDescription>
						This permanently deletes{" "}
						<span className="font-medium text-foreground">
							{title === "this chat" ? title : `"${title}"`}
						</span>
						, including all messages and any uploaded or generated media. This cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={!target || isPending}
						className={cn(buttonVariants({ variant: "destructive" }))}
						onClick={(e) => {
							e.preventDefault();
							if (!target) return;
							void onConfirm(target.id);
						}}
					>
						{isPending ? (
							<span className="inline-flex items-center gap-2">
								<Spinner size={14} className="text-current" />
								Deleting…
							</span>
						) : (
							"Delete chat"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
