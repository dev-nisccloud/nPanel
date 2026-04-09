"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PlanCardSkeleton() {
	return (
		<Card className="h-full flex flex-col">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-3">
					<div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
					<div className="h-5 w-20 rounded bg-muted animate-pulse" />
				</div>
				<div className="mt-3 h-3 w-1/2 rounded bg-muted animate-pulse" />
			</CardHeader>
			<CardContent className="pt-0 flex-1 flex flex-col gap-4">
				<div className="space-y-3">
					<div className="h-3 w-28 rounded bg-muted animate-pulse" />
					<div className="h-20 rounded bg-muted animate-pulse" />
					<div className="h-10 rounded bg-muted animate-pulse" />
					<div className="h-10 rounded bg-muted animate-pulse" />
					<div className="h-10 rounded bg-muted animate-pulse" />
				</div>
				<div className="mt-auto">
					<div className="h-16 rounded bg-muted animate-pulse" />
					<div className="mt-3 flex justify-center gap-2">
						<div className="h-9 w-28 rounded bg-muted animate-pulse" />
						<div className="h-9 w-24 rounded bg-muted animate-pulse" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

