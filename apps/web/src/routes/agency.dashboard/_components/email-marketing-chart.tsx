"use client";

import * as React from "react";
import { Area, AreaChart, XAxis } from "recharts";
import { format, subDays } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { trpc } from "@/utils/trpc";

const emailChartConfigBase = {
	sent: { label: "Sent", color: "#6366f1" },
	delivered: { label: "Delivered", color: "#10b981" },
	opened: { label: "Opened", color: "#f59e0b" },
	clicked: { label: "Clicked", color: "#ec4899" },
	bounced: { label: "Bounced", color: "#ef4444" },
	complained: { label: "Complained", color: "#f97316" },
	unknown: { label: "Unknown", color: "#64748b" },
} satisfies ChartConfig;

export function EmailMarketingChart() {
	const isMobile = useIsMobile();
	const [timeRange, setTimeRange] = React.useState("30d");

	React.useEffect(() => {
		if (isMobile) setTimeRange("7d");
	}, [isMobile]);

	const emailChartConfig = emailChartConfigBase;

	const fromDate = React.useMemo(() => {
		const days = timeRange === "7d" ? 7 : 30;
		return subDays(new Date(), days);
	}, [timeRange]);

	const { data: events = [], isLoading } = trpc.niscEmailMarketing.emailEvents.getGlobalEvents.useQuery({
		from: fromDate,
	});

	const chartData = React.useMemo(() => {
		const days = timeRange === "7d" ? 7 : 30;
		const data: Record<
			string,
			{
				date: string;
				sent: number;
				delivered: number;
				opened: number;
				clicked: number;
				bounced: number;
				complained: number;
				unknown: number;
			}
		> = {};

		for (let i = 0; i <= days; i++) {
			const date = format(subDays(new Date(), i), "yyyy-MM-dd");
			data[date] = {
				date,
				sent: 0,
				delivered: 0,
				opened: 0,
				clicked: 0,
				bounced: 0,
				complained: 0,
				unknown: 0,
			};
		}

		events.forEach((event) => {
			const dateStr = format(event.eventCreatedAt, "yyyy-MM-dd");
			if (!data[dateStr]) return;
			if (event.type === "email_sent") data[dateStr].sent++;
			if (event.type === "email_delivered") data[dateStr].delivered++;
			if (event.type === "email_opened") data[dateStr].opened++;
			if (event.type === "email_clicked") data[dateStr].clicked++;
			if (event.type === "email_bounced") data[dateStr].bounced++;
			if (event.type === "email_complained") data[dateStr].complained++;
			if (event.type === "email_failed") data[dateStr].unknown++;
		});

		return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
	}, [events, timeRange]);

	const hasActivity = chartData.some(
		(day) =>
			day.sent +
				day.delivered +
				day.opened +
				day.clicked +
				day.bounced +
				day.complained +
				day.unknown >
			0,
	);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-1/3" />
					<Skeleton className="h-4 w-1/4" />
				</CardHeader>
				<CardContent className="h-[250px]">
					<Skeleton className="h-full w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!hasActivity) return null;

	const totals = chartData.reduce(
		(sum, day) => ({
			sent: sum.sent + day.sent,
			delivered: sum.delivered + day.delivered,
			opened: sum.opened + day.opened,
			clicked: sum.clicked + day.clicked,
		}),
		{ sent: 0, delivered: 0, opened: 0, clicked: 0 },
	);

	return (
		<Card className="h-full gap-0 py-0">
			<CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-5 py-4">
				<CardTitle className="text-sm">Email marketing</CardTitle>
				<div className="flex items-center justify-end">
					<ToggleGroup
						type="single"
						value={timeRange}
						onValueChange={(value) => {
							if (value) setTimeRange(value);
						}}
						variant="outline"
						className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
					>
						<ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
						<ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
					</ToggleGroup>
					<Select value={timeRange} onValueChange={setTimeRange}>
						<SelectTrigger
							className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
							size="sm"
							aria-label="Select a value"
						>
							<SelectValue placeholder="Last 30 days" />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="30d" className="rounded-lg">
								Last 30 days
							</SelectItem>
							<SelectItem value="7d" className="rounded-lg">
								Last 7 days
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent className="px-5 pb-4">
				<div className="grid grid-cols-4 gap-3 pb-2">
					{(
						[
							["Sent", totals.sent],
							["Delivered", totals.delivered],
							["Opened", totals.opened],
							["Clicked", totals.clicked],
						] as const
					).map(([label, value]) => (
						<div key={label}>
							<p className="text-[11px] text-muted-foreground">{label}</p>
							<p className="text-sm font-medium tabular-nums">{value.toLocaleString()}</p>
						</div>
					))}
				</div>
				<ChartContainer config={emailChartConfig} className="aspect-auto h-[140px] w-full">
					<AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
						<defs>
							<linearGradient id="email-sent-fill" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#6366f1" stopOpacity={0.18} />
								<stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
							</linearGradient>
						</defs>
						<XAxis dataKey="date" hide />
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									labelFormatter={(value) =>
										new Date(value).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
										})
									}
									indicator="line"
								/>
							}
						/>
						<Area
							dataKey="sent"
							type="monotone"
							stroke="#6366f1"
							strokeWidth={1.5}
							fill="url(#email-sent-fill)"
							dot={false}
							activeDot={false}
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
