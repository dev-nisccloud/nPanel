"use client";

import type { ComponentType } from "react";
import { Link } from "react-router";
import { Label, Pie, PieChart } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MetricAction, MetricCountValue, MetricSlice, MetricStat } from "@/components/dashboard/metric-pie-card";

function displayValue(value: MetricCountValue): string {
	if (value == null) return "N/A";
	return String(value);
}

export function AgencyMetricCard({
	title,
	description,
	icon: Icon,
	slices,
	centerValue,
	centerLabel,
	stats,
	actions,
	loading,
	error,
}: {
	title: string;
	description?: string;
	icon: ComponentType<{ className?: string; size?: number }>;
	slices: MetricSlice[];
	centerValue: MetricCountValue;
	centerLabel?: string;
	stats: MetricStat[];
	actions: MetricAction[];
	loading?: boolean;
	error?: boolean;
}) {
	const chartData = slices.map((slice) => ({
		name: slice.key,
		value: Math.max(0, slice.value),
		fill: slice.color,
	}));
	const hasData = chartData.some((slice) => slice.value > 0);
	const config = Object.fromEntries(
		slices.map((slice) => [slice.key, { label: slice.label, color: slice.color }]),
	) satisfies ChartConfig;

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-3">
				<span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
					<Icon size={16} />
				</span>
				<div className="min-w-0">
					<CardTitle className="text-sm">{title}</CardTitle>
					{description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
				</div>
			</CardHeader>
			<CardContent className="grid grid-cols-1 items-center gap-2 px-3 py-3 sm:grid-cols-[132px_minmax(0,1fr)]">
				{loading ? (
					<Skeleton className="mx-auto size-[112px] rounded-full" />
				) : error || !hasData ? (
					<div className="flex h-[112px] items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
						{error ? "Unable to load" : "No data yet"}
					</div>
				) : (
					<ChartContainer config={config} className="mx-auto aspect-square h-[120px] w-[120px]">
						<PieChart>
							<Pie
								data={chartData}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								innerRadius={34}
								outerRadius={50}
								paddingAngle={4}
								cornerRadius={4}
								isAnimationActive
								animationDuration={700}
							>
								<Label
									content={({ viewBox }) => {
										if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
										return (
											<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy ?? 0) - (centerLabel ? 4 : 0)}
													className="fill-foreground text-base font-semibold"
												>
													{displayValue(centerValue)}
												</tspan>
												{centerLabel ? (
													<tspan
														x={viewBox.cx}
														y={(viewBox.cy ?? 0) + 12}
														className="fill-muted-foreground text-[10px]"
													>
														{centerLabel}
													</tspan>
												) : null}
											</text>
										);
									}}
								/>
							</Pie>
							<ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
						</PieChart>
					</ChartContainer>
				)}

				<ul className="divide-y">
					{stats.map((stat) => (
						<li key={stat.label} className="flex items-center justify-between gap-3 py-1.5">
							<span className="text-xs text-muted-foreground">{stat.label}</span>
							{loading ? (
								<Skeleton className="h-4 w-8" />
							) : (
								<span
									className={cn(
										"text-sm font-medium tabular-nums",
										stat.tone === "positive" && "text-emerald-600 dark:text-emerald-400",
										stat.tone === "negative" && "text-red-600 dark:text-red-400",
										(stat.tone === "muted" || stat.value == null) && "text-muted-foreground",
									)}
								>
									{displayValue(stat.value)}
								</span>
							)}
						</li>
					))}
				</ul>
			</CardContent>
			<div className="flex flex-wrap gap-1 border-t px-3 py-2">
				{actions.map((action) =>
					action.external ? (
						<Button key={action.href} variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
							<a href={action.href} target="_blank" rel="noopener noreferrer">
								{action.label}
							</a>
						</Button>
					) : (
						<Button key={action.href} variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
							<Link to={action.href}>{action.label}</Link>
						</Button>
					),
				)}
			</div>
		</Card>
	);
}
