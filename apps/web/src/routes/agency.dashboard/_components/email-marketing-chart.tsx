"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { format, subDays } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { trpc } from "@/utils/trpc";

const emailChartConfigBase = {
	sent: { label: "Sent", color: "#64748b" },
	delivered: { label: "Delivered", color: "#10b981" },
	opened: { label: "Opened", color: "#059669" },
	clicked: { label: "Clicked", color: "#0f172a" },
	bounced: { label: "Bounced", color: "#ef4444" },
	complained: { label: "Complained", color: "#f97316" },
	unknown: { label: "Unknown", color: "#334155" },
} satisfies ChartConfig;

export function EmailMarketingChart() {
	const isMobile = useIsMobile();
	const [timeRange, setTimeRange] = React.useState("30d");
	const [clickedColor, setClickedColor] = React.useState("#0f172a");

	React.useEffect(() => {
		if (isMobile) setTimeRange("7d");
	}, [isMobile]);

	React.useEffect(() => {
		const raw = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
		if (!raw) return;
		setClickedColor(raw.startsWith("#") ? raw : `hsl(${raw})`);
	}, []);

	const emailChartConfig = React.useMemo(
		() => ({
			...emailChartConfigBase,
			clicked: { ...emailChartConfigBase.clicked, color: clickedColor },
		}),
		[clickedColor],
	);

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

	return (
		<Card>
			<CardHeader>
				<CardTitle>Email marketing</CardTitle>
				<CardDescription>Campaign performance</CardDescription>
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
			<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
				<ChartContainer config={emailChartConfig} className="aspect-auto h-[250px] w-full">
					<AreaChart data={chartData}>
						<defs>
							<linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--color-sent)" stopOpacity={1.0} />
								<stop offset="95%" stopColor="var(--color-sent)" stopOpacity={0.1} />
							</linearGradient>
							<linearGradient id="fillDelivered" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--color-delivered)" stopOpacity={0.9} />
								<stop offset="95%" stopColor="var(--color-delivered)" stopOpacity={0.1} />
							</linearGradient>
							<linearGradient id="fillOpened" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--color-opened)" stopOpacity={0.8} />
								<stop offset="95%" stopColor="var(--color-opened)" stopOpacity={0.1} />
							</linearGradient>
							<linearGradient id="fillClicked" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--color-clicked)" stopOpacity={0.8} />
								<stop offset="95%" stopColor="var(--color-clicked)" stopOpacity={0.1} />
							</linearGradient>
							<linearGradient id="fillBounced" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--color-bounced)" stopOpacity={0.8} />
								<stop offset="95%" stopColor="var(--color-bounced)" stopOpacity={0.1} />
							</linearGradient>
							<linearGradient id="fillComplained" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--color-complained)" stopOpacity={0.8} />
								<stop offset="95%" stopColor="var(--color-complained)" stopOpacity={0.1} />
							</linearGradient>
							<linearGradient id="fillUnknown" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--color-unknown)" stopOpacity={0.75} />
								<stop offset="95%" stopColor="var(--color-unknown)" stopOpacity={0.1} />
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={32}
							tickFormatter={(value) => {
								const date = new Date(value);
								return date.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								});
							}}
						/>
						<ChartTooltip
							cursor={false}
							defaultIndex={isMobile ? -1 : 10}
							content={
								<ChartTooltipContent
									labelFormatter={(value) => {
										return new Date(value).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
										});
									}}
									indicator="dot"
								/>
							}
						/>
						<Area dataKey="bounced" type="natural" fill="url(#fillBounced)" stroke="var(--color-bounced)" stackId="a" />
						<Area dataKey="complained" type="natural" fill="url(#fillComplained)" stroke="var(--color-complained)" stackId="a" />
						<Area dataKey="unknown" type="natural" fill="url(#fillUnknown)" stroke="var(--color-unknown)" stackId="a" />
						<Area dataKey="clicked" type="natural" fill="url(#fillClicked)" stroke="var(--color-clicked)" stackId="a" strokeWidth={2} />
						<Area dataKey="opened" type="natural" fill="url(#fillOpened)" stroke="var(--color-opened)" stackId="a" />
						<Area dataKey="delivered" type="natural" fill="url(#fillDelivered)" stroke="var(--color-delivered)" stackId="a" />
						<Area dataKey="sent" type="natural" fill="url(#fillSent)" stroke="var(--color-sent)" stackId="a" />
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
