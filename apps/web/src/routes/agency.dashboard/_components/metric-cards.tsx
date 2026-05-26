"use client";

import { Link } from "react-router";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowUpRight } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardMetricStats } from "@/components/dashboard-metric-stats";
import { trpc } from "@/utils/trpc";

const REALTIME_QUERY_OPTIONS = {
	placeholderData: (prev: unknown) => prev,
	refetchOnWindowFocus: false,
	refetchOnMount: true,
} as const;

const ALL_TIME_REPORT_FILTERS = {
	from: new Date(2000, 0, 1),
	to: new Date(),
};

const METRIC_CARD_LINKS = [
	{ label: "Domains", href: "/agency/domains-portfolio" },
	{ label: "Orders", href: "/agency/nisc-service-orders" },
	{ label: "Invoices", href: "/agency/invoices" },
	{ label: "Subscriptions", href: "/agency/subscriptions" },
] as const;

function MetricCardLink({ href, label }: { href: string; label: string }) {
	return (
		<Link
			to={href}
			className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
		>
			{label}
			<ArrowUpRight className="h-3.5 w-3.5" />
		</Link>
	);
}

function MetricCardsSkeleton() {
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{[1, 2, 3, 4].map((i) => (
				<Card key={i} className="@container/card">
					<CardHeader>
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-20 mt-2" />
					</CardHeader>
					<CardFooter className="flex-col items-start gap-1.5 text-sm">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-40" />
					</CardFooter>
				</Card>
			))}
		</div>
	);
}

export function MetricCards() {
	const {
		data: openProviderDomains,
		isLoading: isOpenProviderLoading,
		isError: isOpenProviderError,
	} = trpc.openProvider.domains.list.useQuery(
		{ limit: 1000, offset: 0, with_customer_info: false },
		{
			...REALTIME_QUERY_OPTIONS,
			retry: false,
		},
	);

	const {
		data: kenicDomains,
		isLoading: isKenicLoading,
		isError: isKenicError,
	} = trpc.kenic.domainList.list.useQuery(
		{},
		{
			...REALTIME_QUERY_OPTIONS,
			retry: false,
		},
	);

	const { data: ordersSummary, isLoading: isOrdersLoading, isError: isOrdersError } =
		trpc.niscServiceOrders.getSummary.useQuery(undefined, REALTIME_QUERY_OPTIONS);

	const { data: invoiceStatuses, isLoading: isInvoicesLoading, isError: isInvoicesError } =
		trpc.niscReports.invoices.statusSummary.useQuery(
			ALL_TIME_REPORT_FILTERS,
			REALTIME_QUERY_OPTIONS,
		);

	const { data: subscriptionStatuses, isLoading: isSubsLoading, isError: isSubsError } =
		trpc.niscReports.subscriptions.statusSummary.useQuery(
			ALL_TIME_REPORT_FILTERS,
			REALTIME_QUERY_OPTIONS,
		);

	const isLoading =
		isOpenProviderLoading ||
		isKenicLoading ||
		isOrdersLoading ||
		isInvoicesLoading ||
		isSubsLoading;

	if (isLoading) {
		return <MetricCardsSkeleton />;
	}

	const now = new Date();

	// Domains: OpenProvider + KENIC (realtime), expired = expiryDate < today
	const openProviderList = openProviderDomains?.data ?? [];
	const kenicList = kenicDomains?.data ?? [];
	const mergedDomainList = [...openProviderList, ...kenicList];

	const openProviderTotal = isOpenProviderError
		? null
		: (openProviderDomains?.meta?.total ?? openProviderList.length);
	const kenicTotal = isKenicError ? null : kenicList.length;

	const domainsTotal =
		openProviderTotal === null && kenicTotal === null
			? "N/A"
			: (openProviderTotal ?? 0) + (kenicTotal ?? 0);

	const domainsExpired =
		openProviderTotal === null && kenicTotal === null
			? "N/A"
			: mergedDomainList.filter(
					(d: { expiryDate?: string }) =>
						d.expiryDate && new Date(d.expiryDate) < now,
				).length;

	const domainsActive =
		openProviderTotal === null && kenicTotal === null
			? "N/A"
			: Number(domainsTotal) - Number(domainsExpired);

	// Orders: Nisc service orders summary
	const ordersTotal = isOrdersError ? "N/A" : (ordersSummary?.total ?? 0);
	const ordersCompleted = isOrdersError ? "N/A" : (ordersSummary?.completed ?? 0);
	const ordersFailed = isOrdersError ? "N/A" : (ordersSummary?.failed ?? 0);

	// Invoices: Nisc invoice table
	const invoicesTotal = isInvoicesError
		? "N/A"
		: (invoiceStatuses?.reduce((sum, row) => sum + row.count, 0) ?? 0);
	const invoicesPaid = isInvoicesError
		? "N/A"
		: (invoiceStatuses?.find((row) => row.status === "PAID")?.count ?? 0);
	const invoicesUnpaid = isInvoicesError
		? "N/A"
		: Number(invoicesTotal) - Number(invoicesPaid);

	// Subscriptions: Nisc client subscriptions table
	const subsTotal = isSubsError
		? "N/A"
		: (subscriptionStatuses?.reduce((sum, row) => sum + row.count, 0) ?? 0);
	const subsActive = isSubsError
		? "N/A"
		: (subscriptionStatuses?.find((row) => row.status === "ACTIVE")?.count ?? 0);
	const subsOther = isSubsError ? "N/A" : Number(subsTotal) - Number(subsActive);

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{/* 1. Domains */}
			<Card className="@container/card relative">
				{(isOpenProviderError || isKenicError) && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>
										{isOpenProviderError && isKenicError
											? "Domain services unavailable. Check OpenProvider credentials and KENIC connectivity."
											: isOpenProviderError
												? "OpenProvider unavailable. Showing KENIC domains only."
												: "KENIC unavailable. Showing OpenProvider domains only."}
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<CardHeader>
					<CardDescription>Domains</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{domainsTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{
								label: "Active",
								value: domainsActive,
								variant:
									openProviderTotal === null && kenicTotal === null ? "muted" : "positive",
							},
							{
								label: "Expired",
								value: domainsExpired,
								variant:
									openProviderTotal === null && kenicTotal === null ? "muted" : "negative",
							},
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...METRIC_CARD_LINKS[0]} />
					</div>
				</CardFooter>
			</Card>

			{/* 2. Orders */}
			<Card className="@container/card relative">
				{isOrdersError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load Nisc service orders summary.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<CardHeader>
					<CardDescription>Orders</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{ordersTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{
								label: "Processed",
								value: ordersCompleted,
								variant: isOrdersError ? "muted" : "positive",
							},
							{
								label: "Failed",
								value: ordersFailed,
								variant: isOrdersError ? "muted" : "negative",
							},
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...METRIC_CARD_LINKS[1]} />
					</div>
				</CardFooter>
			</Card>

			{/* 3. Invoices */}
			<Card className="@container/card relative">
				{isInvoicesError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load Nisc invoices.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<CardHeader>
					<CardDescription>Invoices</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{invoicesTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{
								label: "Paid",
								value: invoicesPaid,
								variant: isInvoicesError ? "muted" : "positive",
							},
							{
								label: "Unpaid",
								value: invoicesUnpaid,
								variant: isInvoicesError ? "muted" : "negative",
							},
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...METRIC_CARD_LINKS[2]} />
					</div>
				</CardFooter>
			</Card>

			{/* 4. Subscriptions */}
			<Card className="@container/card relative">
				{isSubsError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load Nisc subscriptions.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<CardHeader>
					<CardDescription>Subscriptions</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{subsTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{
								label: "Active",
								value: subsActive,
								variant: isSubsError ? "muted" : "positive",
							},
							{
								label: "Pending/Expired",
								value: subsOther,
								variant: isSubsError ? "muted" : "negative",
							},
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...METRIC_CARD_LINKS[3]} />
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
