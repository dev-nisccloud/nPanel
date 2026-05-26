import { cn } from "@/lib/utils";

type MetricStatVariant = "positive" | "negative" | "muted";

export type DashboardMetricStat = {
	label: string;
	value: string | number;
	variant: MetricStatVariant;
};

export function DashboardMetricStats({ items }: { items: DashboardMetricStat[] }) {
	return (
		<div className="line-clamp-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base font-semibold">
			{items.map((item, index) => (
				<span key={item.label} className="inline-flex items-baseline gap-1.5">
					{index > 0 ? <span className="text-muted-foreground font-normal">·</span> : null}
					<span className="text-muted-foreground font-medium">{item.label}</span>
					<span
						className={cn(
							"tabular-nums text-lg font-bold",
							item.variant === "positive" && "text-green-600 dark:text-green-400",
							item.variant === "negative" && "text-red-600 dark:text-red-400",
							item.variant === "muted" && "text-muted-foreground",
						)}
					>
						{item.value}
					</span>
				</span>
			))}
		</div>
	);
}
