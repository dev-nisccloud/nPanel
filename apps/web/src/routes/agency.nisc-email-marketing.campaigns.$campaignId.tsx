"use client";

import * as React from "react";
import { useParams, useNavigate } from "react-router";
import { Link } from "react-router";
import { toast } from "@/components/ui/sonner";
import {
	ArrowLeft,
	Mail,
	Code2,
	MoreHorizontal,
	CheckCircle2,
	Clock,
	XCircle,
	ExternalLink,
	Trash2,
	ChevronRight,
	Eye,
	FileText,
	BarChart2,
	Info,
	MousePointerClick,
	Inbox,
	RefreshCw,
	Send,
	Ban,
	ChevronLeft,
	ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { format } from "date-fns";
import { DownloadNiscEmReportButton } from "./agency.nisc-email-marketing/campaigns/_components/report/download-button";

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
	// absolute URLs or special schemes should be left as-is
	if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return value; // e.g. https:, mailto:, tel:
	if (value.startsWith("//")) return `https:${value}`;
	// otherwise treat as a hostname/path and make it absolute so it doesn't become app-relative
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

function getStatusBadge(status: string) {
	switch (status) {
		case "COMPLETED":
			return (
				<Badge
					variant="outline"
					className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
				>
					<CheckCircle2 className="mr-1 h-3 w-3" />
					Sent
				</Badge>
			);
		case "FAILED":
			return (
				<Badge
					variant="outline"
					className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800"
				>
					<XCircle className="mr-1 h-3 w-3" />
					Failed
				</Badge>
			);
		case "SCHEDULED":
			return (
				<Badge
					variant="outline"
					className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800"
				>
					<Clock className="mr-1 h-3 w-3" />
					Scheduled
				</Badge>
			);
		case "DRAFT":
			return (
				<Badge variant="outline" className="bg-muted text-muted-foreground">
					Draft
				</Badge>
			);
		case "CANCELLED":
			return (
				<Badge
					variant="outline"
					className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800"
				>
					<Ban className="mr-1 h-3 w-3" />
					Cancelled
				</Badge>
			);
		default:
			return <Badge variant="outline">{status}</Badge>;
	}
}

function CardEmptyState({
	icon: Icon,
	title,
	description,
	className,
}: {
	icon: React.ElementType;
	title: string;
	description: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-12 px-6 rounded-xl bg-muted/30 border-2 border-dashed border-border text-center min-h-[200px]",
				className
			)}
		>
			<div className="rounded-full bg-muted/80 dark:bg-muted/60 p-4 mb-4 ring-4 ring-muted/40 dark:ring-muted/30">
				<Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
			</div>
			<p className="text-sm font-semibold text-foreground">{title}</p>
			<p className="text-xs text-muted-foreground mt-1.5 max-w-[280px] leading-relaxed">{description}</p>
		</div>
	);
}

export default function CampaignDetailPage() {
	const params = useParams();
	const navigate = useNavigate();
	const campaignId = params?.campaignId as string | undefined;

	const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [showCancelDialog, setShowCancelDialog] = React.useState(false);
	const [isCancelling, setIsCancelling] = React.useState(false);

	const utils = trpc.useUtils();
	const { data: campaign, isLoading, error, refetch: refetchCampaign } = trpc.niscEmailMarketing.campaigns.getById.useQuery(
		{ id: campaignId ?? "" },
		{ enabled: Boolean(campaignId) }
	);

	const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = trpc.niscEmailMarketing.emailEvents.getCampaignSummary.useQuery(
		{ campaignId: campaignId ?? "" },
		{ enabled: Boolean(campaignId) }
	);

	const [eventSearch, setEventSearch] = React.useState("");
	const [eventType, setEventType] = React.useState<
		"all" | "email_sent" | "email_delivered" | "email_opened" | "email_clicked" | "email_bounced" | "email_failed"
	>("all");
	const [eventsPage, setEventsPage] = React.useState(0);
	const [eventsPageSize, setEventsPageSize] = React.useState<10 | 30 | 50 | 100>(50);
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
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
		// Every filter/search combination starts from page 1.
		setEventsPage(0);
	}, [eventsFilterKey]);

	const {
		data: recentEventsData,
		isLoading: recentEventsLoading,
		isFetching: recentEventsFetching,
		refetch: refetchRecentEvents,
	} = trpc.niscEmailMarketing.emailEvents.list.useQuery(
		{
			campaignId: campaignId ?? "",
			limit: eventsPageSize,
			offset: eventsPage * eventsPageSize,
			type: eventType === "all" ? undefined : eventType,
			recipientEmail: debouncedSearch || undefined,
		},
		{
			enabled: Boolean(campaignId) && !cachedCurrentPage,
		}
	);

	React.useEffect(() => {
		if (!recentEventsData) return;
		setEventsPageCache((prev) => {
			const byFilter = prev[eventsFilterKey] ?? {};
			return {
				...prev,
				[eventsFilterKey]: {
					...byFilter,
					[eventsPage]: {
						events: recentEventsData.events,
						total: recentEventsData.total,
					},
				},
			};
		});
	}, [recentEventsData, eventsFilterKey, eventsPage]);

	const activeEventsData = cachedCurrentPage ?? recentEventsData;
	const eventsTotal = activeEventsData?.total ?? 0;
	const hasPrevPage = eventsPage > 0;
	const hasNextPage = (eventsPage + 1) * eventsPageSize < eventsTotal;
	const currentPageLabel = eventsTotal > 0 ? eventsPage + 1 : 0;
	const totalPages = eventsTotal > 0 ? Math.ceil(eventsTotal / eventsPageSize) : 0;

	const { data: topClickedLinks, isLoading: topClickedLinksLoading, refetch: refetchTopClickedLinks } = trpc.niscEmailMarketing.emailEvents.getTopClickedLinks.useQuery(
		{ campaignId: campaignId ?? "", limit: 10 },
		{ enabled: Boolean(campaignId) }
	);

	const { data: reportData, isLoading: reportLoading } = trpc.niscEmailMarketing.emailEvents.getCampaignReport.useQuery(
		{ campaignId: campaignId ?? "" },
		{ enabled: Boolean(campaignId) }
	);

	const { data: bounceBreakdown } = trpc.niscEmailMarketing.emailEvents.getBounceBreakdown.useQuery(
		{ campaignId: campaignId ?? "" },
		{ enabled: Boolean(campaignId) }
	);

	const [isRefreshing, setIsRefreshing] = React.useState(false);
	const handleRefresh = async () => {
		if (!campaignId || isRefreshing) return;
		setIsRefreshing(true);
		toast.loading("Refreshing…", { id: "campaign-refresh" });
		try {
			// Invalidate cache so refetch returns fresh data from server
			await Promise.all([
				utils.niscEmailMarketing.campaigns.getById.invalidate({ id: campaignId }),
				utils.niscEmailMarketing.emailEvents.getCampaignSummary.invalidate({ campaignId }),
				utils.niscEmailMarketing.emailEvents.list.invalidate(),
				utils.niscEmailMarketing.emailEvents.getTopClickedLinks.invalidate({ campaignId, limit: 10 }),
			]);
			setEventsPageCache({});
			setEventsPage(0);
			await Promise.all([
				refetchCampaign(),
				refetchSummary(),
				refetchRecentEvents(),
				refetchTopClickedLinks(),
			]);
			toast.success("Data refreshed", { id: "campaign-refresh" });
		} catch {
			toast.error("Failed to refresh", { id: "campaign-refresh" });
		} finally {
			setIsRefreshing(false);
		}
	};

	const deleteMutation = trpc.niscEmailMarketing.campaigns.delete.useMutation({
		onSuccess: () => {
			toast.success("Campaign deleted successfully", {
				description: campaign ? `Campaign ${campaign.name} has been deleted.` : undefined,
			});
			utils.niscEmailMarketing.campaigns.list.invalidate();
			setShowDeleteDialog(false);
			setIsDeleting(false);
			navigate("/agency/nisc-email-marketing/campaigns");
		},
		onError: (e: { message: string }) => {
			toast.error("Failed to delete campaign", { description: e.message });
			setIsDeleting(false);
		},
	});

	const cancelMutation = trpc.niscEmailMarketing.campaigns.cancel.useMutation({
		onSuccess: (data) => {
			toast.success("Scheduled campaign cancelled", {
				description: data?.cancelledAt ? `Cancelled at ${data.cancelledAt}.` : undefined,
			});
			utils.niscEmailMarketing.campaigns.list.invalidate();
			utils.niscEmailMarketing.campaigns.getById.invalidate({ id: campaignId ?? "" });
			setShowCancelDialog(false);
			setIsCancelling(false);
			refetchCampaign();
		},
		onError: (e: { message: string }) => {
			toast.error("Failed to cancel campaign", { description: e.message });
			setIsCancelling(false);
		},
	});

	const handleDelete = async () => {
		if (!campaignId) return;
		setIsDeleting(true);
		try {
			await deleteMutation.mutateAsync({ id: campaignId });
		} catch {
			// Error handled in mutation
		}
	};

	// Refetch from DB before opening cancel dialog to avoid acting on stale data
	const handleCancelScheduledClick = async () => {
		if (!campaignId) return;
		try {
			const fresh = await utils.niscEmailMarketing.campaigns.getById.fetch({ id: campaignId });
			if (fresh.status !== "SCHEDULED") {
				toast.error("Campaign is no longer scheduled", {
					description:
						fresh.status === "COMPLETED"
							? "It has already been sent."
							: fresh.status === "CANCELLED"
								? "It has already been cancelled."
								: "You cannot cancel this campaign.",
				});
				refetchCampaign();
				return;
			}
			setShowCancelDialog(true);
		} catch {
			toast.error("Could not load campaign status. Please try again.");
		}
	};

	const handleConfirmCancel = async () => {
		if (!campaignId) return;
		setIsCancelling(true);
		try {
			await cancelMutation.mutateAsync({ id: campaignId });
		} catch {
			// Error handled in mutation
		}
	};

	// Metrics from aggregated summary (no client-side aggregation)
	const totalRecipients = summary?.totalRecipients ?? 0;
	const delivered = summary?.delivered ?? 0;
	const bounced = summary?.bounced ?? 0;
	const opened = summary?.opened ?? 0;
	const openedTotal = summary?.openedTotal ?? 0;
	const clicked = summary?.clicked ?? 0;
	const clickedTotal = summary?.clickedTotal ?? 0;
	const unsubscribed = summary?.unsubscribed ?? 0;
	const complained = summary?.complained ?? 0;

	const deliverabilityPct = totalRecipients > 0 ? Math.round((delivered / totalRecipients) * 100) : 0;
	const engagementDenom = delivered > 0 ? delivered : totalRecipients || 1;
	const engagementPct = Math.round((Math.max(opened, clicked) / engagementDenom) * 100);
	const optOutPct = totalRecipients > 0 ? Math.round(((unsubscribed + complained) / totalRecipients) * 100) : 0;

	const isAwaitingSend = campaign?.status === "SCHEDULED" || campaign?.status === "DRAFT";
	const hasNoAnalytics = totalRecipients === 0;

	if (!campaignId) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<p className="text-muted-foreground">Invalid campaign.</p>
					<Button variant="link" asChild className="mt-2 px-0">
						<Link to="/agency/nisc-email-marketing/campaigns">Back to campaigns</Link>
					</Button>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-8 w-64" />
					</div>
					<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-32 rounded-lg" />
						))}
					</div>
					<div className="mt-6">
						<Skeleton className="h-64 rounded-lg" />
					</div>
				</div>
			</div>
		);
	}

	if (error || !campaign) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<p className="text-muted-foreground">{error?.message ?? "Campaign not found."}</p>
					<Button variant="link" asChild className="mt-2 px-0">
						<Link to="/agency/nisc-email-marketing/campaigns">Back to campaigns</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				{/* Header: Back button, title, status, actions (same pattern as hosting/wordpress detail) */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Link to="/agency/nisc-email-marketing/campaigns">
							<Button variant="ghost" size="sm">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back
							</Button>
						</Link>
						<div>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Mail className="h-4 w-4" />
								<span>Email Campaign</span>
							</div>
							<h1 className="text-2xl font-semibold tracking-tight mt-0.5">{campaign.name}</h1>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{getStatusBadge(campaign.status)}
						{summary && bounceBreakdown && topClickedLinks && reportData ? (
							<DownloadNiscEmReportButton
								campaign={reportData.campaign}
								summary={summary}
								bounceBreakdown={bounceBreakdown}
								topClickedLinks={topClickedLinks}
								report={reportData}
							/>
						) : (
							<Button
								variant="default"
								size="sm"
								disabled
								className="rounded-full h-8 gap-2 text-primary-foreground"
							>
								{reportLoading ? <Spinner className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
								Export Report
							</Button>
						)}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">More options</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem
									onClick={handleRefresh}
									disabled={isRefreshing}
								>
									<RefreshCw className={`mr-2 h-4 w-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} />
									{isRefreshing ? "Refreshing…" : "Refresh"}
								</DropdownMenuItem>
								{campaign.status === "SCHEDULED" && (
									<DropdownMenuItem
										onClick={handleCancelScheduledClick}
										disabled={isCancelling}
									>
										<Ban className="mr-2 h-4 w-4 shrink-0" />
										Cancel scheduled
									</DropdownMenuItem>
								)}
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => setShowDeleteDialog(true)}
									disabled={isDeleting}
									className="text-destructive focus:text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete campaign
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Delete confirmation */}
				<AlertDialog
					open={showDeleteDialog}
					onOpenChange={(open) => {
						if (!isDeleting) setShowDeleteDialog(open);
					}}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete Campaign</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to delete campaign &quot;{campaign.name}&quot;? This action cannot be undone and will permanently delete the campaign and all associated data.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleDelete}
								disabled={isDeleting}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								{isDeleting ? (
									<>
										<Spinner size={14} className="mr-2 shrink-0" />
										Deleting...
									</>
								) : (
									"Delete campaign"
								)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Cancel scheduled confirmation */}
				<AlertDialog
					open={showCancelDialog}
					onOpenChange={(open) => !isCancelling && setShowCancelDialog(open)}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Cancel scheduled campaign</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to cancel the scheduled send for &quot;{campaign.name}&quot;? The campaign will not be sent at the scheduled time. You can schedule it again later from this page.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={isCancelling}>Keep scheduled</AlertDialogCancel>
							<AlertDialogAction onClick={handleConfirmCancel} disabled={isCancelling}>
								{isCancelling ? (
									<>
										<Spinner size={14} className="mr-2 shrink-0" />
										Cancelling…
									</>
								) : (
									"Cancel scheduled send"
								)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Analytics —skeleton when loading; empty state when no data (e.g. scheduled/draft); cards when data */}
				<div className="mt-6">
					{summaryLoading ? (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Card className="overflow-hidden">
								<CardHeader className="pb-1">
									<Skeleton className="h-3 w-24" />
								</CardHeader>
								<CardContent className="pt-0">
									<Skeleton className="h-8 w-16 mt-1" />
									<div className="mt-3 space-y-2">
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-full" />
									</div>
								</CardContent>
							</Card>
							<Card className="overflow-hidden">
								<CardHeader className="pb-1">
									<Skeleton className="h-3 w-24" />
								</CardHeader>
								<CardContent className="pt-0">
									<Skeleton className="h-8 w-16 mt-1" />
									<div className="mt-3 space-y-2">
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-full" />
									</div>
								</CardContent>
							</Card>
							<Card className="overflow-hidden">
								<CardHeader className="pb-1">
									<Skeleton className="h-3 w-24" />
								</CardHeader>
								<CardContent className="pt-0">
									<Skeleton className="h-8 w-16 mt-1" />
									<div className="mt-3 space-y-2">
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-full" />
									</div>
								</CardContent>
							</Card>
						</div>
					) : hasNoAnalytics ? (
						<Card className="overflow-hidden">
							<CardContent className="p-0">
								<CardEmptyState
									icon={isAwaitingSend ? Send : BarChart2}
									title={isAwaitingSend ? "No analytics yet" : "No data yet"}
									description={
										isAwaitingSend
											? "This campaign hasn't been sent yet. Deliverability, engagement, and opt-out metrics will appear here once it's sent and recipients interact."
											: "There are no events for this campaign yet. Metrics will show here once delivery and engagement data is available."
									}
									className="min-h-[220px] rounded-none border-0"
								/>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
							<Card className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md bg-gradient-to-br from-muted/20 to-background">
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-2 min-w-0">
											<div className="rounded-md border border-primary/15 bg-primary/10 p-1.5">
												<Mail className="h-4 w-4 text-primary" aria-hidden />
											</div>
											<CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
												Deliverability
											</CardTitle>
										</div>
									</div>
								</CardHeader>
								<CardContent className="pt-0">
									<div className="flex items-end justify-between gap-3">
										<div>
											<p className="text-2xl font-bold tracking-tight text-foreground">{deliverabilityPct}%</p>
											<p className="text-xs text-muted-foreground mt-1">Delivered rate</p>
										</div>
									</div>
									<div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full bg-primary"
											style={{ width: `${Math.min(100, Math.max(0, deliverabilityPct))}%` }}
										/>
									</div>
									<ul className="mt-3 divide-y divide-border/70 text-sm border border-border/50 rounded-lg overflow-hidden bg-background/30">
										<li className="flex items-center justify-between gap-3 py-2.5 px-3 first:pt-0 hover:bg-muted/30">
											<div className="flex items-center gap-2 min-w-0">
												<span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
												<span className="text-foreground">Requests</span>
											</div>
											<span className="shrink-0 tabular-nums text-muted-foreground">
												{totalRecipients.toLocaleString()}
											</span>
										</li>
										<li className="flex items-center justify-between gap-3 py-2.5 px-3 first:pt-0 hover:bg-muted/30">
											<div className="flex items-center gap-2 min-w-0">
												<span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
												<span className="text-foreground">Delivered</span>
											</div>
											<span className="shrink-0 tabular-nums text-muted-foreground">
												{delivered.toLocaleString()} {totalRecipients > 0 ? `${Math.round((delivered / totalRecipients) * 100)}%` : "0%"}
											</span>
										</li>
										<li className="flex flex-col gap-0.5 py-2.5 px-3 hover:bg-muted/30">
											<div className="flex items-center justify-between gap-3">
												<div className="flex items-center gap-2 min-w-0">
													<span className="h-2 w-2 shrink-0 rounded-full bg-destructive" aria-hidden />
													<span className="text-foreground">Bounced</span>
												</div>
												<span className="shrink-0 tabular-nums text-muted-foreground">
													{bounced.toLocaleString()} {totalRecipients > 0 ? `${Math.round((bounced / totalRecipients) * 100)}%` : "0%"}
												</span>
											</div>
											{(() => {
												const byType = bounceBreakdown?.byType ?? {};
												const transient = byType.Transient ?? byType.transient ?? 0;
												const permanent = byType.Permanent ?? byType.permanent ?? 0;
												const unknown =
													(byType.Unknown ?? byType.unknown ?? 0) +
													(byType[""] ?? 0) +
													(Object.prototype.hasOwnProperty.call(byType, "null") ? (byType as any).null : 0);

												const parts = [
													transient > 0 ? `Transient: ${transient.toLocaleString()}` : null,
													permanent > 0 ? `Permanent: ${permanent.toLocaleString()}` : null,
													unknown > 0 ? `Other: ${unknown.toLocaleString()}` : null,
												].filter(Boolean);

												if (parts.length === 0) return null;
												return (
													<p className="text-xs text-muted-foreground pl-4">
														{parts.join(" • ")}
													</p>
												);
											})()}
										</li>
									</ul>
								</CardContent>
							</Card>
							<Card className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md bg-gradient-to-br from-muted/20 to-background">
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-1.5 min-w-0">
											<CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
												Engagement
											</CardTitle>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<button
														type="button"
														className="inline-flex text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
														aria-label="Engagement metrics explanation"
													>
														<Info className="h-3.5 w-3.5 shrink-0" />
													</button>
												</TooltipTrigger>
												<TooltipContent side="top" className="max-w-xs text-sm">
													<p className="font-medium mb-1">How engagement is calculated</p>
													<p>
														Opened and Clicked show <strong>unique recipients</strong> (one count per person), so rates never exceed 100%. &quot;Total opens&quot; and &quot;Total clicks&quot; are total event counts   e.g. one person can open multiple times or click multiple links, so those numbers can be higher than unique.
													</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										</div>
										<div className="rounded-md border border-primary/15 bg-chart-1/10 p-1.5">
											<Eye className="h-4 w-4 text-chart-1" aria-hidden />
										</div>
									</div>
								</CardHeader>
								<CardContent className="pt-0">
									<div className="flex items-end justify-between gap-3">
										<div>
											<p className="text-2xl font-bold tracking-tight text-foreground">{engagementPct}%</p>
											<p className="text-xs text-muted-foreground mt-1">Engagement rate</p>
										</div>
									</div>
									<div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full bg-chart-1"
											style={{ width: `${Math.min(100, Math.max(0, engagementPct))}%` }}
										/>
									</div>
									<ul className="mt-3 divide-y divide-border/70 text-sm border border-border/50 rounded-lg overflow-hidden bg-background/30">
										<li className="flex flex-col gap-0.5 py-2.5 px-3 first:pt-0 hover:bg-muted/30">
											<div className="flex items-center justify-between gap-3">
												<div className="flex items-center gap-2 min-w-0">
													<span className="h-2 w-2 shrink-0 rounded-full bg-chart-1" aria-hidden />
													<span className="text-foreground">Opened</span>
												</div>
												<span className="shrink-0 tabular-nums text-muted-foreground">
													{opened.toLocaleString()} {engagementDenom > 0 ? `${Math.round((opened / engagementDenom) * 100)}%` : "0%"}
												</span>
											</div>
											{openedTotal > 0 && (
												<p className="text-xs text-muted-foreground pl-4">
													Total opens: {openedTotal.toLocaleString()}
												</p>
											)}
										</li>
										<li className="flex flex-col gap-0.5 py-2.5 px-3 hover:bg-muted/30">
											<div className="flex items-center justify-between gap-3">
												<div className="flex items-center gap-2 min-w-0">
													<span className="h-2 w-2 shrink-0 rounded-full bg-chart-2" aria-hidden />
													<span className="text-foreground">Clicked</span>
												</div>
												<span className="shrink-0 tabular-nums text-muted-foreground">
													{clicked.toLocaleString()} {engagementDenom > 0 ? `${Math.round((clicked / engagementDenom) * 100)}%` : "0%"}
												</span>
											</div>
											{clickedTotal > 0 && (
												<p className="text-xs text-muted-foreground pl-4">
													Total clicks: {clickedTotal.toLocaleString()}
												</p>
											)}
										</li>
									</ul>
								</CardContent>
							</Card>
							<Card className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md bg-gradient-to-br from-muted/20 to-background">
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-2 min-w-0">
											<div className="rounded-md border border-destructive/15 bg-destructive/10 p-1.5">
												<Ban className="h-4 w-4 text-destructive" aria-hidden />
											</div>
											<CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
												Opt-Out
											</CardTitle>
										</div>
									</div>
								</CardHeader>
								<CardContent className="pt-0">
									<div className="flex items-end justify-between gap-3">
										<div>
											<p className="text-2xl font-bold tracking-tight text-foreground">{optOutPct}%</p>
											<p className="text-xs text-muted-foreground mt-1">Opt-out rate</p>
										</div>
									</div>
									<div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full bg-destructive"
											style={{ width: `${Math.min(100, Math.max(0, optOutPct))}%` }}
										/>
									</div>
									<ul className="mt-3 divide-y divide-border/70 text-sm border border-border/50 rounded-lg overflow-hidden bg-background/30">
										<li className="flex items-center justify-between gap-3 py-2.5 px-3 first:pt-0 hover:bg-muted/30">
											<div className="flex items-center gap-2 min-w-0">
												<span className="h-2 w-2 shrink-0 rounded-full bg-destructive" aria-hidden />
												<span className="text-foreground">Unsubscribed</span>
											</div>
											<span className="shrink-0 tabular-nums text-muted-foreground">
												{unsubscribed.toLocaleString()} {totalRecipients > 0 ? `${Math.round((unsubscribed / totalRecipients) * 100)}%` : "0%"}
											</span>
										</li>
										<li className="flex items-center justify-between gap-3 py-2.5 px-3 hover:bg-muted/30">
											<div className="flex items-center gap-2 min-w-0">
												<span className="h-2 w-2 shrink-0 rounded-full bg-chart-3" aria-hidden />
												<span className="text-foreground">Complained</span>
											</div>
											<span className="shrink-0 tabular-nums text-muted-foreground">
												{complained.toLocaleString()} {totalRecipients > 0 ? `${Math.round((complained / totalRecipients) * 100)}%` : "0%"}
											</span>
										</li>
									</ul>
								</CardContent>
							</Card>
						</div>
					)}
				</div>

				{/* User Interactions (summary + recent feed) & Top Clicked Links */}
				<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">User Interactions</CardTitle>
						</CardHeader>
						<CardContent>
							{(() => {
								const listIsLoading =
									(!cachedCurrentPage && recentEventsLoading) ||
									(!cachedCurrentPage && recentEventsFetching);
								return (
									<>
										<div className="flex flex-col gap-3 mb-3">
											<div className="flex items-center justify-between gap-3">
												<p className="text-sm text-muted-foreground">
													Total: {opened} opens, {clicked} clicks
												</p>
												<p className="text-xs text-muted-foreground">
													{eventsTotal.toLocaleString()} events
												</p>
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
												<Select
													value={eventType}
													onValueChange={(v) => setEventType(v as any)}
													disabled={listIsLoading}
												>
													<SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter events by type">
														<SelectValue placeholder="Filter" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="all">
															<span className="inline-flex items-center gap-2">
																<span className="h-2 w-2 rounded-full bg-muted-foreground" aria-hidden />
																All events
															</span>
														</SelectItem>
														<SelectItem value="email_sent">
															<span className="inline-flex items-center gap-2">
																<span className="h-2 w-2 rounded-full bg-muted-foreground" aria-hidden />
																Sent
															</span>
														</SelectItem>
														<SelectItem value="email_delivered">
															<span className="inline-flex items-center gap-2">
																<span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
																Delivered
															</span>
														</SelectItem>
														<SelectItem value="email_opened">
															<span className="inline-flex items-center gap-2">
																<span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden />
																Opened
															</span>
														</SelectItem>
														<SelectItem value="email_clicked">
															<span className="inline-flex items-center gap-2">
																<span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
																Clicked
															</span>
														</SelectItem>
														<SelectItem value="email_bounced">
															<span className="inline-flex items-center gap-2">
																<span className="h-2 w-2 rounded-full bg-destructive" aria-hidden />
																Bounced
															</span>
														</SelectItem>
														<SelectItem value="email_failed">
															<span className="inline-flex items-center gap-2">
																<span className="h-2 w-2 rounded-full bg-destructive" aria-hidden />
																Failed
															</span>
														</SelectItem>
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
											<ScrollArea className="h-[280px] rounded-md border border-border">
												<ul className="divide-y divide-border text-sm p-1">
													{activeEventsData.events.map((ev) => (
														<li key={ev.id} className="py-2.5 first:pt-0 px-2">
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
															{ev.type === "email_clicked" && (
																<p className="text-xs text-muted-foreground mt-1 truncate">
																	{ev.link ? (
																		<a
																			href={normalizeExternalHref(ev.link)}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="inline-flex items-center gap-1.5 text-primary hover:underline"
																			title={ev.link}
																		>
																			<span className="truncate">{ev.link}</span>
																			<ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
																		</a>
																	) : (
																		<span>Link:  </span>
																	)}
																</p>
															)}
														</li>
													))}
												</ul>
											</ScrollArea>
										) : (
											<CardEmptyState
												icon={isAwaitingSend ? Clock : Inbox}
												title={isAwaitingSend ? "Campaign not sent yet" : debouncedSearch ? "No matching events" : "No interactions yet"}
												description={
													isAwaitingSend
														? "Opens and clicks will appear here once the campaign is sent and recipients start engaging."
														: debouncedSearch
															? "Try a different email address or clear the filters."
															: "Opens and clicks will appear here once recipients engage with the email."
												}
												className="min-h-[200px]"
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
									</>
								);
							})()}
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Top Clicked Links</CardTitle>
						</CardHeader>
						<CardContent>
							{topClickedLinksLoading ? (
								<div className="space-y-2">
									{[1, 2, 3, 4, 5].map((i) => (
										<Skeleton key={i} className="h-8 w-full" />
									))}
								</div>
							) : topClickedLinks && topClickedLinks.length > 0 ? (
								<ScrollArea className="h-[280px] rounded-md border border-border">
									<ul className="divide-y divide-border text-sm p-1">
										{topClickedLinks.map((item, i) => (
											<li key={`${item.url}-${i}`} className="py-2.5 first:pt-0 px-2 flex items-center justify-between gap-3">
												<a
													href={normalizeExternalHref(item.url)}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1.5 text-primary hover:underline truncate min-w-0"
													title={item.url}
												>
													<span className="truncate">
														{item.url.length > 50 ? `${item.url.slice(0, 50)}…` : item.url}
													</span>
													<ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
												</a>
												<span className="text-muted-foreground tabular-nums shrink-0">
													{item.clicks} {item.clicks === 1 ? "click" : "clicks"}
												</span>
											</li>
										))}
									</ul>
								</ScrollArea>
							) : (
								<CardEmptyState
									icon={isAwaitingSend ? Clock : MousePointerClick}
									title={isAwaitingSend ? "Campaign not sent yet" : "No clicks yet"}
									description={
										isAwaitingSend
											? "Clicked links will appear here once the campaign is sent and recipients click through."
											: "Links clicked by recipients will show here once they engage with the email."
									}
									className="min-h-[200px]"
								/>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Email content */}
				<div className="mt-6">
					<Card className="overflow-hidden">
						<CardHeader>
							<CardTitle className="text-base">Email content</CardTitle>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="preview" className="w-full">
								<TabsList>
									<TabsTrigger value="preview">Preview</TabsTrigger>
									<TabsTrigger value="text">Plain text</TabsTrigger>
									<TabsTrigger value="html">HTML</TabsTrigger>
								</TabsList>
								<TabsContent value="preview" className="mt-4">
									{campaign.htmlContent ? (
										<div className="rounded-lg border border-border overflow-hidden bg-background">
											<iframe
												title="Email preview"
												className="w-full h-[520px] bg-white"
												sandbox=""
												srcDoc={campaign.htmlContent}
											/>
										</div>
									) : (
										<CardEmptyState
											icon={Eye}
											title="No HTML content"
											description="This campaign doesn’t have an HTML version."
											className="min-h-[220px]"
										/>
									)}
								</TabsContent>
								<TabsContent value="text" className="mt-4">
									{campaign.textContent ? (
										<div className="rounded-lg border border-border bg-muted/20 p-4 whitespace-pre-wrap text-sm leading-relaxed">
											{campaign.textContent}
										</div>
									) : (
										<CardEmptyState
											icon={FileText}
											title="No plain-text content"
											description="This campaign doesn’t have a plain-text version."
											className="min-h-[220px]"
										/>
									)}
								</TabsContent>
								<TabsContent value="html" className="mt-4">
									{campaign.htmlContent ? (
										<div className="rounded-lg border border-border bg-muted/20 p-4">
											<pre className="text-xs leading-relaxed overflow-auto">
												<code>{campaign.htmlContent}</code>
											</pre>
										</div>
									) : (
										<CardEmptyState
											icon={Code2}
											title="No HTML source"
											description="This campaign doesn’t have an HTML version."
											className="min-h-[220px]"
										/>
									)}
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
