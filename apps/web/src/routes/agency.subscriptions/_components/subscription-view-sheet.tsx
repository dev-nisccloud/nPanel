"use client";

import * as React from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Package,
	Building2,
	User,
	PauseCircle,
	PlayCircle,
	XCircle,
	Mail,
	Server,
	Trash2,
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth-client";
import { HostingSubscriptionSuspendDialog } from "@/routes/agency.hosting/_components/hosting-subscription-suspend-dialog";
import { useHostingSubscriptionSuspend } from "@/routes/agency.hosting/_components/use-hosting-subscription-suspend";
import {
	getPleskSubscriptionDisplayName,
	getPleskSubscriptionId,
	isPleskLinkedSubscription,
} from "./plesk-subscription-utils";
import {
	SubscriptionStatusConfirmDialog,
	type SubscriptionStatusConfirmAction,
} from "./subscription-status-confirm-dialog";
import { SubscriptionDeleteDialog } from "./subscription-delete-dialog";
import { captureEvent } from "@/lib/posthog";

function getBillingCycleDisplayName(cycle: string | null): string {
	if (!cycle) return "- ";
	const m: Record<string, string> = {
		MONTHLY: "Monthly",
		YEARLY: "Yearly",
		BIENNIALLY: "Biennially",
		CUSTOM: "Custom",
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
	const { data: session } = authClient.useSession();
	const isSuperAdmin =
		(session?.user as { role?: string } | undefined)?.role === "AGENCY_SUPER_ADMIN";
	const { data: sub, isLoading } = trpc.clientSubscriptions.getById.useQuery(
		{ id: subscriptionId! },
		{ enabled: open && !!subscriptionId },
	);

	React.useEffect(() => {
		if (open && subscriptionId) {
			captureEvent("subscription_viewed", { subscription_id: subscriptionId });
		}
	}, [open, subscriptionId]);

	const syncNiscStatus = trpc.clientSubscriptions.update.useMutation({
		onSuccess: (_data, variables) => {
			if (variables.status) {
				captureEvent("subscription_status_changed", { status: variables.status });
			}
			utils.clientSubscriptions.getById.invalidate({ id: subscriptionId! });
			utils.clientSubscriptions.listForAgency.invalidate();
		},
		onError: (e) => toast.error(e.message),
	});

	const pleskSuspendActions = useHostingSubscriptionSuspend({
		onSuccess: ({ action }) => {
			if (!subscriptionId) return;
			syncNiscStatus.mutate({
				id: subscriptionId,
				status: action === "suspend" ? "SUSPENDED" : "ACTIVE",
			});
		},
	});

	const cancelSubscription = trpc.clientSubscriptions.cancel.useMutation({
		onSuccess: () => {
			captureEvent("hosting_subscription_cancelled");
			captureEvent("subscription_status_changed", { status: "CANCELLED" });

			utils.clientSubscriptions.getById.invalidate({ id: subscriptionId! });
			utils.clientSubscriptions.listForAgency.invalidate();
			onOpenChange(false);
			toast.success("Subscription cancelled");
		},
		onError: (e) => toast.error(e.message),
	});

	const deleteSubscription = trpc.clientSubscriptions.delete.useMutation({
		onSuccess: () => {
			captureEvent("subscription_deleted");
			utils.clientSubscriptions.listForAgency.invalidate();
			setDeleteDialogOpen(false);
			onOpenChange(false);
			toast.success("Subscription deleted");
		},
		onError: (e) => toast.error(e.message),
	});

	const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

	React.useEffect(() => {
		if (!open) setDeleteDialogOpen(false);
	}, [open]);

	const productName = sub?.product?.name ?? "";
	const productPlanName = sub?.productPlan?.name ?? null;
	const teamName = sub?.team?.name ?? null;
	const userName = sub?.userName ?? null;
	const displayOwner = userName ?? "- ";

	const isSuspended = sub?.status === "SUSPENDED";
	const canReactivate = isSuspended;
	const canSuspend = sub?.status === "ACTIVE" || sub?.status === "PENDING";
	const canCancel = sub?.status !== "CANCELLED" && sub?.status !== "EXPIRED";

	const hostingServiceId = sub ? getPleskSubscriptionId(sub) : null;
	const isHostingLinked = sub ? isPleskLinkedSubscription(sub) : false;
	const hostingDisplayName = sub ? getPleskSubscriptionDisplayName(sub) : "this subscription";
	const subscriptionDisplayName =
		sub?.name?.trim() ||
		sub?.primaryDomain?.trim() ||
		serviceName(productName, productPlanName) ||
		"this subscription";

	const [statusConfirmAction, setStatusConfirmAction] =
		React.useState<SubscriptionStatusConfirmAction | null>(null);

	const isActionPending =
		syncNiscStatus.isPending ||
		pleskSuspendActions.isPending ||
		cancelSubscription.isPending ||
		deleteSubscription.isPending;

	const handleSuspend = () => {
		if (!sub) return;
		if (hostingServiceId) {
			pleskSuspendActions.requestSuspend(hostingServiceId, hostingDisplayName);
			return;
		}
		setStatusConfirmAction("suspend");
	};

	const handleReactivate = () => {
		if (!sub) return;
		if (hostingServiceId) {
			pleskSuspendActions.requestUnsuspend(hostingServiceId, hostingDisplayName);
			return;
		}
		setStatusConfirmAction("reactivate");
	};

	const confirmStatusChange = () => {
		if (!sub || !statusConfirmAction) return;
		const status = statusConfirmAction === "suspend" ? "SUSPENDED" : "ACTIVE";
		syncNiscStatus.mutate(
			{ id: sub.id, status },
			{
				onSuccess: () => {
					captureEvent(statusConfirmAction === "suspend" ? "hosting_subscription_suspended" : "hosting_subscription_resumed");
					setStatusConfirmAction(null);
					toast.success(
						statusConfirmAction === "suspend"
							? "Subscription suspended"
							: "Subscription reactivated",
					);
				},
			},
		);
	};

	return (
		<>
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
								Subscription details and actions
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
					<>
						<ScrollArea className="flex-1 min-h-0 px-6 pr-4">
							<div className="space-y-6 pb-6">
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
										{teamName ? (
											<div className="flex items-center gap-2 text-sm">
												<Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
												<span className="text-muted-foreground">Team</span>
												<span className="font-medium">{teamName}</span>
											</div>
										) : null}
										{isHostingLinked && hostingServiceId ? (
											<div className="flex items-center gap-2 text-sm">
												<Server className="h-4 w-4 text-muted-foreground shrink-0" />
												<span className="text-muted-foreground">Hosting service</span>
												<span className="font-medium">Linked</span>
											</div>
										) : null}
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
													{sub.agreedPrice != null ? sub.agreedPrice : "- "}{" "}
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

						<SheetFooter className="flex-shrink-0 flex-wrap gap-2 px-6 py-4 border-t bg-muted/30">
							{canSuspend && (
								<Button
									variant={hostingServiceId ? "destructive" : "outline"}
									size="sm"
									onClick={handleSuspend}
									disabled={isActionPending}
								>
									<PauseCircle className="mr-2 h-4 w-4" />
									Suspend
								</Button>
							)}
							<Button
								variant="outline"
								size="sm"
								onClick={() => onSendRenewalEmail?.(sub.id)}
								disabled={(!sub.teamId && !sub.userId) || !onSendRenewalEmail || isActionPending}
							>
								<Mail className="mr-2 h-4 w-4" />
								Send renewal email
							</Button>
							{canReactivate && (
								<Button
									variant="outline"
									size="sm"
									onClick={handleReactivate}
									disabled={isActionPending}
								>
									<PlayCircle className="mr-2 h-4 w-4" />
									Re-activate
								</Button>
							)}
							{canCancel && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => cancelSubscription.mutate({ id: sub.id })}
									disabled={isActionPending}
									className="text-destructive border-destructive/50 hover:bg-destructive/10"
								>
									<XCircle className="mr-2 h-4 w-4" />
									Cancel service
								</Button>
							)}
							{isSuperAdmin && (
								<Button
									variant="destructive"
									size="sm"
									onClick={() => setDeleteDialogOpen(true)}
									disabled={isActionPending}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</Button>
							)}
						</SheetFooter>
					</>
				) : (
					<div className="flex-1 flex items-center justify-center px-6 py-12 text-sm text-muted-foreground">
						Subscription not found
					</div>
				)}
			</SheetContent>
		</Sheet>

		<HostingSubscriptionSuspendDialog
			dialog={pleskSuspendActions.dialog}
			isPending={pleskSuspendActions.isPending}
			onOpenChange={pleskSuspendActions.setDialogOpen}
			onConfirm={pleskSuspendActions.confirm}
			context="subscription"
		/>

		<SubscriptionStatusConfirmDialog
			open={statusConfirmAction !== null}
			action={statusConfirmAction}
			subscriptionName={subscriptionDisplayName}
			isPending={syncNiscStatus.isPending}
			onOpenChange={(open) => {
				if (!open) setStatusConfirmAction(null);
			}}
			onConfirm={confirmStatusChange}
		/>

		<SubscriptionDeleteDialog
			open={deleteDialogOpen}
			subscriptionName={subscriptionDisplayName}
			isPending={deleteSubscription.isPending}
			onOpenChange={setDeleteDialogOpen}
			onConfirm={() => {
				if (sub?.id) deleteSubscription.mutate({ id: sub.id });
			}}
		/>
		</>
	);
}
