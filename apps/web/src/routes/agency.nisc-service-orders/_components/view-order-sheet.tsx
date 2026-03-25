"use client";

import * as React from "react";
import { RotateCcw, ChevronRight } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

/** Shallow type for order items in the view to avoid deep tRPC type instantiation. */
type ViewOrderItem = {
	id: string;
	product: { name: string };
	productPlan: { name: string } | null;
	itemSubtotal: string;
	itemCurrency: string | null;
	status: string;
	provisioningError: string | null;
	provisioningErrorDetails: object | null;
};

/** Shallow type for processing logs to avoid deep tRPC type instantiation. */
type ViewProcessingLog = {
	id: string;
	step: string;
	createdAt: string;
	payload: unknown;
};

interface ViewOrderSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orderId: string | null;
	onRetrySuccess?: () => void;
}

export function ViewOrderSheet({
	open,
	onOpenChange,
	orderId,
	onRetrySuccess,
}: ViewOrderSheetProps) {
	const { data: order, isLoading } = trpc.niscServiceOrders.getById.useQuery(
		{ id: orderId! },
		{ enabled: open && !!orderId }
	);

	const retryMutation = trpc.niscServiceOrders.retry.useMutation({
		onSuccess: () => {
			toast.success("Order re-queued for processing");
			onRetrySuccess?.();
		},
		onError: (e: { message?: string }) => toast.error(e.message || "Retry failed"),
	});

	const canRetry =
		order && (order.status === "FAILED" || order.status === "PARTIAL");

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col sm:max-w-lg overflow-y-auto">
				<SheetHeader>
					<SheetTitle>NISC Order</SheetTitle>
					<SheetDescription>
						Order details and provisioning status
					</SheetDescription>
				</SheetHeader>

				{!orderId ? (
					<p className="text-muted-foreground text-sm">No order selected.</p>
				) : isLoading ? (
					<div className="space-y-4 pt-4">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-20 w-full" />
					</div>
				) : !order ? (
					<p className="text-muted-foreground text-sm w-full">Order not found.</p>
				) : (
					<div className="space-y-6 pt-4 w-full">
						<div className="w-full">
							<p className="text-sm font-medium text-muted-foreground">Order number</p>
							<p className="font-mono">{order.orderNumber}</p>
						</div>
						<div className="w-full">
							<p className="text-sm font-medium text-muted-foreground">User / Team</p>
							<p>{order.user?.name ?? order.team?.name ?? "—"}</p>
						</div>
						<div className="w-full">
							<p className="text-sm font-medium text-muted-foreground">Status</p>
							<Badge variant="outline">{order.status}</Badge>
						</div>
						{order.failureReason && (
							<div className="w-full">
								<p className="text-sm font-medium text-muted-foreground">Failure reason</p>
								<p className="text-sm text-destructive">{order.failureReason}</p>
							</div>
						)}
						<div className="w-full">
							<p className="text-sm font-medium text-muted-foreground mb-2">Items</p>
							<ul className="space-y-2 w-full">
								{(order.orderItems as unknown as ViewOrderItem[]).map((item) => (
									<li
										key={item.id}
										className="flex flex-col rounded border p-3 text-sm"
									>
										<span className="font-medium">
											{item.product.name} – {item.productPlan?.name ?? ""}
										</span>
										<span className="text-muted-foreground">
											{item.itemSubtotal} {item.itemCurrency} · {item.status}
										</span>
										{item.provisioningError && (
											<span className="text-destructive text-xs mt-1 block">
												{item.provisioningError}
											</span>
										)}
										{item.provisioningErrorDetails != null ? (
											<details className="mt-2">
												<summary className="text-muted-foreground text-xs cursor-pointer hover:text-foreground">
													Provider error details (raw response)
												</summary>
												<pre className="mt-1 p-2 rounded bg-muted/50 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px]">
													{JSON.stringify(
														item.provisioningErrorDetails,
														null,
														2
													)}
												</pre>
											</details>
										) : null}
									</li>
								))}
							</ul>
						</div>
						<div className="w-full">
							<p className="text-sm font-medium text-muted-foreground">Total</p>
							<p className="font-medium">
								{order.total} {order.currency}
							</p>
						</div>
						{order.processingLogs && order.processingLogs.length > 0 && (
							<div className="w-full">
								<Collapsible defaultOpen={false} className="group">
									<CollapsibleTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											className="flex items-center gap-2 p-0 h-auto font-medium text-muted-foreground hover:text-foreground"
										>
											<ChevronRight className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
											Processing log ({order.processingLogs.length} entries)
										</Button>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<ul className="mt-2 space-y-2 border rounded-md divide-y bg-muted/30 max-h-64 overflow-y-auto">
											{(order.processingLogs as unknown as ViewProcessingLog[]).map((log) => (
												<li key={log.id} className="p-2 text-xs">
													<div className="flex items-center gap-2 flex-wrap">
														<span className="font-mono font-medium text-foreground">
															{log.step}
														</span>
														<span className="text-muted-foreground">
															{new Date(log.createdAt).toISOString()}
														</span>
													</div>
													<pre className="mt-1 p-2 rounded bg-muted/50 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px]">
														{JSON.stringify(log.payload, null, 2)}
													</pre>
												</li>
											))}
										</ul>
										<p className="text-muted-foreground text-xs mt-1">
											Use this to trace provisioning steps and debug failures.
										</p>
									</CollapsibleContent>
								</Collapsible>
							</div>
						)}
						{canRetry && (
							<Button
								variant="outline"
								onClick={() => retryMutation.mutate({ niscOrderId: order.id })}
								disabled={retryMutation.isPending}
							>
								<RotateCcw className="mr-2 h-4 w-4" />
								{retryMutation.isPending ? "Re-queuing..." : "Retry order"}
							</Button>
						)}
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
