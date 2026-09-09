"use client";

import * as React from "react";
import { RefreshCw, Search, Eye, Pencil, MoreHorizontal, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import { authClient } from "@/lib/auth-client";
import { SubscriptionDeleteDialog } from "./subscription-delete-dialog";

function getBillingCycleDisplayName(cycle: string | null): string {
	if (!cycle) return "- ";
	const m: Record<string, string> = {
		MONTHLY: "Monthly",
		YEARLY: "Yearly",
		BIENNIALLY: "Biennially",
		CUSTOM: "Custom",
		ONE_TIME: "One-time",
	};
	return m[cycle] ?? cycle;
}

function formatDate(v: string | Date | null | undefined): string {
	if (!v) return "- ";
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? "- " : d.toLocaleDateString();
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

/** Service label: custom name for one-time services, otherwise "Product - Plan (name)" */
function displayServiceName(
	productName: string,
	productPlanName: string | null,
	subscriptionName: string | null,
	billingCycle?: string | null,
): string {
	if (billingCycle === "ONE_TIME" && subscriptionName?.trim()) {
		return subscriptionName.trim();
	}
	const base = productPlanName?.trim() ? `${productName} - ${productPlanName}` : productName;
	return subscriptionName?.trim() ? `${base} (${subscriptionName})` : base;
}

function organizationName(teamName: string | null): string {
	return teamName ?? "- ";
}

export interface SubscriptionsTableProps {
	/** Optional: if provided, View link will use this instead of navigation */
	onViewSubscription?: (subscriptionId: string) => void;
	onEditSubscription?: (subscriptionId: string) => void;
}

export function SubscriptionsTable({ onViewSubscription, onEditSubscription }: SubscriptionsTableProps) {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [deleteSubscriptionId, setDeleteSubscriptionId] = React.useState<string | null>(null);
	const { data: session } = authClient.useSession();
	const isSuperAdmin =
		(session?.user as { role?: string } | undefined)?.role === "AGENCY_SUPER_ADMIN";

	const utils = trpc.useUtils();
	const deleteSubscription = trpc.clientSubscriptions.delete.useMutation({
		onSuccess: () => {
			captureEvent("subscription_deleted");
			toast.success("Subscription deleted");
			setDeleteSubscriptionId(null);
			void utils.clientSubscriptions.listForAgency.invalidate();
		},
		onError: (e) => toast.error(e.message),
	});
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
				(s.subscriptionName ?? "").toLowerCase().includes(q) ||
				(s.teamName ?? "").toLowerCase().includes(q) ||
				s.status.toLowerCase().includes(q)
		);
	}, [list, searchQuery]);

	const deleteTargetName = React.useMemo(() => {
		if (!deleteSubscriptionId || !list) return "this subscription";
		const sub = list.find((s) => s.id === deleteSubscriptionId);
		if (!sub) return "this subscription";
		return displayServiceName(sub.productName, sub.productPlanName, sub.subscriptionName, sub.billingCycle);
	}, [deleteSubscriptionId, list]);

	const handleViewSubscription = React.useCallback(
		(subscriptionId: string) => {
			if (onViewSubscription) {
				onViewSubscription(subscriptionId);
				return;
			}
			void navigate(`/agency/subscriptions?subscriptionId=${subscriptionId}`);
		},
		[onViewSubscription, navigate],
	);

	if (isLoading) {
		return (
			<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="pl-6">Service Name</TableHead>
							<TableHead>Organization / User</TableHead>
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
						placeholder="Search by service, organization, user, status..."
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
								<TableHead>Organization</TableHead>
								<TableHead>Billing cycle</TableHead>
								<TableHead>Subscription date</TableHead>
								<TableHead>Expiry date</TableHead>
								<TableHead>Status</TableHead>
							<TableHead className="w-12" />
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
							filtered.map((sub) => (
								<TableRow key={sub.id}>
									<TableCell
										className="pl-6 cursor-pointer font-medium hover:underline"
										onClick={() => handleViewSubscription(sub.id)}
									>
										{displayServiceName(sub.productName, sub.productPlanName, sub.subscriptionName, sub.billingCycle)}
									</TableCell>
									<TableCell>{organizationName(sub.teamName)}</TableCell>
									<TableCell>{getBillingCycleDisplayName(sub.billingCycle)}</TableCell>
									<TableCell>{formatDate(sub.subscriptionDate)}</TableCell>
									<TableCell>{formatDate(sub.expiryDate)}</TableCell>
									<TableCell>
										<Badge variant="outline" className={getStatusBadgeClass(sub.status)}>
											{sub.status}
										</Badge>
									</TableCell>
									<TableCell onClick={(e) => e.stopPropagation()}>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={(e) => e.stopPropagation()}
												>
													<MoreHorizontal className="h-4 w-4" />
													<span className="sr-only">Open menu</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
												<DropdownMenuItem onSelect={() => handleViewSubscription(sub.id)}>
													<Eye className="mr-2 h-4 w-4" />
													View
												</DropdownMenuItem>
												{onEditSubscription ? (
													<DropdownMenuItem onSelect={() => onEditSubscription(sub.id)}>
														<Pencil className="mr-2 h-4 w-4" />
														Edit
													</DropdownMenuItem>
												) : null}
												{isSuperAdmin ? (
													<>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:text-destructive"
															onSelect={() => setDeleteSubscriptionId(sub.id)}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</>
												) : null}
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
						</TableBody>
					</Table>
				</div>
			</div>
			<SubscriptionDeleteDialog
				open={deleteSubscriptionId != null}
				subscriptionName={deleteTargetName}
				isPending={deleteSubscription.isPending}
				onOpenChange={(open) => {
					if (!open) setDeleteSubscriptionId(null);
				}}
				onConfirm={() => {
					if (deleteSubscriptionId) {
						deleteSubscription.mutate({ id: deleteSubscriptionId });
					}
				}}
			/>
		</>
	);
}
