"use client";

import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
	const { data: domainsData, isLoading: isDomainsLoading } =
		trpc.openProvider.domains.list.useQuery(
			{ limit: 1000, offset: 0 },
			{ refetchOnWindowFocus: false }
		);

	const { data: ordersSummary, isLoading: isOrdersLoading } =
		trpc.orders.getSummary.useQuery();

	const { data: invoiceData, isLoading: isInvoicesLoading } =
		trpc.invoicing.list.useQuery(
			{ limit: 100 },
			{ refetchOnWindowFocus: false }
		);

	const { data: subscriptions, isLoading: isSubsLoading } =
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
	const domainsTotal = domainsData?.meta?.total ?? domainsList.length;
	const domainsExpired = domainsList.filter(
		(d: { expiryDate?: string }) =>
			d.expiryDate && new Date(d.expiryDate) < now
	).length;
	const domainsActive = domainsTotal - domainsExpired;

	// Orders: agency-wide summary
	const ordersTotal = ordersSummary?.total ?? 0;
	const ordersCompleted = ordersSummary?.completed ?? 0;
	const ordersFailed = ordersSummary?.failed ?? 0;

	// Invoices: all (no teamId for agency), paid = PAID
	const invoices = invoiceData?.invoices ?? [];
	const invoicesTotal = invoiceData?.total ?? 0;
	const invoicesPaid = invoices.filter((i: { status?: string }) => i.status === "PAID").length;
	const invoicesUnpaid = invoicesTotal - invoicesPaid;

	// Subscriptions: all (no teamId), active = ACTIVE
	const subsTotal = subscriptions?.length ?? 0;
	const subsActive =
		subscriptions?.filter((s: { status?: string }) => s.status === "ACTIVE").length ?? 0;
	const subsOther = subsTotal - subsActive;

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{/* 1. Domains */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Domains</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{domainsTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="line-clamp-1 flex gap-2 font-medium">
						Active <span className="text-green-600 dark:text-green-400">{domainsActive}</span>
						<span className="text-muted-foreground">·</span>
						Expired <span className="text-red-600 dark:text-red-400">{domainsExpired}</span>
					</div>
					<div className="text-muted-foreground">Total domains across all teams</div>
				</CardFooter>
			</Card>

			{/* 2. Orders */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Orders</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{ordersTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="line-clamp-1 flex gap-2 font-medium">
						Processed <span className="text-green-600 dark:text-green-400">{ordersCompleted}</span>
						<span className="text-muted-foreground">·</span>
						Failed <span className="text-red-600 dark:text-red-400">{ordersFailed}</span>
					</div>
					<div className="text-muted-foreground">Order status across all teams</div>
				</CardFooter>
			</Card>

			{/* 3. Invoices */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Invoices</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{invoicesTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="line-clamp-1 flex gap-2 font-medium">
						Paid <span className="text-green-600 dark:text-green-400">{invoicesPaid}</span>
						<span className="text-muted-foreground">·</span>
						Unpaid <span className="text-red-600 dark:text-red-400">{invoicesUnpaid}</span>
					</div>
					<div className="text-muted-foreground">Total invoices across all teams</div>
				</CardFooter>
			</Card>

			{/* 4. Subscriptions (replaced Tickets) */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Subscriptions</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{subsTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="line-clamp-1 flex gap-2 font-medium">
						Active <span className="text-green-600 dark:text-green-400">{subsActive}</span>
						<span className="text-muted-foreground">·</span>
						Pending/Expired <span className="text-red-600 dark:text-red-400">{subsOther}</span>
					</div>
					<div className="text-muted-foreground">Service subscriptions across all teams</div>
				</CardFooter>
			</Card>
		</div>
	);
}
