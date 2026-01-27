"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export function MetricCards() {
	// Mock data
	const domainsData = {
		total: 1250,
		active: 1180,
		expired: 70,
	};

	const ordersData = {
		total: 342,
		processed: 320,
		failed: 22,
	};

	const invoicesData = {
		total: 856,
		paid: 780,
		unpaid: 76,
	};

	const ticketsData = {
		total: 234,
		completed: 198,
		noResponse: 36,
	};

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{/* 1. Domains */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Domains</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{domainsData.total}
					</CardTitle>
					<CardAction>
						<Badge variant="outline">
							{domainsData.expired === 0 ? (
								<>
									<TrendingUp className="size-3.5" />
									All active
								</>
							) : (
								<>
									<TrendingDown className="size-3.5" />
									{domainsData.expired} expired
								</>
							)}
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="line-clamp-1 flex gap-2 font-medium">
						Active <span className="text-green-600 dark:text-green-400">{domainsData.active}</span>
						<span className="text-muted-foreground">·</span>
						Expired <span className="text-red-600 dark:text-red-400">{domainsData.expired}</span>
					</div>
					<div className="text-muted-foreground">Total domains across all teams</div>
				</CardFooter>
			</Card>

			{/* 2. Orders */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Orders</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{ordersData.total}
					</CardTitle>
					<CardAction>
						<Badge variant="outline">
							{ordersData.failed === 0 ? (
								<>
									<TrendingUp className="size-3.5" />
									Processed
								</>
							) : (
								<>
									<TrendingDown className="size-3.5" />
									{ordersData.failed} failed
								</>
							)}
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="line-clamp-1 flex gap-2 font-medium">
						Processed <span className="text-green-600 dark:text-green-400">{ordersData.processed}</span>
						<span className="text-muted-foreground">·</span>
						Failed <span className="text-red-600 dark:text-red-400">{ordersData.failed}</span>
					</div>
					<div className="text-muted-foreground">Order status across all teams</div>
				</CardFooter>
			</Card>

			{/* 3. Invoices */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Invoices</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{invoicesData.total}
					</CardTitle>
					<CardAction>
						<Badge variant="outline">
							{invoicesData.unpaid === 0 ? (
								<>
									<TrendingUp className="size-3.5" />
									All paid
								</>
							) : (
								<>
									<TrendingDown className="size-3.5" />
									{invoicesData.unpaid} unpaid
								</>
							)}
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="line-clamp-1 flex gap-2 font-medium">
						Paid <span className="text-green-600 dark:text-green-400">{invoicesData.paid}</span>
						<span className="text-muted-foreground">·</span>
						Unpaid <span className="text-red-600 dark:text-red-400">{invoicesData.unpaid}</span>
					</div>
					<div className="text-muted-foreground">Total invoices across all teams</div>
				</CardFooter>
			</Card>

			{/* 4. Tickets */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Tickets</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{ticketsData.total}
					</CardTitle>
					<CardAction>
						<Badge variant="outline">
							{ticketsData.noResponse === 0 ? (
								<>
									<TrendingUp className="size-3.5" />
									All completed
								</>
							) : (
								<>
									<TrendingDown className="size-3.5" />
									{ticketsData.noResponse} no response
								</>
							)}
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="line-clamp-1 flex gap-2 font-medium">
						Completed <span className="text-green-600 dark:text-green-400">{ticketsData.completed}</span>
						<span className="text-muted-foreground">·</span>
						No Response <span className="text-red-600 dark:text-red-400">{ticketsData.noResponse}</span>
					</div>
					<div className="text-muted-foreground">Support tickets across all teams</div>
				</CardFooter>
			</Card>
		</div>
	);
}
