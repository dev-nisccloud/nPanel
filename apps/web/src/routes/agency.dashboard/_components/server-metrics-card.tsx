"use client";

import { useMemo } from "react";
import { Link } from "react-router";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { toast } from "@/components/ui/sonner";

import {
	EChartsRadialChart,
	type ChartConfig as RadialChartConfig,
} from "@/components/evilcharts/charts/echarts-radial-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { trpc } from "@/utils/trpc";

const loadChartConfig = {
	load1: { label: "1 min", color: "#6366f1" },
	load5: { label: "5 min", color: "#f59e0b" },
} satisfies ChartConfig;

function DottedBackgroundPattern({ id }: { id: string }) {
	return (
		<pattern id={id} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
			<circle className="text-muted dark:text-muted/40" cx="2" cy="2" r="1" fill="currentColor" />
		</pattern>
	);
}

function downsample<T>(rows: T[], max: number): T[] {
	if (rows.length <= max) return rows;
	const step = (rows.length - 1) / (max - 1);
	return Array.from({ length: max }, (_, index) => rows[Math.round(index * step)]!);
}

function formatBytes(bytes: number | null | undefined): string {
	if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "N/A";
	const gb = bytes / 1024 ** 3;
	if (gb >= 1) return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
	const mb = bytes / 1024 ** 2;
	if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
	const kb = bytes / 1024;
	return `${kb.toFixed(0)} KB`;
}

function formatUptime(seconds: number | null | undefined): string {
	if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "N/A";
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	if (days > 0) return `${days}d ${hours}h`;
	const minutes = Math.floor((seconds % 3600) / 60);
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

function formatLoad(value: number | null | undefined): string {
	if (value == null || !Number.isFinite(value)) return "N/A";
	return value.toFixed(2);
}

function percent(used: number | null | undefined, total: number | null | undefined): number | null {
	if (used == null || total == null || total <= 0) return null;
	return Math.min(100, Math.max(0, (used / total) * 100));
}

function quotaLabel(name: string, used: number | null | undefined, total: number | null | undefined, pct: number | null) {
	const share = pct == null ? "—" : `${Math.round(pct)}%`;
	return `${name} · ${share} · ${formatBytes(used)} / ${formatBytes(total)}`;
}

type QuotaSlice = {
	used: number | null | undefined;
	total: number | null | undefined;
	pct: number | null;
};

function AssignedQuotaCard({
	isLoading,
	memory,
	swap,
	disk,
}: {
	isLoading: boolean;
	memory: QuotaSlice;
	swap: QuotaSlice;
	disk: QuotaSlice;
}) {
	const data = useMemo(
		() => [
			{ resource: "memory", used: memory.pct == null ? 0 : Math.round(memory.pct) },
			{ resource: "swap", used: swap.pct == null ? 0 : Math.round(swap.pct) },
			{ resource: "disk", used: disk.pct == null ? 0 : Math.round(disk.pct) },
		],
		[memory.pct, swap.pct, disk.pct],
	);

	const chartConfig = useMemo(
		() =>
			({
				memory: {
					label: quotaLabel("Memory", memory.used, memory.total, memory.pct),
					colors: { light: ["#f59e0b"], dark: ["#fbbf24"] },
				},
				swap: {
					label: quotaLabel("Swap", swap.used, swap.total, swap.pct),
					colors: { light: ["#0ea5e9"], dark: ["#38bdf8"] },
				},
				disk: {
					label: quotaLabel("Disk", disk.used, disk.total, disk.pct),
					colors: { light: ["#4f46e5"], dark: ["#818cf8"] },
				},
			}) satisfies RadialChartConfig,
		[memory, swap, disk],
	);

	return (
		<Card className="h-full min-h-[22rem] gap-0 py-0">
			<CardHeader className="border-b px-5 py-4">
				<CardTitle className="text-sm">Assigned quota</CardTitle>
			</CardHeader>
			<CardContent className="flex min-h-0 flex-1 px-0 py-2">
				<EChartsRadialChart
					className="h-full min-h-64 w-full flex-1 p-4"
					data={data}
					nameKey="resource"
					config={chartConfig}
					variant="semi"
					max={100}
					isLoading={isLoading}
				>
					<EChartsRadialChart.Legend />
					<EChartsRadialChart.Tooltip />
					<EChartsRadialChart.RadialBar dataKey="used" />
				</EChartsRadialChart>
			</CardContent>
		</Card>
	);
}

export function ServerMetricsCard() {
	const utils = trpc.useUtils();
	const { data, isLoading, isError } = trpc.agencyDashboard.getServerMetrics.useQuery(
		{ persist: true },
		{
			placeholderData: (prev) => prev,
			refetchOnWindowFocus: false,
			staleTime: 60_000,
		},
	);
	const refreshMetrics = trpc.agencyDashboard.refreshServerMetrics.useMutation({
		onSuccess: (result) => {
			utils.agencyDashboard.getServerMetrics.setData({ persist: true }, result);
			toast.success("Server metrics updated");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to refresh server metrics");
		},
	});

	const latest = data?.latest ?? null;
	const disk = useMemo(() => {
		const devices = latest?.diskDevices ?? [];
		return devices.reduce(
			(acc, device) => ({
				total: acc.total + device.total,
				used: acc.used + device.used,
				free: acc.free + device.free,
			}),
			{ total: 0, used: 0, free: 0 },
		);
	}, [latest]);

	const memPct = percent(latest?.memUsed, latest?.memTotal);
	const diskPct = percent(disk.used, disk.total);
	const swapPct = percent(latest?.swapUsed, latest?.swapTotal);

	const history = useMemo(() => {
		const rows = data?.history ?? [];
		const points = rows.map((row) => {
			const captured = row.capturedAt instanceof Date ? row.capturedAt : new Date(row.capturedAt);
			return {
				ts: captured.getTime(),
				label: format(captured, "MMM d HH:mm"),
				load1: row.load1 ?? 0,
				load5: row.load5 ?? 0,
			};
		});

		if (latest && (latest.load1 != null || latest.load5 != null)) {
			const now = Date.now();
			const lastTs = points.at(-1)?.ts ?? 0;
			if (now - lastTs > 30_000) {
				points.push({
					ts: now,
					label: format(now, "MMM d HH:mm"),
					load1: latest.load1 ?? 0,
					load5: latest.load5 ?? 0,
				});
			}
		}

		return points;
	}, [data?.history, latest]);

	const unavailable = Boolean(data?.unavailable && !latest);

	return (
		<section className="space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-base font-semibold">Server resources</h2>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={refreshMetrics.isPending}
						onClick={() => refreshMetrics.mutate()}
					>
						<RefreshCw className={cn("size-3.5", refreshMetrics.isPending && "animate-spin")} />
						{refreshMetrics.isPending ? "Refreshing" : "Refresh"}
					</Button>
					<Button variant="outline" size="sm" asChild>
						<Link to="/agency/hosting">Hosting</Link>
					</Button>
				</div>
			</div>

			{isError || unavailable ? (
				<Card className="py-0">
					<CardContent className="px-5 py-6 text-sm text-muted-foreground">
						Plesk server metrics are unavailable right now. Snapshots appear here once the XML API responds.
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
					<AssignedQuotaCard
						isLoading={isLoading}
						memory={{ used: latest?.memUsed, total: latest?.memTotal, pct: memPct }}
						swap={{ used: latest?.swapUsed, total: latest?.swapTotal, pct: swapPct }}
						disk={{ used: disk.used, total: disk.total, pct: diskPct }}
					/>

					<Card className="gap-0 py-0">
						<CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-5 py-4">
							<CardTitle className="text-sm">CPU load</CardTitle>
							<p className="text-xs text-muted-foreground">
								{history.length} snapshot{history.length === 1 ? "" : "s"} · last 7 days
							</p>
						</CardHeader>
						<CardContent className="space-y-4 px-5 py-5">
							<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
								{[
									{ label: "Load 1m", value: formatLoad(latest?.load1) },
									{ label: "Load 5m", value: formatLoad(latest?.load5) },
									{ label: "Load 15m", value: formatLoad(latest?.load15) },
									{ label: "Uptime", value: formatUptime(latest?.uptimeSeconds) },
								].map((stat) => (
									<div key={stat.label} className="rounded-lg bg-muted/50 px-3 py-2">
										<p className="text-[11px] text-muted-foreground">{stat.label}</p>
										{isLoading ? (
											<Skeleton className="mt-1 h-5 w-12" />
										) : (
											<p className="text-sm font-semibold tabular-nums">{stat.value}</p>
										)}
									</div>
								))}
							</div>

							{isLoading ? (
								<Skeleton className="h-[180px] w-full" />
							) : history.length === 0 ? (
								<p className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
									No snapshots yet. Refresh to pull a live reading from the server.
								</p>
							) : (
								<ChartContainer config={loadChartConfig} className="aspect-auto h-[200px] w-full">
									<LineChart data={downsample(history, 72)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
										<defs>
											<DottedBackgroundPattern id="cpu-load-pattern-dots" />
										</defs>
										<rect x="0" y="0" width="100%" height="78%" fill="url(#cpu-load-pattern-dots)" />
										<CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.35} />
										<XAxis
											dataKey="label"
											tickLine={false}
											axisLine={false}
											minTickGap={32}
											tickMargin={8}
											tick={{ fontSize: 11 }}
										/>
										<YAxis
											tickLine={false}
											axisLine={false}
											width={28}
											domain={[0, "auto"]}
											tick={{ fontSize: 11 }}
										/>
										<ChartTooltip
											cursor={false}
											content={
												<ChartTooltipContent
													indicator="dot"
													labelFormatter={(_, payload) =>
														payload?.[0]?.payload?.label ?? "CPU load"
													}
												/>
											}
										/>
										<ChartLegend content={<ChartLegendContent />} />
										<Line
											type="natural"
											dataKey="load1"
											stroke="var(--color-load1)"
											strokeWidth={2}
											dot={false}
											activeDot={{ r: 4, strokeWidth: 0 }}
											isAnimationActive
											animationDuration={800}
										/>
										<Line
											type="natural"
											dataKey="load5"
											stroke="var(--color-load5)"
											strokeWidth={2}
											dot={false}
											activeDot={{ r: 4, strokeWidth: 0 }}
											isAnimationActive
											animationDuration={800}
										/>
									</LineChart>
								</ChartContainer>
							)}
						</CardContent>
					</Card>
				</div>
			)}
		</section>
	);
}
