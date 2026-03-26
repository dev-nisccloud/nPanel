"use client";

import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

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
	const { data: domainsData, isLoading: isDomainsLoading, isError: isDomainsError } =
		trpc.openProvider.domains.list.useQuery(
			{ limit: 1000, offset: 0 },
			{ 
				refetchOnWindowFocus: false,
				retry: false, // Don't retry OpenProvider auth failures repeatedly
			}
		);

	const { data: ordersSummary, isLoading: isOrdersLoading, isError: isOrdersError } =
		trpc.orders.getSummary.useQuery();

	const { data: invoiceData, isLoading: isInvoicesLoading, isError: isInvoicesError } =
		trpc.invoicing.list.useQuery(
			{ limit: 100 },
			{ refetchOnWindowFocus: false }
		);

	const { data: subscriptions, isLoading: isSubsLoading, isError: isSubsError } =
		trpc.serviceSubscriptions.getAll.useQuery(undefined, {
			refetchOnWindowFocus: false,
		});

	const isLoading =
		isDomainsLoading || isOrdersLoading || isInvoicesLoading || isSubsLoading;

	if (isLoading) {
		return <MetricCardsSkeleton />;
	}

	const now = new Date();

	// Domains: all domains from OpenProvider, expired = expiryDate < today
	const domainsList = domainsData?.data ?? [];
	const domainsTotal = isDomainsError ? "N/A" : (domainsData?.meta?.total ?? domainsList.length);
	const domainsExpired = isDomainsError ? "N/A" : domainsList.filter(
		(d: { expiryDate?: string }) =>
			d.expiryDate && new Date(d.expiryDate) < now
	).length;
	const domainsActive = isDomainsError ? "N/A" : (Number(domainsTotal) - Number(domainsExpired));

	// Orders: agency-wide summary
	const ordersTotal = isOrdersError ? "N/A" : (ordersSummary?.total ?? 0);
	const ordersCompleted = isOrdersError ? "N/A" : (ordersSummary?.completed ?? 0);
	const ordersFailed = isOrdersError ? "N/A" : (ordersSummary?.failed ?? 0);

	// Invoices: all (no teamId for agency), paid = PAID
	const invoices = invoiceData?.invoices ?? [];
	const invoicesTotal = isInvoicesError ? "N/A" : (invoiceData?.total ?? 0);
	const invoicesPaid = isInvoicesError ? "N/A" : invoices.filter((i: { status?: string }) => i.status === "PAID").length;
	const invoicesUnpaid = isInvoicesError ? "N/A" : (Number(invoicesTotal) - Number(invoicesPaid));

	// Subscriptions: all (no teamId), active = ACTIVE
	const subsTotal = isSubsError ? "N/A" : (subscriptions?.length ?? 0);
	const subsActive = isSubsError ? "N/A" : (subscriptions?.filter((s: { status?: string }) => s.status === "ACTIVE").length ?? 0);
	const subsOther = isSubsError ? "N/A" : (Number(subsTotal) - Number(subsActive));

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{/* 1. Domains */}
			<Card className="@container/card relative">
				{isDomainsError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>OpenProvider service unavailable. Check your credentials.</p>
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
					<div className="line-clamp-1 flex gap-2 font-medium">
						Active <span className={isDomainsError ? "text-muted-foreground" : "text-green-600 dark:text-green-400"}>{domainsActive}</span>
						<span className="text-muted-foreground"> ·</span>
						Expired <span className={isDomainsError ? "text-muted-foreground" : "text-red-600 dark:text-red-400"}>{domainsExpired}</span>
					</div>
					<div className="text-muted-foreground">Total domains across all teams</div>
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
									<p>Failed to load orders summary.</p>
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
					<div className="line-clamp-1 flex gap-2 font-medium">
						Processed <span className={isOrdersError ? "text-muted-foreground" : "text-green-600 dark:text-green-400"}>{ordersCompleted}</span>
						<span className="text-muted-foreground"> ·</span>
						Failed <span className={isOrdersError ? "text-muted-foreground" : "text-red-600 dark:text-red-400"}>{ordersFailed}</span>
					</div>
					<div className="text-muted-foreground">Order status across all teams</div>
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
					<div className="line-clamp-1 flex gap-2 font-medium">
						Paid <span className={isInvoicesError ? "text-muted-foreground" : "text-green-600 dark:text-green-400"}>{invoicesPaid}</span>
						<span className="text-muted-foreground"> ·</span>
						Unpaid <span className={isInvoicesError ? "text-muted-foreground" : "text-red-600 dark:text-red-400"}>{invoicesUnpaid}</span>
					</div>
					<div className="text-muted-foreground">Total invoices across all teams</div>
				</CardFooter>
			</Card>

			{/* 4. Subscriptions (replaced Tickets) */}
			<Card className="@container/card relative">
				{isSubsError && (
					<div className="absolute top-2 right-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="h-4 w-4 text-destructive animate-pulse cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Failed to load service subscriptions.</p>
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
					<div className="line-clamp-1 flex gap-2 font-medium">
						Active <span className={isSubsError ? "text-muted-foreground" : "text-green-600 dark:text-green-400"}>{subsActive}</span>
						<span className="text-muted-foreground"> ·</span>
						Pending/Expired <span className={isSubsError ? "text-muted-foreground" : "text-red-600 dark:text-red-400"}>{subsOther}</span>
					</div>
					<div className="text-muted-foreground">Service subscriptions across all teams</div>
				</CardFooter>
			</Card>
		</div>
	);
}
