"use client";

import * as React from "react";
import { History, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";

function formatWhen(value: Date | string | null | undefined): string {
	if (!value) return "";
	const d = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function statusBadgeClass(status: string): string {
	switch (status) {
		case "running":
		case "queued":
			return "border-blue-500/40 text-blue-700 dark:text-blue-300";
		case "completed":
			return "border-emerald-500/40 text-emerald-700 dark:text-emerald-300";
		case "partial":
			return "border-amber-500/40 text-amber-700 dark:text-amber-300";
		case "failed":
			return "border-destructive/40 text-destructive";
		default:
			return "";
	}
}

function outcomeBadgeClass(outcome: string): string {
	switch (outcome) {
		case "sent":
			return "border-emerald-500/40 text-emerald-700 dark:text-emerald-300";
		case "skipped":
			return "border-muted-foreground/30 text-muted-foreground";
		case "failed":
			return "border-destructive/40 text-destructive";
		default:
			return "";
	}
}

export function RenewalReminderCronMonitor() {
	const [open, setOpen] = React.useState(false);
	const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null);

	const statusQuery = trpc.clientSubscriptions.getRenewalReminderCronStatus.useQuery(
		undefined,
		{
			enabled: true,
			refetchInterval: (q) => (q.state.data?.isRunning ? 4000 : 30_000),
		},
	);

	const runsQuery = trpc.clientSubscriptions.listRenewalReminderCronRuns.useQuery(
		{ limit: 40 },
		{
			enabled: open,
			refetchInterval: statusQuery.data?.isRunning ? 4000 : false,
		},
	);

	const runDetailQuery = trpc.clientSubscriptions.getRenewalReminderCronRun.useQuery(
		{ runId: selectedRunId ?? "" },
		{ enabled: open && !!selectedRunId },
	);

	React.useEffect(() => {
		if (!selectedRunId && runsQuery.data?.runs[0]?.id) {
			setSelectedRunId(runsQuery.data.runs[0].id);
		}
	}, [runsQuery.data?.runs, selectedRunId]);

	const status = statusQuery.data;
	const liveLabel = status?.isRunning
		? "Running"
		: status?.isStale
			? "Stale"
			: "Idle";

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button size="sm" variant="outline">
					<History className="mr-2 h-4 w-4" />
					Cron logs
					<Badge
						variant="outline"
						className={cn(
							"ml-2 capitalize",
							status?.isRunning && statusBadgeClass("running"),
							status?.isStale && statusBadgeClass("partial"),
						)}
					>
						{statusQuery.isLoading ? "…" : liveLabel}
					</Badge>
				</Button>
			</SheetTrigger>
			<SheetContent className="w-full sm:max-w-2xl flex flex-col p-0 gap-0">
				<SheetHeader className="px-6 pt-6 pb-4 space-y-1">
					<div className="flex items-start justify-between gap-3 pr-8">
						<div>
							<SheetTitle>Renewal reminder cron</SheetTitle>
							<SheetDescription>
								Daily 00:00 UTC schedule status, run history, and per-subscription
								email outcomes.
							</SheetDescription>
						</div>
						<Button
							size="icon"
							variant="ghost"
							className="shrink-0"
							onClick={() => {
								void statusQuery.refetch();
								void runsQuery.refetch();
								if (selectedRunId) void runDetailQuery.refetch();
							}}
						>
							<RefreshCw
								className={cn(
									"h-4 w-4",
									(statusQuery.isFetching || runsQuery.isFetching) &&
										"animate-spin",
								)}
							/>
						</Button>
					</div>
				</SheetHeader>

				<div className="px-6 pb-4 grid gap-3 sm:grid-cols-2">
					<div className="rounded-lg border p-3 space-y-1.5">
						<p className="text-xs font-medium text-muted-foreground">Live status</p>
						<div className="flex items-center gap-2">
							{status?.isRunning ? (
								<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
							) : null}
							<span className="text-sm font-medium">{liveLabel}</span>
							{status?.activeRunId ? (
								<span className="text-[11px] text-muted-foreground truncate">
									{status.activeRunId.slice(0, 8)}…
								</span>
							) : null}
						</div>
						{status?.latestRun ? (
							<p className="text-xs text-muted-foreground">
								Latest: {status.latestRun.summary ?? status.latestRun.status}
							</p>
						) : (
							<p className="text-xs text-muted-foreground">No runs yet</p>
						)}
					</div>
					<div className="rounded-lg border p-3 space-y-1.5">
						<p className="text-xs font-medium text-muted-foreground">Schedule</p>
						<p className="text-sm font-medium">
							{status?.schedule.cron ?? "0 0 * * *"} UTC
						</p>
						<p className="text-xs text-muted-foreground">
							{status?.schedule.scheduleExists
								? status.schedule.isPaused
									? "Paused in QStash"
									: "Registered in QStash"
								: status?.schedule.configured
									? "Not registered yet (will create on worker boot / Run now)"
									: "QStash not configured"}
						</p>
						{status?.schedule.error ? (
							<p className="text-xs text-destructive">{status.schedule.error}</p>
						) : null}
					</div>
				</div>

				<Separator />

				<div className="flex-1 min-h-0 grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
					<div className="border-r min-h-0 flex flex-col">
						<p className="px-4 py-2 text-xs font-medium text-muted-foreground">
							Run history
						</p>
						<ScrollArea className="flex-1">
							<div className="px-2 pb-4 space-y-1">
								{runsQuery.isLoading ? (
									<p className="px-2 py-4 text-sm text-muted-foreground">
										Loading runs…
									</p>
								) : (runsQuery.data?.runs.length ?? 0) === 0 ? (
									<p className="px-2 py-4 text-sm text-muted-foreground">
										No cron runs logged yet.
									</p>
								) : (
									runsQuery.data?.runs.map((run) => (
										<button
											key={run.id}
											type="button"
											onClick={() => setSelectedRunId(run.id)}
											className={cn(
												"w-full text-left rounded-md px-3 py-2 transition-colors hover:bg-muted/60",
												selectedRunId === run.id && "bg-muted",
											)}
										>
											<div className="flex items-center justify-between gap-2">
												<span className="text-xs text-muted-foreground">
													{formatWhen(run.createdAt)}
												</span>
												<Badge
													variant="outline"
													className={cn(
														"capitalize text-[10px]",
														statusBadgeClass(run.status),
													)}
												>
													{run.status}
												</Badge>
											</div>
											<p className="mt-1 text-xs">
												<span className="capitalize">{run.source}</span>
												{" · "}
												sent {run.sent} / skip {run.skipped} / fail {run.failed}
											</p>
										</button>
									))
								)}
							</div>
						</ScrollArea>
					</div>

					<div className="min-h-0 flex flex-col">
						<p className="px-4 py-2 text-xs font-medium text-muted-foreground">
							Run detail
						</p>
						<ScrollArea className="flex-1">
							<div className="px-4 pb-6 space-y-4">
								{!selectedRunId ? (
									<p className="text-sm text-muted-foreground">Select a run</p>
								) : runDetailQuery.isLoading ? (
									<p className="text-sm text-muted-foreground">Loading detail…</p>
								) : runDetailQuery.isError ? (
									<p className="text-sm text-destructive">
										{runDetailQuery.error.message}
									</p>
								) : runDetailQuery.data ? (
									<>
										<div className="space-y-2 text-sm">
											<div className="flex flex-wrap items-center gap-2">
												<Badge
													variant="outline"
													className={cn(
														"capitalize",
														statusBadgeClass(runDetailQuery.data.run.status),
													)}
												>
													{runDetailQuery.data.run.status}
												</Badge>
												<span className="capitalize text-muted-foreground">
													{runDetailQuery.data.run.source}
												</span>
											</div>
											<p className="text-xs text-muted-foreground break-all">
												ID: {runDetailQuery.data.run.id}
											</p>
											<p>
												{runDetailQuery.data.run.summary ??
													`Scanned ${runDetailQuery.data.run.scanned}`}
											</p>
											<div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
												<span>
													Started: {formatWhen(runDetailQuery.data.run.startedAt)}
												</span>
												<span>
													Finished:{" "}
													{formatWhen(runDetailQuery.data.run.finishedAt)}
												</span>
												<span>
													Heartbeat:{" "}
													{formatWhen(runDetailQuery.data.run.heartbeatAt)}
												</span>
												<span>
													Batches: {runDetailQuery.data.run.batchCount}
												</span>
											</div>
											{runDetailQuery.data.run.lastError ? (
												<p className="text-xs text-destructive whitespace-pre-wrap">
													{runDetailQuery.data.run.lastError}
												</p>
											) : null}
										</div>

										<Separator />

										<div className="space-y-2">
											<p className="text-xs font-medium text-muted-foreground">
												Items ({runDetailQuery.data.items.length})
											</p>
											{runDetailQuery.data.items.length === 0 ? (
												<p className="text-sm text-muted-foreground">
													No item logs for this run.
												</p>
											) : (
												runDetailQuery.data.items.map((item) => (
													<div
														key={item.id}
														className="rounded-md border px-3 py-2 space-y-1"
													>
														<div className="flex items-center justify-between gap-2">
															<p className="text-sm font-medium truncate">
																{item.subscriptionName ??
																	item.productName ??
																	item.subscriptionId ??
																	"Subscription"}
															</p>
															<Badge
																variant="outline"
																className={cn(
																	"capitalize text-[10px] shrink-0",
																	outcomeBadgeClass(item.outcome),
																)}
															>
																{item.outcome}
															</Badge>
														</div>
														{item.emailTo ? (
															<p className="text-xs text-muted-foreground truncate">
																To: {item.emailTo}
															</p>
														) : null}
														{item.skipReason ? (
															<p className="text-xs text-muted-foreground">
																Skip: {item.skipReason.replaceAll("_", " ")}
															</p>
														) : null}
														{item.error ? (
															<p className="text-xs text-destructive">
																{item.error}
															</p>
														) : null}
													</div>
												))
											)}
										</div>
									</>
								) : null}
							</div>
						</ScrollArea>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
