"use client";

import * as React from "react";
import { useLocation } from "react-router";
import { RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CleanListCell } from "@/components/ui/clean-list";
import {
	SearchableCleanList,
	type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import { ViewDetailsButton } from "@/components/ui/list-row-actions";
import { trpc } from "@/utils/trpc";
import {
	formatRemainingTokenCount,
	isProgressTrackedOneTime,
	isZeepoTokenProduct,
	ZEEPO_BILLING_LABEL,
} from "@/routes/agency.subscriptions/_components/zeepo-subscription";
import { isSubscriptionRenewable } from "@/lib/subscription-renewal-pricing";

function getBillingCycleDisplayName(cycle: string | null): string {
	if (!cycle) return "";
	const m: Record<string, string> = {
		MONTHLY: "Monthly",
		YEARLY: "Yearly",
		BIENNIALLY: "Biennially",
		CUSTOM: "Custom",
		ONE_TIME: "One-time",
	};
	return m[cycle] ?? cycle;
}

function formatDate(v: string | Date | null | undefined): string | null {
	if (!v) return null;
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString();
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

/** Same as agency: custom name for one-time, otherwise "Product - Plan (name)" */
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

export interface CustomerSubscriptionsTableProps {
	onViewSubscription?: (subscriptionId: string) => void;
	onRenewSubscription?: (subscriptionId: string) => void;
}

export function CustomerSubscriptionsTable({ onViewSubscription, onRenewSubscription }: CustomerSubscriptionsTableProps) {
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
				(s.subscriptionName ?? "").toLowerCase().includes(q) ||
				s.status.toLowerCase().includes(q),
		);
	}, [list, searchQuery]);

	if (!teamSlug) {
		return null;
	}

	const items: SearchableCleanListItem[] = filtered.map((sub) => {
		const subscribed = formatDate(sub.subscriptionDate);
		const expires = formatDate(sub.expiryDate);
		const zeepo = isZeepoTokenProduct(sub.productId);
		const showProgress = isProgressTrackedOneTime(sub.billingCycle, sub.productId);
		const renewable = isSubscriptionRenewable({
			status: sub.status,
			billingCycle: sub.billingCycle,
		});

		return {
			key: sub.id,
			title: (
				<span className="text-foreground hover:underline">
					{displayServiceName(
						sub.productName,
						sub.productPlanName,
						sub.subscriptionName,
						sub.billingCycle,
					)}
				</span>
			),
			cells: {
				status: (
					<div className="flex flex-col items-start gap-1">
						<Badge variant="outline" className={getStatusBadgeClass(sub.status)}>
							{sub.status.replace(/_/g, " ")}
						</Badge>
						{renewable ? (
							<Badge variant="destructive" className="animate-pulse">
								Renew Now
							</Badge>
						) : null}
					</div>
				),
				billing: (
					<CleanListCell>
						{zeepo ? ZEEPO_BILLING_LABEL : getBillingCycleDisplayName(sub.billingCycle)}
					</CleanListCell>
				),
				details: zeepo ? (
					<div className="flex min-w-0 flex-col gap-0.5">
						<p className="truncate text-sm font-medium text-foreground">Remaining tokens</p>
						<CleanListCell>{formatRemainingTokenCount(sub.remainingTokens)}</CleanListCell>
					</div>
				) : (
					<div className="flex min-w-0 flex-col gap-0.5">
						<p className="truncate text-sm font-medium text-foreground">
							{subscribed ? `Subscribed ${subscribed}` : ""}
						</p>
						<CleanListCell>
							{expires ? `Expires ${expires}` : ""}
						</CleanListCell>
					</div>
				),
				progress: (
					<CleanListCell>{showProgress ? `${sub.progressPercent ?? 0}%` : ""}</CleanListCell>
				),
			},
			onClick: onViewSubscription ? () => onViewSubscription(sub.id) : undefined,
			actions: (
				<>
					{renewable && onRenewSubscription ? (
						<Button
							variant="default"
							size="sm"
							className="h-7 px-3 text-xs"
							onClick={(e) => {
								e.stopPropagation();
								onRenewSubscription(sub.id);
							}}
						>
							Renew
						</Button>
					) : null}
					{onViewSubscription ? (
						<ViewDetailsButton onClick={() => onViewSubscription(sub.id)} />
					) : null}
				</>
			),
		};
	});

	return (
		<SearchableCleanList
			items={items}
			searchQuery={searchQuery}
			onSearchChange={setSearchQuery}
			totalCount={list?.length ?? 0}
			isLoading={isLoading}
			isError={isError}
			error={(error as Error) ?? null}
			onRetry={() => refetch()}
			searchPlaceholder="Search by service name or status..."
			errorTitle="Failed to load subscriptions"
			emptyMessage={
				searchQuery.trim()
					? `No subscriptions match "${searchQuery}"`
					: "No subscriptions found. Your company's subscriptions will appear here."
			}
			titleLines={3}
			columns={[
				{ key: "name", label: "Service" },
				{ key: "status", label: "Status", className: "w-36", hideBelow: "@md" },
				{ key: "billing", label: "Billing", className: "w-36", hideBelow: "@lg" },
				{ key: "details", label: "Details", className: "w-56", hideBelow: "@xl" },
				{ key: "progress", label: "Progress", className: "w-24", hideBelow: "@xl" },
				{ key: "actions", label: "Actions", align: "end" },
			]}
			toolbarActions={
				<Button
					variant="outline"
					size="icon"
					onClick={() => refetch()}
					disabled={isFetching}
					title="Refresh"
				>
					<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
				</Button>
			}
		/>
	);
}
