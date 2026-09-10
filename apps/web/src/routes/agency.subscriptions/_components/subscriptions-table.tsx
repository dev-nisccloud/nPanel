"use client";

import * as React from "react";
import { RefreshCw, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CleanListCell } from "@/components/ui/clean-list";
import {
	SearchableCleanList,
	type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import { ViewDetailsButton } from "@/components/ui/list-row-actions";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import { authClient } from "@/lib/auth-client";
import { SubscriptionDeleteDialog } from "./subscription-delete-dialog";

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

export interface SubscriptionsTableProps {
	/** Optional: if provided, View link will use this instead of navigation */
	onViewSubscription?: (subscriptionId: string) => void;
	onEditSubscription?: (subscriptionId: string) => void;
	teamId?: string;
	unassignedOnly?: boolean;
}

export function SubscriptionsTable({
	onViewSubscription,
	onEditSubscription,
	teamId,
	unassignedOnly,
}: SubscriptionsTableProps) {
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
		teamId,
		unassignedOnly,
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

	const items: SearchableCleanListItem[] = filtered.map((sub) => {
		const subscribed = formatDate(sub.subscriptionDate);
		const expires = formatDate(sub.expiryDate);

		return {
			key: sub.id,
			title: (
				<span className="text-primary hover:underline">
					{displayServiceName(sub.productName, sub.productPlanName, sub.subscriptionName, sub.billingCycle)}
				</span>
			),
			description: (
				<Badge variant="outline" className={getStatusBadgeClass(sub.status)}>
					{sub.status.replace(/_/g, " ")}
				</Badge>
			),
			cells: {
				billing: <CleanListCell>{getBillingCycleDisplayName(sub.billingCycle)}</CleanListCell>,
				dates: (
					<div className="flex min-w-0 flex-col gap-0.5">
						<p className="truncate text-sm font-medium text-foreground">
							{subscribed ? `Subscribed ${subscribed}` : ""}
						</p>
						<CleanListCell>
							{expires ? `Expires ${expires}` : ""}
						</CleanListCell>
					</div>
				),
			},
			onClick: () => handleViewSubscription(sub.id),
			actions: (
				<>
					<ViewDetailsButton onClick={() => handleViewSubscription(sub.id)} />
					{onEditSubscription ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-7 px-2.5 text-xs"
							onClick={() => onEditSubscription(sub.id)}
						>
							<Pencil className="mr-1 h-3.5 w-3.5" />
							Edit
						</Button>
					) : null}
					{isSuperAdmin ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-7 px-2.5 text-xs text-destructive hover:text-destructive"
							onClick={() => setDeleteSubscriptionId(sub.id)}
						>
							<Trash2 className="mr-1 h-3.5 w-3.5" />
							Delete
						</Button>
					) : null}
				</>
			),
		};
	});

	return (
		<>
			<SearchableCleanList
				items={items}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				totalCount={list?.length ?? 0}
				isLoading={isLoading}
				isError={isError}
				error={(error as Error) ?? null}
				onRetry={() => refetch()}
				searchPlaceholder="Search by service, organization, status..."
				errorTitle="Failed to load subscriptions"
				emptyMessage={
					searchQuery.trim()
						? `No subscriptions match "${searchQuery}"`
						: "No subscriptions found. They will appear here when you create them."
				}
				columns={[
					{ key: "name", label: "Service" },
					{ key: "billing", label: "Billing", className: "w-28", hideBelow: "@lg" },
					{ key: "dates", label: "Dates", className: "w-56", hideBelow: "@xl" },
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
