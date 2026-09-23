"use client";

import { Link } from "react-router";
import { Label, Pie, PieChart } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type MetricCountValue = number | string | null;

export type MetricSlice = {
	key: string;
	label: string;
	value: number;
	color: string;
};

export type MetricStat = {
	label: string;
	value: MetricCountValue;
	tone?: "positive" | "negative" | "muted";
};

export type MetricAction = {
	label: string;
	href: string;
	external?: boolean;
};

function displayValue(value: MetricCountValue): string {
	if (value == null) return "N/A";
	return String(value);
}

export function MetricPieCard({
	title,
	description,
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
		<Card className="gap-4 py-0">
			<CardHeader className="px-5 pt-5 pb-0">
				<CardTitle className="text-base">{title}</CardTitle>
				{description ? <CardDescription>{description}</CardDescription> : null}
			</CardHeader>
			<CardContent className="flex flex-1 flex-col gap-4 px-5 pb-5">
				{loading ? (
					<Skeleton className="mx-auto size-[180px] rounded-full" />
				) : error || !hasData ? (
					<div className="flex h-[180px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
						{error ? "Unable to load" : "No data yet"}
					</div>
				) : (
					<ChartContainer
						config={config}
						className="[&_.recharts-text]:fill-background mx-auto aspect-square h-[220px] w-full"
					>
						<PieChart>
							<Pie
								data={chartData}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								innerRadius={48}
								outerRadius={68}
								paddingAngle={5}
								cornerRadius={6}
								isAnimationActive
								animationBegin={0}
								animationDuration={800}
								animationEasing="ease-out"
							>
								<Label
									content={({ viewBox }) => {
										if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
										return (
											<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy ?? 0) - (centerLabel ? 6 : 0)}
													className="fill-foreground text-2xl font-bold"
												>
													{displayValue(centerValue)}
												</tspan>
												{centerLabel ? (
													<tspan
														x={viewBox.cx}
														y={(viewBox.cy ?? 0) + 16}
														className="fill-muted-foreground text-[11px]"
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
							<ChartLegend className="mt-2" content={<ChartLegendContent nameKey="name" />} />
						</PieChart>
					</ChartContainer>
				)}

				<div className="grid grid-cols-2 gap-2">
					{stats.map((stat) => (
						<div key={stat.label} className="rounded-lg bg-muted/50 px-3 py-2">
							<p className="text-[11px] text-muted-foreground">{stat.label}</p>
							{loading ? (
								<Skeleton className="mt-1 h-5 w-10" />
							) : (
								<p
									className={cn(
										"text-sm font-semibold tabular-nums",
										stat.tone === "positive" && "text-emerald-600 dark:text-emerald-400",
										stat.tone === "negative" && "text-red-600 dark:text-red-400",
										(stat.tone === "muted" || stat.value == null) && "text-muted-foreground",
									)}
								>
									{displayValue(stat.value)}
								</p>
							)}
						</div>
					))}
				</div>

				<div className="mt-auto flex flex-wrap gap-2">
					{actions.map((action) =>
						action.external ? (
							<Button key={action.href} variant="outline" size="sm" asChild>
								<a href={action.href} target="_blank" rel="noopener noreferrer">
									{action.label}
								</a>
							</Button>
						) : (
							<Button key={action.href} variant="outline" size="sm" asChild>
								<Link to={action.href}>{action.label}</Link>
							</Button>
						),
					)}
				</div>
			</CardContent>
		</Card>
	);
}
