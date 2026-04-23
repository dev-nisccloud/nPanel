"use client";

import * as React from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Building2, User } from "lucide-react";
import { trpc } from "@/utils/trpc";

function getBillingCycleDisplayName(cycle: string | null): string {
	if (!cycle) return " ";
	const m: Record<string, string> = {
		MONTHLY: "Monthly",
		YEARLY: "Yearly",
		BIENNIALLY: "Biennially",
		CUSTOM: "Custom",
	};
	return m[cycle] ?? cycle;
}

function formatDate(v: string | Date | null | undefined): string {
	if (!v) return " ";
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? " " : d.toLocaleDateString();
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

function serviceName(productName: string, productPlanName: string | null): string {
	if (!productPlanName?.trim()) return productName;
	return `${productName} - ${productPlanName}`;
}

interface CustomerSubscriptionViewSheetProps {
	subscriptionId: string | null;
	teamSlug: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/** Read-only subscription details for customer. No suspend, cancel, or send-email actions. */
export function CustomerSubscriptionViewSheet({
	subscriptionId,
	teamSlug,
	open,
	onOpenChange,
}: CustomerSubscriptionViewSheetProps) {
	const { data: sub, isLoading } = trpc.clientSubscriptions.getById.useQuery(
		{ id: subscriptionId!, teamSlug: teamSlug ?? undefined },
		{ enabled: open && !!subscriptionId && !!teamSlug }
	);

	const productName = sub?.product?.name ?? "";
	const productPlanName = sub?.productPlan?.name ?? null;
	const teamName = sub?.team?.name ?? null;
	const userName = sub?.userName ?? null;
	const displayOwner = userName ?? teamName ?? " ";

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
				<SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Package className="h-6 w-6 text-primary" />
						</div>
						<div className="min-w-0 flex-1">
							<SheetTitle className="truncate">
								{subscriptionId && isLoading ? (
									<Skeleton className="h-6 w-48" />
								) : (
									serviceName(productName, productPlanName) || "Subscription"
								)}
							</SheetTitle>
							<SheetDescription>
								Subscription details
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				{isLoading ? (
					<div className="flex-1 space-y-4 px-6 py-4">
						<Skeleton className="h-20 w-full rounded-lg" />
						<Skeleton className="h-24 w-full rounded-lg" />
						<Skeleton className="h-24 w-full rounded-lg" />
					</div>
				) : sub ? (
					<ScrollArea className="flex-1 min-h-0 px-6 pr-4 pb-6">
						<div className="space-y-6">
							{/* Overview */}
							<section className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">Overview</h3>
								<div className="rounded-lg border bg-card p-4 space-y-3">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<span className="text-sm text-muted-foreground">Status</span>
										<Badge variant="outline" className={getStatusBadgeClass(sub.status)}>
											{sub.status}
										</Badge>
									</div>
									<div className="flex items-center gap-2 text-sm">
										{sub.userId ? (
											<User className="h-4 w-4 text-muted-foreground shrink-0" />
										) : (
											<Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
										)}
										<span className="text-muted-foreground">Owner</span>
										<span className="font-medium">{displayOwner}</span>
									</div>
								</div>
							</section>

							{/* Dates */}
							<section className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">Dates</h3>
								<div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Subscription date</span>
										<span className="font-medium">{formatDate(sub.subscriptionDate)}</span>
									</div>
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Expiry date</span>
										<span className="font-medium">{formatDate(sub.expiryDate)}</span>
									</div>
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Next renewal</span>
										<span className="font-medium">{formatDate(sub.nextRenewalDate)}</span>
									</div>
								</div>
							</section>

							{/* Billing */}
							<section className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">Billing</h3>
								<div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Billing cycle</span>
										<span className="font-medium">{getBillingCycleDisplayName(sub.billingCycle)}</span>
									</div>
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Auto renew</span>
										<span className="font-medium">{sub.autoRenew ? "Yes" : "No"}</span>
									</div>
									{(sub.agreedPrice != null || sub.agreedCurrency) && (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Agreed price</span>
											<span className="font-medium">
												{sub.agreedPrice != null ? sub.agreedPrice : " "}{" "}
												{sub.agreedCurrency ?? ""}
											</span>
										</div>
									)}
								</div>
							</section>

							{sub.notes ? (
								<section className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
									<div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
										{sub.notes}
									</div>
								</section>
							) : null}
						</div>
					</ScrollArea>
				) : (
					<div className="flex-1 flex items-center justify-center px-6 py-12 text-sm text-muted-foreground">
						Subscription not found
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
