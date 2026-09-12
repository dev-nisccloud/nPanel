"use client";

import * as React from "react";
import { ChevronDown, History, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

type CronItemMeta = {
	detail?: unknown;
	skipReason?: unknown;
	sentAt?: unknown;
	sesMessageId?: unknown;
	email?: unknown;
	attemptedEmail?: unknown;
	template?: unknown;
	error?: unknown;
	context?: unknown;
	invoice?: unknown;
	invoiceAttached?: unknown;
	lastRenewalReminderAt?: unknown;
	hoursSinceLastReminder?: unknown;
	dedupeHours?: unknown;
	[key: string]: unknown;
};

type EmailSnapshot = {
	to?: unknown;
	subject?: unknown;
	html?: unknown;
	fromEmail?: unknown;
	fromName?: unknown;
	replyTo?: unknown;
	sesMessageId?: unknown;
};

function asRecord(value: unknown): CronItemMeta {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value as CronItemMeta;
	}
	return {};
}

function asEmailSnapshot(value: unknown): EmailSnapshot | null {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value as EmailSnapshot;
	}
	return null;
}

function asString(value: unknown): string | null {
	return typeof value === "string" && value.trim() ? value : null;
}

function stringifyPayload(value: unknown): string {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function metadataForDisplay(meta: CronItemMeta): unknown {
	const clone: CronItemMeta = { ...meta };
	for (const key of ["email", "attemptedEmail"] as const) {
		const snap = asEmailSnapshot(clone[key]);
		if (!snap) continue;
		const html = asString(snap.html);
		clone[key] = {
			...snap,
			html: html ? `[html ${html.length} characters]` : snap.html,
		};
	}
	return clone;
}

function JsonBlock({ value, className }: { value: unknown; className?: string }) {
	if (value == null) return null;
	return (
		<pre
			className={cn(
				"max-h-56 overflow-auto rounded-md bg-muted/50 p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words",
				className,
			)}
		>
			{stringifyPayload(value)}
		</pre>
	);
}

function EmailPreview({
	snapshot,
	fallbackLabel,
}: {
	snapshot: EmailSnapshot | null;
	fallbackLabel: string;
}) {
	const html = asString(snapshot?.html);
	if (!html) {
		return (
			<p className="text-xs text-muted-foreground">{fallbackLabel}</p>
		);
	}

	const fromName = asString(snapshot?.fromName);
	const fromEmail = asString(snapshot?.fromEmail);
	const from =
		fromName && fromEmail
			? `${fromName} <${fromEmail}>`
			: fromEmail ?? fromName;

	return (
		<div className="space-y-2">
			<div className="grid gap-1 text-[11px] text-muted-foreground">
				{from ? <p>From: {from}</p> : null}
				{asString(snapshot?.to) ? <p>To: {asString(snapshot?.to)}</p> : null}
				{asString(snapshot?.subject) ? (
					<p>Subject: {asString(snapshot?.subject)}</p>
				) : null}
				{asString(snapshot?.sesMessageId) ? (
					<p className="break-all">SES: {asString(snapshot?.sesMessageId)}</p>
				) : null}
			</div>
			<div className="overflow-hidden rounded-md border bg-white">
				<iframe
					title="Sent renewal reminder email"
					className="h-[360px] w-full bg-white"
					sandbox=""
					srcDoc={html}
				/>
			</div>
		</div>
	);
}

function CronRunItemCard({
	item,
}: {
	item: {
		id: string;
		outcome: string;
		subscriptionName: string | null;
		productName: string | null;
		subscriptionId: string | null;
		emailTo: string | null;
		subject: string | null;
		skipReason: string | null;
		error: string | null;
		expiryDate: Date | string | null;
		createdAt: Date | string;
		metadata: unknown;
	};
}) {
	const meta = asRecord(item.metadata);
	const sentEmail = asEmailSnapshot(meta.email);
	const attemptedEmail = asEmailSnapshot(meta.attemptedEmail);
	const invoice = asRecord(meta.invoice);
	const invoiceNumber = asString(invoice.invoiceNumber);
	const invoiceSkip = asString(invoice.reasonMessage);
	const lineName = asString(invoice.lineName);
	const lineDescription = asString(invoice.lineDescription);
	const skipDetail = asString(meta.detail);
	const sesMessageId =
		asString(meta.sesMessageId) ?? asString(sentEmail?.sesMessageId);

	return (
		<div className="rounded-md border px-3 py-2 space-y-2">
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

			<div className="grid gap-0.5 text-xs text-muted-foreground">
				{item.productName ? <p>Service: {item.productName}</p> : null}
				{item.subscriptionId ? (
					<p className="break-all">Subscription ID: {item.subscriptionId}</p>
				) : null}
				{item.expiryDate ? <p>Due: {formatWhen(item.expiryDate)}</p> : null}
				{item.emailTo ? <p>To: {item.emailTo}</p> : null}
				{asString(meta.recipientSource) === "team_owners" ? (
					<p>Recipients: team owners (first owner on the invoice)</p>
				) : null}
				{item.subject ? <p>Subject: {item.subject}</p> : null}
				{sesMessageId ? (
					<p className="break-all">SES message ID: {sesMessageId}</p>
				) : null}
				{item.createdAt ? <p>Logged: {formatWhen(item.createdAt)}</p> : null}
				{invoiceNumber ? (
					<p>
						Invoice: {invoiceNumber}
						{invoice.created === true
							? " (created)"
							: invoice.created === false
								? " (existing)"
								: ""}
						{meta.invoiceAttached === true ? " · attached to email" : ""}
					</p>
				) : invoiceSkip ? (
					<p>Invoice: {invoiceSkip}</p>
				) : null}
				{lineName ? <p>{lineName}</p> : null}
				{lineDescription ? <p>{lineDescription}</p> : null}
			</div>

			{item.outcome === "skipped" ? (
				<div className="space-y-1">
					<p className="text-xs">
						Skip:{" "}
						{(item.skipReason ?? asString(meta.skipReason) ?? "unknown").replaceAll(
							"_",
							" ",
						)}
					</p>
					{skipDetail ? (
						<p className="text-xs text-muted-foreground whitespace-pre-wrap">
							{skipDetail}
						</p>
					) : null}
					{Object.keys(meta).length > 0 ? (
						<div className="space-y-1">
							<p className="text-[11px] font-medium text-muted-foreground">
								Full result
							</p>
							<JsonBlock value={metadataForDisplay(meta)} />
						</div>
					) : null}
				</div>
			) : null}

			{item.outcome === "failed" ? (
				<div className="space-y-1">
					<p className="text-xs text-destructive whitespace-pre-wrap">
						{item.error ?? skipDetail ?? "Send failed"}
					</p>
					{Object.keys(meta).length > 0 || item.error ? (
						<div className="space-y-1">
							<p className="text-[11px] font-medium text-muted-foreground">
								Full result
							</p>
							<JsonBlock
								value={
									Object.keys(meta).length > 0
										? metadataForDisplay(meta)
										: { error: item.error }
								}
								className="bg-destructive/5"
							/>
						</div>
					) : null}
					{attemptedEmail?.html ? (
						<Collapsible className="group">
							<CollapsibleTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-xs"
								>
									<ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
									Attempted email
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="pt-2">
								<EmailPreview
									snapshot={attemptedEmail}
									fallbackLabel="HTML was not captured for this failure."
								/>
							</CollapsibleContent>
						</Collapsible>
					) : null}
				</div>
			) : null}

			{item.outcome === "sent" ? (
				<div className="space-y-1">
					{asString(meta.sentAt) ? (
						<p className="text-xs text-muted-foreground">
							Sent at: {formatWhen(asString(meta.sentAt))}
						</p>
					) : null}
					<Collapsible className="group">
						<CollapsibleTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs"
							>
								<ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
								View sent email
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent className="pt-2 space-y-2">
							<EmailPreview
								snapshot={sentEmail}
								fallbackLabel="Email HTML was not stored for this run. New runs keep the exact message."
							/>
							{meta.template != null ? (
								<div className="space-y-1">
									<p className="text-[11px] font-medium text-muted-foreground">
										Template inputs
									</p>
									<JsonBlock value={meta.template} />
								</div>
							) : null}
						</CollapsibleContent>
					</Collapsible>
				</div>
			) : null}
		</div>
	);
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

	const activityQuery = trpc.clientSubscriptions.listRenewalReminderCronActivity.useQuery(
		{ limit: 40 },
		{ enabled: open },
	);

	React.useEffect(() => {
		if (!selectedRunId && runsQuery.data?.runs[0]?.id) {
			setSelectedRunId(runsQuery.data.runs[0].id);
		}
	}, [runsQuery.data?.runs, selectedRunId]);

	const status = statusQuery.data;
	const liveLabel =
		status?.enabled === false
			? "Off"
			: status?.isRunning
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
			<SheetContent className="w-full sm:max-w-3xl flex flex-col p-0 gap-0">
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
								void activityQuery.refetch();
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
					<div className="rounded-lg border p-3 space-y-1.5 sm:col-span-2">
						<p className="text-xs font-medium text-muted-foreground">On / off log</p>
						{activityQuery.isLoading ? (
							<p className="text-xs text-muted-foreground">Loading…</p>
						) : (activityQuery.data?.items.length ?? 0) === 0 ? (
							<p className="text-xs text-muted-foreground">None</p>
						) : (
							<div className="max-h-28 overflow-auto space-y-1">
								{activityQuery.data?.items.map((item) => (
									<p key={item.id} className="text-xs">
										<span className="text-muted-foreground">
											{formatWhen(item.createdAt)}
										</span>
										{" · "}
										{item.action}
										{" · "}
										{item.userName ?? item.userEmail ?? item.userId ?? "—"}
									</p>
								))}
							</div>
						)}
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
													<CronRunItemCard key={item.id} item={item} />
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
