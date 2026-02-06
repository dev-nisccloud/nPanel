"use client";

import * as React from "react";
import { Package, RefreshCw, Search } from "lucide-react";
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
import type { SubscriptionDetail } from "./subscription-view-dialog";

function getBillingCycleDisplayName(cycle: string): string {
	const m: Record<string, string> = { MONTHLY: "Monthly", YEARLY: "Yearly", BIENNIALLY: "Biennially", CUSTOM: "Custom" };
	return m[cycle] ?? cycle;
}

function getPlanTypeDisplayName(t: string): string {
	const m: Record<string, string> = {
		HOSTING: "Hosting",
		SEO: "SEO",
		VIDEOGRAPHY: "Videography",
		VISUAL_CREATIVE: "Visual Creative",
		SOCIAL_MEDIA_MARKETING: "Social Media Marketing",
		PAY_PER_CLICK_ADVERTISING: "Pay Per Click Advertising",
	};
	return m[t] ?? t;
}

function formatDate(v: string | Date | null | undefined): string {
	if (!v) return "—";
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function TableSkeleton() {
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Plan Name</TableHead>
						<TableHead>Plan Type</TableHead>
						<TableHead>Team</TableHead>
						<TableHead>Billing</TableHead>
						<TableHead>Next Renewal</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{[...Array(5)].map((_, i) => (
						<TableRow key={i}>
							<TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
							<TableCell><Skeleton className="h-4 w-24" /></TableCell>
							<TableCell><Skeleton className="h-4 w-28" /></TableCell>
							<TableCell><Skeleton className="h-4 w-20" /></TableCell>
							<TableCell><Skeleton className="h-4 w-24" /></TableCell>
							<TableCell><Skeleton className="h-4 w-20" /></TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function TableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
				<p className="text-sm text-muted-foreground mb-4">
					{error?.message ?? "An error occurred while loading subscriptions"}
				</p>
				<Button onClick={onRetry} variant="outline">
					Try Again
				</Button>
			</div>
		</div>
	);
}

export interface SubscriptionsTableProps {
	onPlanNameClick?: (subscription: SubscriptionDetail) => void;
}

export function SubscriptionsTable({ onPlanNameClick }: SubscriptionsTableProps) {
	const [searchQuery, setSearchQuery] = React.useState("");
	const { data, isLoading, isError, error, refetch, isFetching } = trpc.serviceSubscriptions.getAll.useQuery();

	const list = data ?? [];
	const filtered = React.useMemo(() => {
		if (!searchQuery.trim()) return list;
		const q = searchQuery.toLowerCase().trim();
		return list.filter(
			(s) =>
				(s.planName ?? "").toLowerCase().includes(q) ||
				(s.teamName ?? "").toLowerCase().includes(q) ||
				(s.planType ?? "").toLowerCase().includes(q) ||
				(s.status ?? "").toLowerCase().includes(q)
		);
	}, [list, searchQuery]);

	if (isLoading) {
		return <TableSkeleton />;
	}

	if (isError) {
		return <TableError error={(error as unknown as Error) ?? new Error("Failed to load")} onRetry={() => refetch()} />;
	}

	if (list.length === 0) {
		return (
			<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
				<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
					<p className="text-lg font-semibold mb-1">No subscriptions found</p>
					<p className="text-sm text-muted-foreground">
						Subscriptions will appear here when teams have active service plans.
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
						placeholder="Search by plan, team, status..."
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
								<TableHead className="pl-6">Plan Name</TableHead>
								<TableHead>Plan Type</TableHead>
								<TableHead>Team</TableHead>
								<TableHead>Billing</TableHead>
								<TableHead>Next Renewal</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filtered.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
										No subscriptions match &quot;{searchQuery}&quot;
									</TableCell>
								</TableRow>
							) : (
								filtered.map((sub) => {
									const isActive = sub.status === "ACTIVE";
									const detail: SubscriptionDetail = {
										id: sub.id,
										planName: sub.planName,
										planType: sub.planType,
										hostingSubType: sub.hostingSubType,
										teamId: sub.teamId,
										teamName: sub.teamName,
										orderId: sub.orderId,
										subscriptionDate: sub.subscriptionDate,
										billingCycle: sub.billingCycle,
										nextRenewalDate: sub.nextRenewalDate,
										status: sub.status,
										autoRenew: sub.autoRenew,
										notes: sub.notes,
										createdAt: sub.createdAt,
									};
									return (
										<TableRow
											key={sub.id}
											className="cursor-pointer"
											onClick={() => onPlanNameClick?.(detail)}
										>
											<TableCell className="pl-6">
												<div className="flex items-center gap-2 font-medium">
													<Package className="h-4 w-4 text-muted-foreground" />
													{sub.planName}
												</div>
											</TableCell>
											<TableCell>{getPlanTypeDisplayName(sub.planType)}</TableCell>
											<TableCell>{sub.teamName ?? sub.teamId ?? "—"}</TableCell>
											<TableCell>{getBillingCycleDisplayName(sub.billingCycle)}</TableCell>
											<TableCell>{formatDate(sub.nextRenewalDate)}</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className={
														isActive
															? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
															: ""
													}
												>
													{sub.status}
												</Badge>
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
