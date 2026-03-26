"use client";

import * as React from "react";
import { useLocation } from "react-router";
import { RefreshCw, Search, Eye } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

function formatDate(v: string | Date | null | undefined): string {
	if (!v) return "—";
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function getStatusBadgeClass(status: string): string {
	const statusColors: Record<string, string> = {
		ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800",
		PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
		SUSPENDED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 border-orange-200 dark:border-orange-800",
		CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
		EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
		PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-800",
		FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
		UPGRADED: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200",
		DOWNGRADED: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200",
	};
	return statusColors[status] ?? "";
}

function displayServiceName(productName: string, productPlanName: string | null): string {
	return productPlanName?.trim() ? `${productName} - ${productPlanName}` : productName;
}

export interface CustomerSubscriptionsTableProps {
	onViewSubscription?: (subscriptionId: string) => void;
}

export function CustomerSubscriptionsTable({ onViewSubscription }: CustomerSubscriptionsTableProps) {
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1];
	const [searchQuery, setSearchQuery] = React.useState("");

	const {
		data: list,
		isLoading,
		isError,
		error,
		refetch,
		isFetching,
	} = trpc.clientSubscriptions.listForTeam.useQuery(
		{ teamSlug: teamSlug ?? "" },
		{ enabled: !!teamSlug, staleTime: 5 * 60 * 1000 }
	);

	const filtered = React.useMemo(() => {
		if (!list) return [];
		if (!searchQuery.trim()) return list;
		const q = searchQuery.toLowerCase().trim();
		return list.filter(
			(s) =>
				s.productName.toLowerCase().includes(q) ||
				(s.productPlanName ?? "").toLowerCase().includes(q) ||
				s.status.toLowerCase().includes(q)
		);
	}, [list, searchQuery]);

	if (!teamSlug) {
		return null;
	}

	if (isLoading) {
		return (
			<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="pl-6">Service Name</TableHead>
							<TableHead>Subscription date</TableHead>
							<TableHead>Expiry date</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="w-12" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{[...Array(5)].map((_, i) => (
							<TableRow key={i}>
								<TableCell className="pl-6">
									<Skeleton className="h-4 w-40" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-24" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-24" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-20" />
								</TableCell>
								<TableCell />
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="overflow-hidden rounded-lg border bg-card">
				<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
					<p className="text-sm text-muted-foreground mb-4">
						{(error as unknown as Error)?.message ?? "An error occurred while loading subscriptions"}
					</p>
					<Button onClick={() => refetch()} variant="outline">
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	if (!list?.length) {
		return (
			<div className="overflow-hidden rounded-lg border bg-card">
				<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
					<p className="text-lg font-semibold mb-1">No subscriptions found</p>
					<p className="text-sm text-muted-foreground">
						Your company&apos;s subscriptions will appear here (e.g. from Domains or other services).
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="flex items-center justify-between gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search by service name or status..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} title="Refresh">
					<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
				</Button>
			</div>
			<div className="mt-6">
				<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-6">Service Name</TableHead>
								<TableHead>Subscription date</TableHead>
								<TableHead>Expiry date</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="w-24">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filtered.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
										No subscriptions match &quot;{searchQuery}&quot;
									</TableCell>
								</TableRow>
							) : (
								filtered.map((sub) => (
									<TableRow key={sub.id}>
										<TableCell className="pl-6 font-medium">
											{displayServiceName(sub.productName, sub.productPlanName)}
										</TableCell>
										<TableCell>{formatDate(sub.subscriptionDate)}</TableCell>
										<TableCell>{formatDate(sub.expiryDate)}</TableCell>
										<TableCell>
											<Badge variant="outline" className={getStatusBadgeClass(sub.status)}>
												{sub.status}
											</Badge>
										</TableCell>
										<TableCell onClick={(e) => e.stopPropagation()}>
											{onViewSubscription ? (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onViewSubscription(sub.id)}
												>
													<Eye className="mr-2 h-4 w-4" />
													View
												</Button>
											) : null}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</>
	);
}
