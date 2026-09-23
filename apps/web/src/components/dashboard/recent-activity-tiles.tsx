"use client";

import type { ReactNode } from "react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function RecentActivityGrid({ children }: { children: ReactNode }) {
	return (
		<div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
	);
}

export function RecentActivitySkeleton({ count = 6 }: { count?: number }) {
	return (
		<RecentActivityGrid>
			{Array.from({ length: count }).map((_, index) => (
				<div key={index} className="rounded-xl border border-border/60 bg-muted/20 p-4">
					<div className="flex items-start justify-between gap-3">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-5 w-14 rounded-full" />
					</div>
					<Skeleton className="mt-3 h-3 w-36" />
					<Skeleton className="mt-4 h-5 w-20" />
				</div>
			))}
		</RecentActivityGrid>
	);
}

export function RecentActivityEmpty({ message }: { message: string }) {
	return (
		<div className="flex min-h-[180px] items-center justify-center px-5 py-10 text-sm text-muted-foreground">
			{message}
		</div>
	);
}

export function RecentActivityTile({
	href,
	title,
	subtitle,
	amount,
	badge,
	meta,
}: {
	href?: string;
	title: string;
	subtitle?: string;
	amount?: string;
	badge: ReactNode;
	meta?: string;
}) {
	const body = (
		<div
			className={cn(
				"flex h-full flex-col rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors",
				href && "hover:border-border hover:bg-muted/40",
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold text-foreground">{title}</p>
					{subtitle ? (
						<p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
					) : null}
				</div>
				{badge}
			</div>
			{amount ? (
				<p className="mt-4 text-base font-semibold tabular-nums tracking-tight">{amount}</p>
			) : null}
			{meta ? <p className="mt-1 text-[11px] text-muted-foreground">{meta}</p> : null}
		</div>
	);

	if (!href) return body;

	return (
		<Link to={href} className="block h-full">
			{body}
		</Link>
	);
}

export function RecentActivityStatusBadge({
	label,
	tone = "default",
}: {
	label: string;
	tone?: "default" | "positive" | "negative" | "muted";
}) {
	return (
		<Badge
			variant={tone === "negative" ? "destructive" : tone === "muted" ? "secondary" : "outline"}
			className={cn(
				"shrink-0 text-[10px]",
				tone === "positive" &&
					"border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
			)}
		>
			{label}
		</Badge>
	);
}
