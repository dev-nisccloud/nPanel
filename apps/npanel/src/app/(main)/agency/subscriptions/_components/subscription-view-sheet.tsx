"use client";

import * as React from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Package,
	Building2,
	User,
	Calendar,
	RefreshCw,
	CreditCard,
	FileText,
	PauseCircle,
	PlayCircle,
	XCircle,
	Mail,
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

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

function serviceName(productName: string, productPlanName: string | null): string {
	if (!productPlanName?.trim()) return productName;
	return `${productName} - ${productPlanName}`;
}

interface SubscriptionViewSheetProps {
	subscriptionId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSendRenewalEmail?: (subscriptionId: string) => void;
}

export function SubscriptionViewSheet({
	subscriptionId,
	open,
	onOpenChange,
	onSendRenewalEmail,
}: SubscriptionViewSheetProps) {
	const utils = trpc.useUtils();
	const { data: sub, isLoading } = trpc.clientSubscriptions.getById.useQuery(
		{ id: subscriptionId! },
		{ enabled: open && !!subscriptionId }
	);

	const updateStatus = trpc.clientSubscriptions.update.useMutation({
		onSuccess: () => {
			utils.clientSubscriptions.getById.invalidate({ id: subscriptionId! });
			utils.clientSubscriptions.listForAgency.invalidate();
			toast.success("Status updated");
		},
		onError: (e) => toast.error(e.message),
	});

	const cancelSubscription = trpc.clientSubscriptions.cancel.useMutation({
		onSuccess: () => {
			utils.clientSubscriptions.getById.invalidate({ id: subscriptionId! });
			utils.clientSubscriptions.listForAgency.invalidate();
			onOpenChange(false);
			toast.success("Subscription cancelled");
		},
		onError: (e) => toast.error(e.message),
	});

	const productName = sub?.product?.name ?? "";
	const productPlanName = sub?.productPlan?.name ?? null;
	const teamName = sub?.team?.name ?? null;
	const userName = sub?.userName ?? null;
	const displayOwner = userName ?? teamName ?? "—";

	const isSuspended = sub?.status === "SUSPENDED";
	const canReactivate = isSuspended;
	const canSuspend = sub?.status === "ACTIVE" || sub?.status === "PENDING";
	const canCancel = sub?.status !== "CANCELLED" && sub?.status !== "EXPIRED";

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col w-full sm:max-w-lg overflow-hidden">
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						<Package className="h-5 w-5 shrink-0" />
						{subscriptionId && isLoading ? (
							<Skeleton className="h-5 w-48" />
						) : (
							serviceName(productName, productPlanName)
						)}
					</SheetTitle>
					<SheetDescription>Subscription details and actions</SheetDescription>
				</SheetHeader>

				{isLoading ? (
					<div className="flex-1 space-y-4 py-4">
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
					</div>
				) : sub ? (
					<ScrollArea className="flex-1 -mx-4 px-4">
						<div className="space-y-6 py-4">
							{/* Overview */}
							<section className="space-y-3">
								<h3 className="text-sm font-medium text-muted-foreground">Overview</h3>
								<div className="rounded-lg border bg-muted/30 p-4 space-y-3">
									<div className="flex flex-wrap items-center gap-2">
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
										<span className="text-muted-foreground">Team / User</span>
										<span>{displayOwner}</span>
									</div>
								</div>
							</section>

							<Separator />

							{/* Dates */}
							<section className="space-y-3">
								<h3 className="text-sm font-medium text-muted-foreground">Dates</h3>
								<div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Subscription date</span>
										<span>{formatDate(sub.subscriptionDate)}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Expiry date</span>
										<span>{formatDate(sub.expiryDate)}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Next renewal</span>
										<span>{formatDate(sub.nextRenewalDate)}</span>
									</div>
								</div>
							</section>

							<Separator />

							{/* Billing */}
							<section className="space-y-3">
								<h3 className="text-sm font-medium text-muted-foreground">Billing</h3>
								<div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Billing cycle</span>
										<span>{getBillingCycleDisplayName(sub.billingCycle)}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Auto renew</span>
										<span>{sub.autoRenew ? "Yes" : "No"}</span>
									</div>
									{(sub.agreedPrice ?? sub.agreedCurrency) && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">Agreed price</span>
											<span>
												{sub.agreedPrice} {sub.agreedCurrency ?? ""}
											</span>
										</div>
									)}
								</div>
							</section>

							{sub.notes && (
								<>
									<Separator />
									<section className="space-y-3">
										<h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
										<div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
											{sub.notes}
										</div>
									</section>
								</>
							)}

							<Separator />

							{/* Actions */}
							<section className="space-y-3">
								<h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
								<div className="flex flex-wrap gap-2">
									{canSuspend && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => updateStatus.mutate({ id: sub.id, status: "SUSPENDED" })}
											disabled={updateStatus.isPending}
										>
											<PauseCircle className="mr-2 h-4 w-4" />
											Suspend service
										</Button>
									)}
									<Button
										variant="outline"
										size="sm"
										onClick={() => onSendRenewalEmail?.(sub.id)}
										disabled={(!sub.teamId && !sub.userId) || !onSendRenewalEmail}
									>
										<Mail className="mr-2 h-4 w-4" />
										Send renewal email
									</Button>
									{canReactivate && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => updateStatus.mutate({ id: sub.id, status: "ACTIVE" })}
											disabled={updateStatus.isPending}
										>
											<PlayCircle className="mr-2 h-4 w-4" />
											Re-activate service
										</Button>
									)}
									{canCancel && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => cancelSubscription.mutate({ id: sub.id })}
											disabled={cancelSubscription.isPending}
											className="text-destructive border-destructive/50 hover:bg-destructive/10"
										>
											<XCircle className="mr-2 h-4 w-4" />
											Cancel service
										</Button>
									)}
								</div>
							</section>
						</div>
					</ScrollArea>
				) : (
					<div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
						Subscription not found
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
