"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
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
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

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
		onError: (e) => toast.error(e.message || "Retry failed"),
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
								{order.orderItems.map((item) => (
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
											<span className="text-destructive text-xs mt-1">
												{item.provisioningError}
											</span>
										)}
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
