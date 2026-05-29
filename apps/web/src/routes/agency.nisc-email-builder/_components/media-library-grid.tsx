"use client";

import * as React from "react";
import { ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NebSpinner } from "./neb-loading";
import { cn } from "@/lib/utils";

import type { NebMediaLibraryItem } from "../_api/use-neb-media-library-items";

type MediaLibraryGridProps = {
	items: NebMediaLibraryItem[];
	status: "loading" | "empty" | "ready" | "error";
	errorMessage?: string;
	columns?: 3 | 4;
	onRetry?: () => void;
	onUploadClick?: () => void;
	renderItem: (item: NebMediaLibraryItem) => React.ReactNode;
	hasMore?: boolean;
	isFetchingMore?: boolean;
	onLoadMore?: () => void;
};

export function MediaLibraryGrid({
	items,
	status,
	errorMessage,
	columns = 3,
	onRetry,
	onUploadClick,
	renderItem,
	hasMore,
	isFetchingMore,
	onLoadMore,
}: MediaLibraryGridProps) {
	if (status === "loading") {
		return (
			<div className="flex flex-col items-center justify-center gap-2 py-14">
				<NebSpinner context="panel" size={22} className="text-primary" />
				<p className="text-xs text-muted-foreground">Loading your library…</p>
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
				<p className="text-sm text-destructive">
					{errorMessage ?? "Could not load your media library"}
				</p>
				{onRetry ? (
					<Button type="button" size="sm" variant="outline" onClick={onRetry}>
						Try again
					</Button>
				) : null}
			</div>
		);
	}

	if (status === "empty") {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
				<ImageIcon className="size-10 text-muted-foreground/40" />
				<div className="space-y-1">
					<p className="text-sm font-medium">No images yet</p>
					<p className="text-xs text-muted-foreground max-w-xs">
						Upload an image to build your library. You can reuse it in any email.
					</p>
				</div>
				{onUploadClick ? (
					<Button type="button" size="sm" variant="secondary" onClick={onUploadClick}>
						Upload image
					</Button>
				) : null}
			</div>
		);
	}

	return (
		<>
			<div
				className={cn(
					"grid gap-2 pb-2",
					columns === 4 ? "grid-cols-4" : "grid-cols-3",
				)}
			>
				{items.map((item) => renderItem(item))}
			</div>
			{hasMore && onLoadMore ? (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="mt-2 w-full"
					disabled={isFetchingMore}
					onClick={onLoadMore}
				>
					{isFetchingMore ? (
						<NebSpinner context="inline" size={14} />
					) : (
						"Load more"
					)}
				</Button>
			) : null}
		</>
	);
}
