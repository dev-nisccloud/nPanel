"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { Building2, Calendar, CreditCard, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

const orderTypeNames: Record<string, string> = {
	DOMAIN_REGISTRATION: "Domain Registration",
	DOMAIN_RENEWAL: "Domain Renewal",
	DOMAIN_TRANSFER: "Domain Transfer",
	HOSTING_SUBSCRIPTION: "Hosting Subscription",
	HOSTING_RENEWAL: "Hosting Renewal",
	HOSTING_UPGRADE: "Hosting Upgrade",
	EMAIL_HOSTING: "Email Hosting",
	SSL_CERTIFICATE: "SSL Certificate",
	BACKUP_SERVICE: "Backup Service",
	CUSTOM_SERVICE: "Custom Service",
};

interface OrderViewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orderId: string | null;
}

export function OrderViewDialog({ open, onOpenChange, orderId }: OrderViewDialogProps) {
	const { data: order, isLoading, error } = trpc.orders.getById.useQuery(
		{ id: orderId! },
		{ enabled: open && !!orderId }
	);

	const getStatusBadge = (status: string) => {
		const isActive = status === "COMPLETED" || status === "PROCESSING";
		const icons: Record<string, React.ElementType> = {
			PENDING: Clock,
			PROCESSING: AlertCircle,
			COMPLETED: CheckCircle2,
			FAILED: XCircle,
			CANCELLED: XCircle,
			REFUNDED: AlertCircle,
			PARTIAL: AlertCircle,
		};
		const Icon = icons[status] || Clock;
		return (
			<Badge
				variant="outline"
				className={
					isActive
						? "bg-green-600 text-white border-green-600 hover:bg-green-600 hover:text-white gap-1"
						: "gap-1"
				}
			>
				<Icon className="h-3 w-3" />
				{status}
			</Badge>
		);
	};

	if (isLoading) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-2xl">
					<div className="flex items-center justify-center py-12">
						<Spinner size={32} />
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	if (error || !order) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-2xl">
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<p className="text-destructive mb-4">{error?.message || "Order not found"}</p>
						<Button onClick={() => onOpenChange(false)} variant="outline">
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3 flex-wrap">
						{order.orderNumber}
						{getStatusBadge(order.status)}
						<Badge variant="outline">{orderTypeNames[order.type] || order.type}</Badge>
					</DialogTitle>
				</DialogHeader>
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Building2 className="h-4 w-4" />
							<span>Organization</span>
						</div>
						<p className="font-medium">{order.team?.name || "N/A"}</p>
					</div>
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Calendar className="h-4 w-4" />
							<span>Created</span>
						</div>
						<p className="font-medium">
							{new Date(order.createdAt).toLocaleDateString()}
						</p>
					</div>
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground">
							<CreditCard className="h-4 w-4" />
							<span>Total</span>
						</div>
						<p className="font-medium">
							{order.total
								? `${order.currency} ${parseFloat(order.total).toFixed(2)}`
								: "N/A"}
						</p>
					</div>
					{order.completedAt && (
						<div className="space-y-1">
							<div className="flex items-center gap-2 text-muted-foreground">
								<CheckCircle2 className="h-4 w-4" />
								<span>Completed</span>
							</div>
							<p className="font-medium">
								{new Date(order.completedAt).toLocaleDateString()}
							</p>
						</div>
					)}
				</div>
				{order.orderItems && order.orderItems.length > 0 && (
					<div className="pt-4 border-t">
						<p className="text-sm font-medium text-muted-foreground mb-2">Order Items</p>
						<div className="space-y-2">
							{order.orderItems.map((item) => (
								<div key={item.id} className="p-3 bg-muted/50 rounded-lg border text-sm">
									<div className="flex justify-between gap-2">
										<span className="font-medium">
											{item.niscServicePlan?.name || "Unknown Plan"}
										</span>
										<span>
											{item.itemCurrency} {parseFloat(item.itemPrice).toFixed(2)}
										</span>
									</div>
									{item.domainName && (
										<p className="text-muted-foreground text-xs mt-1">Domain: {item.domainName}</p>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
