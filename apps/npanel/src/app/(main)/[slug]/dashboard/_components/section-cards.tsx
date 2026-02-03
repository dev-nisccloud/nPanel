"use client";

import { usePathname } from "next/navigation";

import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

function SectionCardsSkeleton() {
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

export function SectionCards() {
	const pathname = usePathname();
	const teamSlug = pathname?.split("/")[1] ?? "";

	const { data: teamData, isLoading: isTeamLoading } =
		trpc.teams.getTeamIdBySlug.useQuery(
			{ slug: teamSlug },
			{ enabled: !!teamSlug, staleTime: 5 * 60 * 1000 }
		);

	const teamId = teamData?.id;

	const { data: domains, isLoading: isDomainsLoading } =
		trpc.domains.getByTeam.useQuery(
			{ teamId: teamId ?? "" },
			{ enabled: !!teamId }
		);

	const { data: invoiceData, isLoading: isInvoicesLoading } =
		trpc.invoicing.list.useQuery(
			{ teamId: teamId ?? undefined, limit: 100 },
			{ enabled: !!teamId }
		);

	const { data: ordersSummary, isLoading: isOrdersLoading } =
		trpc.orders.getSummaryByTeam.useQuery(
			{ teamId: teamId ?? "" },
			{ enabled: !!teamId }
		);

	const { data: subscriptions, isLoading: isSubsLoading } =
		trpc.serviceSubscriptions.getAll.useQuery(
			{ teamId: teamId ?? undefined },
			{ enabled: !!teamId }
		);

	const isLoading =
		isTeamLoading ||
		isDomainsLoading ||
		isInvoicesLoading ||
		isOrdersLoading ||
		isSubsLoading;

	if (isLoading) {
		return <SectionCardsSkeleton />;
	}

	const now = new Date();

	// Domains: total, active (not expired), expired
	const domainsTotal = domains?.length ?? 0;
	const domainsActive =
		domains?.filter(
			(d) => !d.expirationDate || new Date(d.expirationDate) > now
		).length ?? 0;
	const domainsExpired = domainsTotal - domainsActive;

	// Invoices: total, paid (PAID), unpaid (rest)
	const invoices = invoiceData?.invoices ?? [];
	const invoicesTotal = invoiceData?.total ?? 0;
	const invoicesPaid = invoices.filter((i) => i.status === "PAID").length;
	const invoicesUnpaid = invoicesTotal - invoicesPaid;

	// Orders: total, completed, failed (agency layout uses "processed" = completed)
	const ordersTotal = ordersSummary?.total ?? 0;
	const ordersCompleted = ordersSummary?.completed ?? 0;
	const ordersFailed = ordersSummary?.failed ?? 0;

	// Subscriptions: total, active (ACTIVE), pending/expired (rest)
	const subsTotal = subscriptions?.length ?? 0;
	const subsActive =
		subscriptions?.filter((s) => s.status === "ACTIVE").length ?? 0;
	const subsOther = subsTotal - subsActive;

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{/* 1. Domains – like agency dashboard */}
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
					<div className="text-muted-foreground">Total domains for this team</div>
				</CardFooter>
			</Card>

			{/* 2. Invoices */}
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
					<div className="text-muted-foreground">Total invoices for this team</div>
				</CardFooter>
			</Card>

			{/* 3. Orders – agency layout: processed / failed */}
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
					<div className="text-muted-foreground">Order status for this team</div>
				</CardFooter>
			</Card>

			{/* 4. Subscriptions – agency-style layout, same visual as other cards */}
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
					<div className="text-muted-foreground">Service subscriptions for this team</div>
				</CardFooter>
			</Card>
		</div>
	);
}
