"use client";

import * as React from "react";
import { File, Folder, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export type DeleteFileItem = {
	name: string;
	path: string;
	type: "file" | "folder";
};

interface DeleteFileDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: DeleteFileItem | null;
	additionalItems?: DeleteFileItem[];
	onConfirm: () => Promise<void>;
	isDeleting: boolean;
}

export function DeleteFileDialog({
	open,
	onOpenChange,
	item,
	additionalItems,
	onConfirm,
	isDeleting,
}: DeleteFileDialogProps) {
	const incoming = React.useMemo(() => {
		if (!item) return [];
		return [item, ...(additionalItems ?? [])];
	}, [item, additionalItems]);
	const [shown, setShown] = React.useState<DeleteFileItem[]>(incoming);

	React.useEffect(() => {
		if (open && incoming.length > 0) setShown(incoming);
	}, [open, incoming]);

	const items = shown;
	const isBulk = items.length > 1;
	const primary = items[0];
	const isDirectory = !isBulk && primary?.type === "folder";
	const includesDirectory = items.some((entry) => entry.type === "folder");

	const title = isBulk ? "Delete items" : isDirectory ? "Delete directory" : "Delete file";
	const description = isBulk
		? `Remove ${items.length} selected items from this directory.`
		: isDirectory
			? "Remove this folder from the current directory."
			: "Remove this file from the current directory.";

	const handleOpenChange = (next: boolean) => {
		if (!next && isDeleting) return;
		onOpenChange(next);
	};

	const blockDismiss = (event: Event) => {
		if (isDeleting) event.preventDefault();
	};

	const handleConfirm = async () => {
		try {
			await onConfirm();
			onOpenChange(false);
		} catch {
			// The file manager already reports the error.
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className="gap-5 border bg-[#FAFAF9] sm:max-w-md dark:bg-[#121212]"
				showCloseButton={!isDeleting}
				onPointerDownOutside={blockDismiss}
				onInteractOutside={blockDismiss}
				onEscapeKeyDown={blockDismiss}
			>
				<DialogHeader>
					<DialogTitle className="text-base font-semibold tracking-tight">{title}</DialogTitle>
					<DialogDescription className="text-xs">{description}</DialogDescription>
				</DialogHeader>

				{items.length > 0 ? (
					<div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/40 px-3 py-2">
						{items.map((entry) => {
							const directory = entry.type === "folder";
							const Icon = directory ? Folder : File;
							return (
								<div key={entry.path} className="flex min-w-0 items-center gap-3 py-1">
									<Icon className="size-4 shrink-0 text-muted-foreground" />
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-foreground" title={entry.name}>
											{entry.name}
										</p>
										<p className="truncate text-xs text-muted-foreground" title={entry.path}>
											{entry.path}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				) : null}

				{includesDirectory ? (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
						{isDirectory
							? "This also deletes every file and subfolder inside it. This cannot be undone."
							: "Folders are removed with every file and subfolder inside them. This cannot be undone."}
					</div>
				) : items.length > 0 ? (
					<p className="text-xs text-muted-foreground">This cannot be undone.</p>
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={() => void handleConfirm()}
						disabled={isDeleting || items.length === 0}
					>
						{isDeleting ? (
							<>
								<Spinner size={16} className="mr-2" />
								Deleting...
							</>
						) : (
							<>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
