"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight as ChevronRightIcon, ExternalLink, Inbox, MousePointerClick, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

function getEventTypeLabel(type: string): string {
	const labels: Record<string, string> = {
		email_delivered: "Delivered",
		email_opened: "Opened",
		email_clicked: "Clicked",
		email_bounced: "Bounced",
		email_complained: "Complained",
		email_suppressed: "Suppressed",
		email_sent: "Sent",
		email_received: "Received",
		email_scheduled: "Scheduled",
		email_delivery_delayed: "Delivery delayed",
		email_failed: "Failed",
	};
	return labels[type] ?? type;
}

function normalizeExternalHref(raw: string): string {
	const value = raw.trim();
	if (!value) return value;
	if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return value;
	if (value.startsWith("//")) return `https:${value}`;
	return `https://${value.replace(/^\/+/, "")}`;
}

function getEventAccent(type: string): { dot: string; text: string; label: string } {
	switch (type) {
		case "email_sent":
			return { dot: "bg-muted-foreground", text: "text-muted-foreground", label: "Sent" };
		case "email_delivered":
			return { dot: "bg-emerald-500", text: "text-emerald-600", label: "Delivered" };
		case "email_opened":
			return { dot: "bg-emerald-600", text: "text-emerald-700", label: "Opened" };
		case "email_clicked":
			return { dot: "bg-primary", text: "text-primary", label: "Clicked" };
		case "email_bounced":
			return { dot: "bg-destructive", text: "text-destructive", label: "Bounced" };
		case "email_complained":
			return { dot: "bg-orange-500", text: "text-orange-600", label: "Complained" };
		case "email_failed":
			return { dot: "bg-slate-600", text: "text-slate-600", label: "Unknown" };
		default:
			return { dot: "bg-muted-foreground", text: "text-muted-foreground", label: getEventTypeLabel(type) };
	}
}

function getBounceTypeLabel(data: unknown): string | null {
	if (!data || typeof data !== "object") return null;
	const payload = data as Record<string, unknown>;
	const bounce = payload.bounce;
	if (!bounce || typeof bounce !== "object") return null;
	const bounceType = (bounce as Record<string, unknown>).bounceType;
	if (typeof bounceType !== "string" || !bounceType.trim()) return null;
	if (bounceType.toLowerCase() === "permanent") return "Permanent bounce";
	if (bounceType.toLowerCase() === "transient") return "Transient bounce";
	return `${bounceType} bounce`;
}

function CardEmptyState({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl bg-muted/30 border-2 border-dashed border-border text-center min-h-[200px]">
			<div className="rounded-full bg-muted/80 dark:bg-muted/60 p-4 mb-4 ring-4 ring-muted/40 dark:ring-muted/30">
				<Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
			</div>
			<p className="text-sm font-semibold text-foreground">{title}</p>
			<p className="text-xs text-muted-foreground mt-1.5 max-w-[280px] leading-relaxed">{description}</p>
		</div>
	);
}

export default function AgencyNiscEmailMarketingEmailEventsPage() {
	const utils = trpc.useUtils();
	const [eventSearch, setEventSearch] = React.useState("");
	const [eventType, setEventType] = React.useState<
		"all" | "email_sent" | "email_delivered" | "email_opened" | "email_clicked" | "email_bounced" | "email_failed"
	>("all");
	const [eventsPage, setEventsPage] = React.useState(0);
	const [eventsPageSize, setEventsPageSize] = React.useState<10 | 30 | 50 | 100>(50);
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
	const [isDetailOpen, setIsDetailOpen] = React.useState(false);
	const [isRefreshing, setIsRefreshing] = React.useState(false);

	React.useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(eventSearch.trim()), 250);
		return () => clearTimeout(t);
	}, [eventSearch]);

	const eventsFilterKey = React.useMemo(
		() => `${eventType}::${debouncedSearch || ""}::${eventsPageSize}`,
		[eventType, debouncedSearch, eventsPageSize],
	);

	type EventsCacheEntry = {
		events: NonNullable<ReturnType<typeof trpc.niscEmailMarketing.emailEvents.list.useQuery>["data"]>["events"];
		total: number;
	};

	const [eventsPageCache, setEventsPageCache] = React.useState<Record<string, Record<number, EventsCacheEntry>>>({});
	const cachedCurrentPage = eventsPageCache[eventsFilterKey]?.[eventsPage];

	React.useEffect(() => {
		setEventsPage(0);
	}, [eventsFilterKey]);

	const { data: eventsData, isLoading, isFetching } = trpc.niscEmailMarketing.emailEvents.list.useQuery(
		{
			limit: eventsPageSize,
			offset: eventsPage * eventsPageSize,
			type: eventType === "all" ? undefined : eventType,
			recipientEmail: debouncedSearch || undefined,
		},
		{ enabled: !cachedCurrentPage },
	);

	React.useEffect(() => {
		if (!eventsData) return;
		setEventsPageCache((prev) => {
			const byFilter = prev[eventsFilterKey] ?? {};
			return {
				...prev,
				[eventsFilterKey]: {
					...byFilter,
					[eventsPage]: {
						events: eventsData.events,
						total: eventsData.total,
					},
				},
			};
		});
	}, [eventsData, eventsFilterKey, eventsPage]);

	const activeEventsData = cachedCurrentPage ?? eventsData;
	const eventsTotal = activeEventsData?.total ?? 0;
	const hasPrevPage = eventsPage > 0;
	const hasNextPage = (eventsPage + 1) * eventsPageSize < eventsTotal;
	const currentPageLabel = eventsTotal > 0 ? eventsPage + 1 : 0;
	const totalPages = eventsTotal > 0 ? Math.ceil(eventsTotal / eventsPageSize) : 0;
	const listIsLoading = (!cachedCurrentPage && isLoading) || (!cachedCurrentPage && isFetching);

	const opened = React.useMemo(
		() => activeEventsData?.events.filter((event) => event.type === "email_opened").length ?? 0,
		[activeEventsData],
	);
	const clicked = React.useMemo(
		() => activeEventsData?.events.filter((event) => event.type === "email_clicked").length ?? 0,
		[activeEventsData],
	);
	const { data: selectedEvent, isLoading: selectedEventLoading } = trpc.niscEmailMarketing.emailEvents.getById.useQuery(
		{ id: selectedEventId ?? "" },
		{ enabled: Boolean(selectedEventId) && isDetailOpen },
	);

	const handleRefresh = async () => {
		if (isRefreshing) return;
		setIsRefreshing(true);
		try {
			await utils.niscEmailMarketing.emailEvents.list.invalidate();
			setEventsPageCache({});
			setEventsPage(0);
		} finally {
			setIsRefreshing(false);
		}
	};

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex items-center justify-between gap-3">
					<div className="flex flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">Email Events</h1>
						<p className="text-xs text-muted-foreground">All email events for emails sent over nPanel's Email Marketing service.</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={handleRefresh}
						disabled={isRefreshing}
						className="gap-2"
					>
						<RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
						{isRefreshing ? "Refreshing..." : "Refresh"}
					</Button>
				</div>

				<div className="mt-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">User Interactions</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-3 mb-3">
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm text-muted-foreground">
										Total: {opened} opens, {clicked} clicks
									</p>
									<p className="text-xs text-muted-foreground">{eventsTotal.toLocaleString()} events</p>
								</div>
								<div className="flex flex-col sm:flex-row gap-2">
									<div className="flex-1 min-w-0">
										<Input
											value={eventSearch}
											onChange={(e) => setEventSearch(e.target.value)}
											placeholder="Search by recipient email (e.g. user@domain.com)"
											aria-label="Search events by recipient email"
											disabled={listIsLoading}
										/>
									</div>
									<Select value={eventType} onValueChange={(v) => setEventType(v as any)} disabled={listIsLoading}>
										<SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter events by type">
											<SelectValue placeholder="Filter" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All events</SelectItem>
											<SelectItem value="email_sent">Sent</SelectItem>
											<SelectItem value="email_delivered">Delivered</SelectItem>
											<SelectItem value="email_opened">Opened</SelectItem>
											<SelectItem value="email_clicked">Clicked</SelectItem>
											<SelectItem value="email_bounced">Bounced</SelectItem>
											<SelectItem value="email_failed">Failed</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{listIsLoading ? (
								<div className="space-y-2">
									<Skeleton className="h-10 w-full" />
									{[1, 2, 3, 4, 5].map((i) => (
										<Skeleton key={i} className="h-10 w-full" />
									))}
								</div>
							) : activeEventsData?.events.length ? (
								<ScrollArea className="h-[420px] rounded-md border border-border">
									<ul className="divide-y divide-border text-sm p-1">
										{activeEventsData.events.map((ev) => (
											<li key={ev.id} className="py-2.5 first:pt-0 px-2">
												<button
													type="button"
													className="w-full text-left rounded-md p-1.5 -m-1.5 hover:bg-muted/50 cursor-pointer"
													onClick={() => {
														setSelectedEventId(ev.id);
														setIsDetailOpen(true);
													}}
												>
													<div className="flex items-center justify-between gap-2">
														{(() => {
															const accent = getEventAccent(ev.type);
															return (
																<span className={cn("font-medium inline-flex items-center gap-2", accent.text)}>
																	<span className={cn("h-2 w-2 shrink-0 rounded-full", accent.dot)} aria-hidden />
																	{accent.label}
																</span>
															);
														})()}
														<span className="text-muted-foreground tabular-nums shrink-0">
															{format(new Date(ev.eventCreatedAt), "MMM d, h:mm a")}
														</span>
													</div>
													<p className="text-xs text-muted-foreground mt-0.5 truncate">
														{ev.recipientEmail ?? "Unknown recipient"}
													</p>
													{ev.type === "email_bounced" && getBounceTypeLabel(ev.data) && (
														<p className="text-xs font-semibold text-destructive mt-1">
															{getBounceTypeLabel(ev.data)}
														</p>
													)}
													{ev.type === "email_clicked" && (
														<p className="text-xs text-muted-foreground mt-1 truncate">
															{ev.link ? (
																<a
																	href={normalizeExternalHref(ev.link)}
																	target="_blank"
																	rel="noopener noreferrer"
																	onClick={(e) => e.stopPropagation()}
																	className="inline-flex items-center gap-1.5 text-primary hover:underline"
																	title={ev.link}
																>
																	<span className="truncate">{ev.link}</span>
																	<ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
																</a>
															) : (
																<span>Link: </span>
															)}
														</p>
													)}
												</button>
											</li>
										))}
									</ul>
								</ScrollArea>
							) : (
								<CardEmptyState
									title={debouncedSearch ? "No matching events" : "No interactions yet"}
									description={
										debouncedSearch
											? "Try a different email address or clear the filters."
											: "Email events will appear here as recipients engage with campaign emails."
									}
								/>
							)}

							<div className="mt-3 flex items-center justify-between gap-3">
								<p className="text-xs text-muted-foreground">
									Page {currentPageLabel} of {totalPages}
								</p>
								<div className="flex items-center gap-2">
									<Select
										value={String(eventsPageSize)}
										onValueChange={(v) => setEventsPageSize(Number(v) as 10 | 30 | 50 | 100)}
										disabled={listIsLoading}
									>
										<SelectTrigger className="w-[100px]" aria-label="Events per page">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="10">10</SelectItem>
											<SelectItem value="30">30</SelectItem>
											<SelectItem value="50">50</SelectItem>
											<SelectItem value="100">100</SelectItem>
										</SelectContent>
									</Select>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setEventsPage((p) => Math.max(0, p - 1))}
										disabled={!hasPrevPage || listIsLoading}
									>
										<ChevronLeft className="h-4 w-4 mr-1" />
										Previous
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setEventsPage((p) => p + 1)}
										disabled={!hasNextPage || listIsLoading}
									>
										Next
										<ChevronRightIcon className="h-4 w-4 ml-1" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
			<Dialog
				open={isDetailOpen}
				onOpenChange={(open) => {
					setIsDetailOpen(open);
					if (!open) setSelectedEventId(null);
				}}
			>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Email Event Detail</DialogTitle>
						<DialogDescription>
							Detailed view for the selected email event, including sender details, timestamp, and preview.
						</DialogDescription>
					</DialogHeader>
					{selectedEventLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-4 w-1/2" />
							<Skeleton className="h-4 w-2/3" />
							<Skeleton className="h-[320px] w-full" />
						</div>
					) : selectedEvent ? (
						<div className="space-y-4">
							<div className="space-y-3 text-sm">
								<div className="pb-2 border-b border-border/60">
									<p className="text-xs text-muted-foreground">From</p>
									<p className="font-medium">
										{selectedEvent.fromName || "N/A"} {selectedEvent.fromEmail ? `<${selectedEvent.fromEmail}>` : ""}
									</p>
								</div>
								<div className="pb-2 border-b border-border/60">
									<p className="text-xs text-muted-foreground">Time</p>
									<p className="font-medium">{format(new Date(selectedEvent.eventCreatedAt), "PPP p")}</p>
								</div>
								<div className="pb-2 border-b border-border/60">
									<p className="text-xs text-muted-foreground">Event</p>
									{(() => {
										const accent = getEventAccent(selectedEvent.type);
										const bounceType = selectedEvent.type === "email_bounced" ? getBounceTypeLabel(selectedEvent.data) : null;
										return (
											<div className="inline-flex items-center gap-2">
												{selectedEvent.type === "email_clicked" ? (
													<MousePointerClick className="h-4 w-4 text-primary" aria-hidden />
												) : (
													<span className={cn("h-2 w-2 rounded-full", accent.dot)} aria-hidden />
												)}
												<p className={cn("font-semibold", accent.text)}>
													{accent.label}
													{bounceType ? ` (${bounceType})` : ""}
												</p>
											</div>
										);
									})()}
								</div>
								<div className="pb-2 border-b border-border/60">
									<p className="text-xs text-muted-foreground">Recipient</p>
									<p className="font-medium">{selectedEvent.recipientEmail ?? "Unknown recipient"}</p>
								</div>
							</div>
							{selectedEvent.subject && (
								<div>
									<p className="text-xs text-muted-foreground">Subject</p>
									<p className="font-medium">{selectedEvent.subject}</p>
								</div>
							)}
							<div>
								<p className="text-xs text-muted-foreground mb-2">Email preview</p>
								{selectedEvent.htmlContent ? (
									<div className="rounded-lg border border-border overflow-hidden bg-background">
										<iframe
											title="Email preview"
											className="w-full h-[420px] bg-white"
											sandbox=""
											srcDoc={selectedEvent.htmlContent}
										/>
									</div>
								) : selectedEvent.textContent ? (
									<div className="rounded-lg border border-border bg-muted/20 p-4 whitespace-pre-wrap text-sm leading-relaxed">
										{selectedEvent.textContent}
									</div>
								) : (
									<div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
										No email content available for this event.
									</div>
								)}
							</div>
						</div>
					) : (
						<div className="text-sm text-muted-foreground">Event details could not be loaded.</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

