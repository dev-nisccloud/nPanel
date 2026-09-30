"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { nativePrimaryScrollbarClassName } from "@/components/ui/scroll-area";

type BuyNowDialogBodyScrollProps = {
	children: React.ReactNode;
	className?: string;
	innerClassName?: string;
	scrollRef?: React.Ref<HTMLDivElement>;
	/** Same element scrolls horizontally, so wide plan tables don't get a second scroller. */
	allowHorizontal?: boolean;
};

/**
 * Single scroll container for buy-now dialog bodies.
 * Uses native overflow (not nested Radix ScrollArea) so accordion expand/collapse
 * reliably updates scroll height - e.g. manual payment fields stay reachable.
 */
export function BuyNowDialogBodyScroll({
	children,
	className,
	innerClassName,
	scrollRef,
	allowHorizontal = false,
}: BuyNowDialogBodyScrollProps) {
	return (
		<div
			ref={scrollRef}
			className={cn(
				"flex-1 min-h-0 overflow-y-auto overscroll-contain px-6",
				allowHorizontal ? "overflow-x-auto" : "overflow-x-hidden",
				nativePrimaryScrollbarClassName,
				className,
			)}
		>
			<div className={cn("py-4 min-w-0 w-full max-w-[calc(100%-0.5rem)] pr-4", innerClassName)}>
				{children}
			</div>
		</div>
	);
}

/** Step content padding wrapper - scroll is handled by BuyNowDialogBodyScroll. */
export function BuyNowStepBody({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={cn("space-y-4", className)}>{children}</div>;
}
