"use client";

import { Badge } from "@/components/ui/badge";

export function StockBadge({ stock }: { stock: "available" | "limited" | "unavailable" }) {
	if (stock === "available") {
		return (
			<Badge
				variant="outline"
				className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
			>
				Available
			</Badge>
		);
	}
	if (stock === "limited") {
		return (
			<Badge
				variant="outline"
				className="bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200 dark:border-amber-800"
			>
				Limited
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="bg-muted text-muted-foreground">
			Unavailable
		</Badge>
	);
}

