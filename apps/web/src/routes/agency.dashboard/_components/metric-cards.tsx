"use client";

import { Link } from "react-router";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowUpRight, Circle, CheckCircle2, TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardMetricStats } from "@/components/dashboard-metric-stats";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";

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
	{ label: "Tickets", href: "/agency/support" },
	{ label: "Products", href: "/agency/products" },
	{ label: "Invoices", href: "/agency/invoices" },
	{ label: "Quotations", href: "/agency/quotations" },
	{ label: "Orders", href: "/agency/nisc-service-orders" },
	{ label: "Transactions", href: "/agency/payment-transactions" },
	{ label: "Media Buying", href: "/agency/ad-campaigns" },
	{ label: "Hosting", href: "/agency/hosting" },
	{ label: "Clients", href: "/agency/clients" },
	{ label: "Agency users", href: "/agency/manage-users" },
	{ label: "Balance", href: "#" },
] as const;

interface MetricCardLinkProps {
	href: string;
	label: string;
}

function MetricCardLink({ href, label }: MetricCardLinkProps) {
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

function MetricCardExternalLink({ href, label }: { href: string; label: string }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
		>
			{label}
			<ArrowUpRight className="h-3.5 w-3.5" />
		</a>
	);
}

function MetricCardsSkeleton() {
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @6xl/main:grid-cols-4">
			{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
	// Domains
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

	// Tickets
	const { data: ticketsSummary, isLoading: isTicketsLoading, isError: isTicketsError } =
		trpc.tickets.getSummary.useQuery(undefined, REALTIME_QUERY_OPTIONS);

	// Products & Services
	const { data: productsSummary, isLoading: isProductsLoading, isError: isProductsError } =
		trpc.products.getSummary.useQuery(undefined, REALTIME_QUERY_OPTIONS);

	// Invoices with KRA sync
	const { data: invoicesSummary, isLoading: isInvoicesLoading, isError: isInvoicesError } =
		trpc.niscReports.invoices.statusSummaryWithKra.useQuery(
			ALL_TIME_REPORT_FILTERS,
			REALTIME_QUERY_OPTIONS,
		);

	// Quotations
	const { data: quotationsSummary, isLoading: isQuotationsLoading, isError: isQuotationsError } =
		trpc.quotations.getSummary.useQuery(undefined, REALTIME_QUERY_OPTIONS);

	// OpenProvider Balance
	const { data: openProviderBalance, isLoading: isBalanceLoading, isError: isBalanceError } =
		trpc.openProvider.reseller.getBalance.useQuery(undefined, {
			...REALTIME_QUERY_OPTIONS,
			retry: false,
		});

	// KENIC (KC) Balance  EPP can be slow; do not block the dashboard skeleton
	const {
		data: kenicBalance,
		isLoading: isKenicBalanceLoading,
		isError: isKenicBalanceError,
	} = trpc.kenic.balance.getBalance.useQuery(undefined, {
		...REALTIME_QUERY_OPTIONS,
		retry: false,
	});

	// Media Buying Platforms
	const { data: mediaBuyingPlatforms, isLoading: isMediaBuyingLoading, isError: isMediaBuyingError } =
		trpc.agencyDashboard.getMediaBuyingPlatforms.useQuery(undefined, REALTIME_QUERY_OPTIONS);

	// Hosting Subscriptions
	const { data: hostingSubscriptions, isLoading: isHostingLoading, isError: isHostingError } =
		trpc.agencyDashboard.getHostingSubscriptions.useQuery(undefined, REALTIME_QUERY_OPTIONS);

	// Customer / agency account counts
	const {
		data: accountCounts,
		isLoading: isAccountsLoading,
		isError: isAccountsError,
	} = trpc.agencyDashboard.getAccountCounts.useQuery(undefined, REALTIME_QUERY_OPTIONS);

	// Transactions
	const { data: transactionsSummary, isLoading: isTransactionsLoading, isError: isTransactionsError } =
		trpc.paymentTransactions.getSummary.useQuery(undefined, REALTIME_QUERY_OPTIONS);

	// Orders
	const { data: ordersSummary, isLoading: isOrdersLoading, isError: isOrdersError } =
		trpc.niscServiceOrders.getSummary.useQuery(undefined, REALTIME_QUERY_OPTIONS);

	const isLoading =
		isOpenProviderLoading ||
		isKenicLoading ||
		isTicketsLoading ||
		isProductsLoading ||
		isInvoicesLoading ||
		isQuotationsLoading ||
		isBalanceLoading ||
		isMediaBuyingLoading ||
		isHostingLoading ||
		isAccountsLoading ||
		isTransactionsLoading ||
		isOrdersLoading;

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

	// Tickets
	const ticketsTotal = isTicketsError ? "N/A" : (ticketsSummary?.total ?? 0);
	const ticketsOpen = isTicketsError ? "N/A" : (ticketsSummary?.openTotal ?? 0);
	const ticketsClosed = isTicketsError ? "N/A" : (ticketsSummary?.closedTotal ?? 0);

	// Products
	const productsTotal = isProductsError ? "N/A" : (productsSummary?.total ?? 0);
	const productsKraSynced = isProductsError ? "N/A" : (productsSummary?.kraSynced ?? 0);
	const productsNoKraSync = isProductsError ? "N/A" : (productsSummary?.noKraSync ?? 0);

	// Invoices
	const invoicesTotal = isInvoicesError ? "N/A" : (invoicesSummary?.total ?? 0);
	const invoicesKraSynced = isInvoicesError ? "N/A" : (invoicesSummary?.kraSynced ?? 0);
	const invoicesNotSynced = isInvoicesError ? "N/A" : (invoicesSummary?.kraNotSynced ?? 0);

	// Quotations
	const quotationsTotal = isQuotationsError ? "N/A" : (quotationsSummary?.total ?? 0);
	const quotationsPending = isQuotationsError ? "N/A" : (quotationsSummary?.pending ?? 0);
	const quotationsClosed = isQuotationsError ? "N/A" : (quotationsSummary?.closed ?? 0);

	// OpenProvider Balance
	const balance = isBalanceError ? "N/A" : `$${(openProviderBalance?.balance ?? 0).toFixed(2)}`;

	const formatKenicBalance = () => {
		if (isKenicBalanceLoading) return "…";
		if (isKenicBalanceError || !kenicBalance) return "Coming soon";
		const amount = kenicBalance.balance ?? 0;
		const currency = kenicBalance.currency ?? "KES";
		if (currency === "KES") {
			return `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
		}
		return `${currency} ${amount.toFixed(2)}`;
	};
	const kcBalanceDisplay = formatKenicBalance();
	const kcBalanceUnavailable =
		!isKenicBalanceLoading && (isKenicBalanceError || !kenicBalance);

	// Hosting
	const hostingTotal = isHostingError ? "N/A" : (hostingSubscriptions?.total ?? 0);
	const hostingActive = isHostingError ? "N/A" : (hostingSubscriptions?.active ?? 0);
	const hostingSuspended = isHostingError ? "N/A" : (hostingSubscriptions?.suspended ?? 0);

	// Accounts
	const customerAccounts = isAccountsError ? "N/A" : (accountCounts?.customers.total ?? 0);
	const customerActive = isAccountsError ? "N/A" : (accountCounts?.customers.active ?? 0);
	const customerInactive = isAccountsError ? "N/A" : (accountCounts?.customers.inactive ?? 0);
	const agencyAccounts = isAccountsError ? "N/A" : (accountCounts?.agency.total ?? 0);
	const agencyActive = isAccountsError ? "N/A" : (accountCounts?.agency.active ?? 0);
	const agencyInactive = isAccountsError ? "N/A" : (accountCounts?.agency.inactive ?? 0);

	// Orders
	const ordersTotal = isOrdersError ? "N/A" : (ordersSummary?.total ?? 0);
	const ordersCompleted = isOrdersError ? "N/A" : (ordersSummary?.completed ?? 0);
	const ordersFailed = isOrdersError ? "N/A" : (ordersSummary?.failed ?? 0);

	// Transactions
	const transactionsTotal = isTransactionsError ? "N/A" : (transactionsSummary?.total ?? 0);
	const transactionsSuccess = isTransactionsError ? "N/A" : (transactionsSummary?.success ?? 0);
	const transactionsFailed = isTransactionsError ? "N/A" : (transactionsSummary?.failed ?? 0);

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @6xl/main:grid-cols-4">
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

			{/* 2. Tickets */}
			<Card className="@container/card relative">
				{isTicketsError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load tickets summary.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<CardHeader>
					<CardDescription>Tickets</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{ticketsTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{
								label: "Open",
								value: ticketsOpen,
								variant: isTicketsError ? "muted" : "negative",
							},
							{
								label: "Closed",
								value: ticketsClosed,
								variant: isTicketsError ? "muted" : "positive",
							},
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...METRIC_CARD_LINKS[1]} />
					</div>
				</CardFooter>
			</Card>

			{/* 3. Products & Services */}
			<Card className="@container/card relative">
				{isProductsError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load products summary.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<CardHeader>
					<CardDescription>Products & Services</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{productsTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{
								label: "KRA Synced",
								value: productsKraSynced,
								variant: isProductsError ? "muted" : "positive",
							},
							{
								label: "No KRA Sync",
								value: productsNoKraSync,
								variant: isProductsError ? "muted" : "muted",
							},
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...METRIC_CARD_LINKS[2]} />
					</div>
				</CardFooter>
			</Card>

			{/* 4. Invoices */}
			<Card className="@container/card relative">
				{isInvoicesError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load invoices.</p>
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
								label: "KRA Synced",
								value: invoicesKraSynced,
								variant: isInvoicesError ? "muted" : "positive",
							},
							{
								label: "Not Synced",
								value: invoicesNotSynced,
								variant: isInvoicesError ? "muted" : "negative",
							},
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...METRIC_CARD_LINKS[3]} />
					</div>
				</CardFooter>
			</Card>

			{/* 5. Quotations */}
			<Card className="@container/card relative">
				{isQuotationsError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load quotations.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<CardHeader>
					<CardDescription>Quotations</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{quotationsTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{
								label: "Pending",
								value: quotationsPending,
								variant: isQuotationsError ? "muted" : "muted",
							},
							{
								label: "Closed",
								value: quotationsClosed,
								variant: isQuotationsError ? "muted" : "positive",
							},
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...METRIC_CARD_LINKS[4]} />
					</div>
				</CardFooter>
			</Card>

			{/* 6. Orders */}
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
						<MetricCardLink {...METRIC_CARD_LINKS[5]} />
					</div>
				</CardFooter>
			</Card>

			{/* 7. Transactions */}
			<Card className="@container/card relative">
				{isTransactionsError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load payment transactions summary.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<CardHeader>
					<CardDescription>Transactions</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{transactionsTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{
								label: "Success",
								value: transactionsSuccess,
								variant: isTransactionsError ? "muted" : "positive",
							},
							{
								label: "Failed",
								value: transactionsFailed,
								variant: isTransactionsError ? "muted" : "negative",
							},
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...METRIC_CARD_LINKS[6]} />
					</div>
				</CardFooter>
			</Card>

			{/* 8. OP Balance + KC Balance */}
			<Card className="@container/card relative">
				{isBalanceError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load OP balance.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<CardHeader className="gap-4">
					<div className="space-y-1">
						<CardDescription>OP Balance</CardDescription>
						<CardTitle className="text-xl font-semibold tabular-nums">
							{balance}
						</CardTitle>
						<div className="pt-0.5">
							<MetricCardExternalLink
								href="https://cp.openprovider.eu/"
								label="Open OP dashboard"
							/>
						</div>
					</div>
					<div className="space-y-1">
						<CardDescription>KC Balance</CardDescription>
						<p
							className={cn(
								"text-xl font-semibold tabular-nums leading-none",
								(isKenicBalanceLoading || kcBalanceUnavailable) &&
									"text-muted-foreground",
							)}
						>
							{kcBalanceDisplay}
						</p>
						<div className="pt-0.5">
							<MetricCardExternalLink
								href="https://registry.kenic.or.ke/"
								label="Open KC dashboard"
							/>
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* 9. Media Buying */}
			<Card className="@container/card relative">
				{isMediaBuyingError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load media buying platforms.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<CardHeader>
					<CardDescription>Media Buying</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{isMediaBuyingError ? "N/A" : mediaBuyingPlatforms?.totalConnected ?? 0}
						<span className="text-sm font-normal text-muted-foreground ml-2">
							/ {isMediaBuyingError ? "N/A" : mediaBuyingPlatforms?.platforms.length ?? 0}
						</span>
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-2 text-sm">
					<div className="flex flex-wrap gap-1.5">
						{!isMediaBuyingError && mediaBuyingPlatforms?.platforms.map((platform) => (
							<Badge
								key={platform.key}
								variant={platform.connected ? "default" : "secondary"}
								className={cn(
									"flex items-center gap-1 text-xs",
									platform.connected && "bg-emerald-600 hover:bg-emerald-700",
								)}
							>
								{platform.connected ? (
									<Wifi className="h-3 w-3" />
								) : (
									<WifiOff className="h-3 w-3" />
								)}
								{platform.name}
							</Badge>
						))}
					</div>
					<div className="text-muted-foreground">
						<MetricCardLink {...METRIC_CARD_LINKS[7]} />
					</div>
				</CardFooter>
			</Card>

			{/* 10. Hosting Subscriptions */}
			<Card className="@container/card relative">
				{isHostingError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load hosting subscriptions.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<CardHeader>
					<CardDescription>Hosting Subscriptions</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{hostingTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{
								label: "Active",
								value: hostingActive,
								variant: isHostingError ? "muted" : "positive",
							},
							{
								label: "Suspended",
								value: hostingSuspended,
								variant: isHostingError ? "muted" : "negative",
							},
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...METRIC_CARD_LINKS[8]} />
					</div>
				</CardFooter>
			</Card>

			{/* 11. Customer Accounts + Agency Accounts */}
			<Card className="@container/card relative">
				{isAccountsError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load account counts.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<CardHeader className="gap-4">
					<div className="space-y-1">
						<CardDescription>Customer Accounts</CardDescription>
						<CardTitle className="text-xl font-semibold tabular-nums">
							{customerAccounts}
						</CardTitle>
						<DashboardMetricStats
							items={[
								{
									label: "Active",
									value: customerActive,
									variant: isAccountsError ? "muted" : "positive",
								},
								{
									label: "Inactive",
									value: customerInactive,
									variant: isAccountsError ? "muted" : "negative",
								},
							]}
						/>
						<div className="pt-0.5 text-sm">
							<MetricCardLink {...METRIC_CARD_LINKS[9]} />
						</div>
					</div>
					<div className="space-y-1">
						<CardDescription>Agency Accounts</CardDescription>
						<p className="text-xl font-semibold tabular-nums leading-none">
							{agencyAccounts}
						</p>
						<DashboardMetricStats
							items={[
								{
									label: "Active",
									value: agencyActive,
									variant: isAccountsError ? "muted" : "positive",
								},
								{
									label: "Inactive",
									value: agencyInactive,
									variant: isAccountsError ? "muted" : "negative",
								},
							]}
						/>
						<div className="pt-0.5 text-sm">
							<MetricCardLink {...METRIC_CARD_LINKS[10]} />
						</div>
					</div>
				</CardHeader>
			</Card>
		</div>
	);
}
