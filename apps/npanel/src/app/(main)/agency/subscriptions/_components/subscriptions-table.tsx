"use client";

import * as React from "react";
import {
	RefreshCw,
	Search,
	EllipsisVertical,
	Mail,
	PauseCircle,
	PlayCircle,
	XCircle,
	Eye,
} from "lucide-react";
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
import { trpc } from "@/utils/trpc";

function getBillingCycleDisplayName(cycle: string | null): string {
	if (!cycle) return "—";
	const m: Record<string, string> = {
		MONTHLY: "Monthly",
		YEARLY: "Yearly",
		BIENNIALLY: "Biennially",
		CUSTOM: "Custom",
	};
	return m[cycle] ?? cycle;
}

function formatDate(v: string | Date | null | undefined): string {
	if (!v) return "—";
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
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

/** Service label: "Product" or "Product - Plan", then optionally "(subscription name)" e.g. "Domains (example.com)" */
function displayServiceName(
	productName: string,
	productPlanName: string | null,
	subscriptionName: string | null
): string {
	const base = productPlanName?.trim() ? `${productName} - ${productPlanName}` : productName;
	return subscriptionName?.trim() ? `${base} (${subscriptionName})` : base;
}

function teamOrUserName(userName: string | null, teamName: string | null): string {
	// If both userId and teamId exist, prefer userId (user name)
	return userName ?? teamName ?? "—";
}

export interface SubscriptionsTableProps {
	onViewSubscription?: (subscriptionId: string) => void;
	onSendRenewalEmail?: (subscriptionId: string) => void;
}

export function SubscriptionsTable({
	onViewSubscription,
	onSendRenewalEmail,
}: SubscriptionsTableProps) {
	const [searchQuery, setSearchQuery] = React.useState("");
	const {
		data: list,
		isLoading,
		isError,
		error,
		refetch,
		isFetching,
	} = trpc.clientSubscriptions.listForAgency.useQuery({
		limit: 200,
		offset: 0,
	});

	const filtered = React.useMemo(() => {
		if (!list) return [];
		if (!searchQuery.trim()) return list;
		const q = searchQuery.toLowerCase().trim();
		return list.filter(
			(s) =>
				s.productName.toLowerCase().includes(q) ||
				(s.productPlanName ?? "").toLowerCase().includes(q) ||
				(s.userName ?? "").toLowerCase().includes(q) ||
				(s.teamName ?? "").toLowerCase().includes(q) ||
				s.status.toLowerCase().includes(q)
		);
	}, [list, searchQuery]);

	const updateStatus = trpc.clientSubscriptions.update.useMutation({
		onSuccess: () => refetch(),
	});

	const cancelSubscription = trpc.clientSubscriptions.cancel.useMutation({
		onSuccess: () => refetch(),
	});

	if (isLoading) {
		return (
			<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="pl-6">Service Name</TableHead>
							<TableHead>Team / User</TableHead>
							<TableHead>Billing cycle</TableHead>
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
									<Skeleton className="h-4 w-28" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-20" />
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
						Subscriptions will appear here when you create them (e.g. from Domains portfolio).
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
						placeholder="Search by service, team, user, status..."
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
								<TableHead>Team / User</TableHead>
								<TableHead>Billing cycle</TableHead>
								<TableHead>Subscription date</TableHead>
								<TableHead>Expiry date</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="w-12">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filtered.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
										No subscriptions match &quot;{searchQuery}&quot;
									</TableCell>
								</TableRow>
							) : (
								filtered.map((sub) => {
									const isSuspended = sub.status === "SUSPENDED";
									const canReactivate = isSuspended;
									const canSuspend = sub.status === "ACTIVE" || sub.status === "PENDING";
									const canCancel = sub.status !== "CANCELLED" && sub.status !== "EXPIRED";
									return (
										<TableRow key={sub.id}>
											<TableCell className="pl-6 font-medium">
												{displayServiceName(sub.productName, sub.productPlanName, sub.subscriptionName)}
											</TableCell>
											<TableCell>{teamOrUserName(sub.userName, sub.teamName)}</TableCell>
											<TableCell>{getBillingCycleDisplayName(sub.billingCycle)}</TableCell>
											<TableCell>{formatDate(sub.subscriptionDate)}</TableCell>
											<TableCell>{formatDate(sub.expiryDate)}</TableCell>
											<TableCell>
												<Badge variant="outline" className={getStatusBadgeClass(sub.status)}>
													{sub.status}
												</Badge>
											</TableCell>
											<TableCell onClick={(e) => e.stopPropagation()}>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button variant="ghost" size="icon" className="h-8 w-8">
																		<EllipsisVertical className="h-4 w-4" />
																		<span className="sr-only">Actions</span>
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end" className="w-56">
																	<DropdownMenuItem onClick={() => onViewSubscription?.(sub.id)}>
																		<Eye className="mr-2 h-4 w-4" />
																		View subscription
																	</DropdownMenuItem>
																	<DropdownMenuSeparator />
																	{canSuspend && (
																		<DropdownMenuItem
																			onClick={() =>
																				updateStatus.mutate({ id: sub.id, status: "SUSPENDED" })
																			}
																			disabled={updateStatus.isPending}
																		>
																			<PauseCircle className="mr-2 h-4 w-4" />
																			Suspend service
																		</DropdownMenuItem>
																	)}
																	<DropdownMenuItem
																		onClick={() => onSendRenewalEmail?.(sub.id)}
																		disabled={!sub.teamId && !sub.userId}
																	>
																		<Mail className="mr-2 h-4 w-4" />
																		Send renewal email reminder
																	</DropdownMenuItem>
																	{canReactivate && (
																		<DropdownMenuItem
																			onClick={() =>
																				updateStatus.mutate({ id: sub.id, status: "ACTIVE" })
																			}
																			disabled={updateStatus.isPending}
																		>
																			<PlayCircle className="mr-2 h-4 w-4" />
																			Re-activate service
																		</DropdownMenuItem>
																	)}
																	{canCancel && (
																		<>
																			<DropdownMenuSeparator />
																			<DropdownMenuItem
																				onClick={() => cancelSubscription.mutate({ id: sub.id })}
																				disabled={cancelSubscription.isPending}
																				className="text-destructive focus:text-destructive"
																			>
																				<XCircle className="mr-2 h-4 w-4" />
																				Cancel service
																			</DropdownMenuItem>
																		</>
																	)}
																</DropdownMenuContent>
															</DropdownMenu>
														</TooltipTrigger>
														<TooltipContent>
															<p>Actions</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</>
	);
}
